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

## Redeploy (SSH in and run)
```bash
cd /var/www/oylabs
git pull origin main
npm ci --production=false
npm run build
pm2 restart oylabs
```

## HTTPS (run after DNS propagates)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d oylabs.co -d www.oylabs.co
```
