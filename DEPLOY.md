# OY Labs Deployment Reference

## EC2 Instance
| Field | Value |
|---|---|
| Instance ID | `i-08c03204f28d71228` |
| Elastic IP | `34.239.24.172` |
| Instance Name | `oylabs.co` |
| Type | `t3.small` |
| AMI | `ami-0fbcf351e82d18381` (Ubuntu 24.04 LTS) |
| Region | `us-east-1` |
| Security Group | `sg-06f0bb8e03164eb30` (ports 22/80/443/3000) |
| Key Pair | `oylabs-key` → `~/.ssh/oylabs-key.pem` |

## GitHub Repository
https://github.com/omeryilmazpazarly/oylabs-co

## SSH Access
```bash
ssh -i ~/.ssh/oylabs-key.pem ubuntu@34.239.24.172
```

## Deploy URL
http://34.239.24.172  (point oylabs.co A record here)

## DNS Setup (Point at your registrar)
```
A     oylabs.co      34.239.24.172
A     www.oylabs.co  34.239.24.172
```

## App Stack on Server
- **Runtime:** Node.js 20 LTS
- **Process Manager:** PM2 (`pm2 list`, `pm2 logs oylabs`)
- **Reverse Proxy:** Nginx → port 3000
- **App Path:** `/var/www/oylabs/`
- **Deploy Log:** `/var/log/oylabs-deploy.log`

## Admin Panel
URL: `http://34.239.24.172/admin`
Default PIN: `0y1abs`
Override: set `NEXT_PUBLIC_ADMIN_PIN` in `.env.production` and rebuild.

## Persistent Data Layout (IMPORTANT)
The app runs in Next `output: 'standalone'` mode; `server.js` chdir's into
`.next/standalone/`, so the app resolves its data paths relative to that dir.
`npm run build` wipes `.next/`, so the live data lives OUTSIDE it and is
symlinked in:

| Data | Source of truth | Symlink (runtime path) |
|---|---|---|
| SQLite DB | `/var/www/oylabs/data/portfolio.db` | `.next/standalone/data → /var/www/oylabs/data` |
| Uploads | `/var/www/oylabs/public/uploads/` | `.next/standalone/public/uploads → /var/www/oylabs/public/uploads` |

Nginx serves `/uploads/` directly from `/var/www/oylabs/public/uploads/`
(see `/etc/nginx/sites-available/oylabs`). DB backups land in
`/var/backups/oylabs/` on every deploy.

## Redeploy (SSH in and run)
**Never run `npm run build` by hand followed by a pm2 restart without
re-creating the symlinks — use the script:**
```bash
cd /var/www/oylabs
./deploy.sh
```
The script backs up the DB, pulls `main`, builds, rsyncs `public/` and
`.next/static/` into the standalone dir, re-creates the data/uploads
symlinks, restarts pm2, and smoke-tests `/portfolio`.

Note: pm2 runs as root via nvm. If `pm2` isn't on the ubuntu user's PATH:
```bash
sudo /root/.nvm/versions/node/v20.20.2/bin/node \
  /root/.nvm/versions/node/v20.20.2/lib/node_modules/pm2/bin/pm2 <cmd> oylabs
```

## HTTPS (run after DNS propagates)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d oylabs.co -d www.oylabs.co
```
