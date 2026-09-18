#!/usr/bin/env bash
# OY Labs production deploy — run on the server as ubuntu from /var/www/oylabs.
#
# Why this script exists: the app runs in Next `output: 'standalone'` mode and
# server.js chdir's into .next/standalone, so the app resolves data/ and
# public/uploads/ relative to that directory. `npm run build` wipes .next/,
# so the live SQLite DB and uploads must live OUTSIDE it:
#   DB      -> /var/www/oylabs/data/portfolio.db
#   uploads -> /var/www/oylabs/public/uploads/
# This script rebuilds, re-assembles the standalone dir, and re-creates the
# symlinks that point the runtime at those stable locations.
set -euo pipefail

APP_DIR="/var/www/oylabs"
DATA_DIR="$APP_DIR/data"              # live SQLite (source of truth)
UPLOADS_DIR="$APP_DIR/public/uploads" # live uploads (source of truth)
STANDALONE="$APP_DIR/.next/standalone"
PM2="sudo /root/.nvm/versions/node/v20.20.2/bin/node /root/.nvm/versions/node/v20.20.2/lib/node_modules/pm2/bin/pm2"

cd "$APP_DIR"

# 1. Backup the live DBs before anything else.
STAMP="$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p /var/backups/oylabs
sudo cp -a "$DATA_DIR/portfolio.db" "/var/backups/oylabs/portfolio.db.$STAMP"
# messaging.db is written continuously (WAL), so use SQLite's online backup, not cp.
if [ -f "$DATA_DIR/messaging.db" ]; then
  node -e "require('better-sqlite3')(process.argv[1]).backup(process.argv[2]).then(() => console.log('messaging.db backed up'))" \
    "$DATA_DIR/messaging.db" "/tmp/messaging.db.$STAMP"
  sudo mv "/tmp/messaging.db.$STAMP" "/var/backups/oylabs/messaging.db.$STAMP"
  sudo chmod 600 "/var/backups/oylabs/messaging.db.$STAMP"
fi

# 2. Preflight: if standalone/data is a REAL directory (not a symlink), the
#    build would destroy live data. Never proceed automatically.
if [ -e "$STANDALONE/data" ] && [ ! -L "$STANDALONE/data" ]; then
  echo "ABORT: $STANDALONE/data is a real directory, not a symlink." >&2
  echo "It may hold live data. Reconcile it with $DATA_DIR manually, then re-run." >&2
  exit 1
fi
# Uploads are individually-named files, so a real dir can be merged out safely.
if [ -e "$STANDALONE/public/uploads" ] && [ ! -L "$STANDALONE/public/uploads" ]; then
  rsync -a "$STANDALONE/public/uploads/" "$UPLOADS_DIR/"
  rm -rf "$STANDALONE/public/uploads"
fi

# 3. Pull + build (regenerates .next/ including the standalone dir).
git pull origin main
npm ci
# The app runs as root and writes its image cache inside .next; give it back to
# ubuntu or the build can't clear the previous output.
sudo chown -R ubuntu:ubuntu "$APP_DIR/.next" 2>/dev/null || true
npm run build

# 4. Assemble runtime assets Next does not copy into standalone by itself.
rsync -a --exclude uploads public/ "$STANDALONE/public/"
rsync -a .next/static/ "$STANDALONE/.next/static/"

# 5. Point the runtime at the persistent data (server.js chdir's into standalone).
#    The build just recreated standalone/, so a real directory here can only be a
#    traced copy made by the build; remove it so the link isn't created inside it.
for link in "$STANDALONE/data" "$STANDALONE/public/uploads"; do
  if [ -e "$link" ] && [ ! -L "$link" ]; then rm -rf "$link"; fi
done
ln -sfn "$DATA_DIR" "$STANDALONE/data"
ln -sfn "$UPLOADS_DIR" "$STANDALONE/public/uploads"
# Next copies .env.production into standalone at build time; link it instead so
# editing the real file (e.g. adding a key) takes effect on the next restart.
rm -f "$STANDALONE/.env.production"
ln -s "$APP_DIR/.env.production" "$STANDALONE/.env.production"
# Guard against the July failure mode: a link created inside the real uploads folder.
if [ -L "$UPLOADS_DIR/uploads" ]; then rm "$UPLOADS_DIR/uploads"; fi
# The app runs as root under pm2. Create messaging.db as ubuntu first: SQLite
# gives its -wal/-shm files the database file's owner, so backups and
# scripts/create-staff-user.mjs keep working as ubuntu.
[ -e "$DATA_DIR/messaging.db" ] || touch "$DATA_DIR/messaging.db"
sudo chown ubuntu:ubuntu "$DATA_DIR"/messaging.db*

# 6. Restart and smoke-test (the app can take a few seconds to start).
$PM2 restart oylabs --update-env
code=000
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/portfolio || true)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "smoke test: /portfolio -> $code"
[ "$code" = "200" ] || { echo "ABORT: app not healthy after restart. Check: sudo tail -50 /root/.pm2/logs/oylabs-error.log" >&2; exit 1; }
echo "Deployed. Verify https://oylabs.co/portfolio and an /uploads/ image."
