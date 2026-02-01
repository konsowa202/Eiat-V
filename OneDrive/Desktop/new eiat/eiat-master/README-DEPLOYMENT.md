# دليل رفع مشروع EIAT على Hostinger VPS

## 📋 المتطلبات
- VPS من Hostinger (KVM 2)
- SSH access إلى السيرفر
- Domain name (اختياري)

## 🚀 خطوات الرفع السريع

### 1. الاتصال بالسيرفر
```bash
ssh root@62.72.35.127
```

### 2. رفع ملفات الـ deployment
ارفع الملفات التالية إلى السيرفر:
- `deploy.sh`
- `setup-nginx.sh`

يمكنك استخدام `scp`:
```bash
scp deploy.sh root@62.72.35.127:/root/
scp setup-nginx.sh root@62.72.35.127:/root/
```

### 3. تشغيل سكريبت الرفع
```bash
# جعل الملفات قابلة للتنفيذ
chmod +x deploy.sh setup-nginx.sh

# تشغيل سكريبت الرفع
./deploy.sh
```

### 4. إعداد Nginx (بعد الرفع)
```bash
# استبدل your-domain.com بـ domain الخاص بك
./setup-nginx.sh your-domain.com
```

## 📝 الخطوات اليدوية (بدون سكريبت)

### 1. تثبيت المتطلبات
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx
npm install -g pnpm pm2
```

### 2. Clone المشروع
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/konsowa202/Eiat-V.git eiat
cd eiat
```

### 3. إعداد .env
```bash
cd packages/eiat-site
nano .env
```

أضف:
```env
SANITY_TOKEN=sklM1PFIoMYkoolRlynCkgNgOp1YTF2OGOBRL0P1mKieYiHCfNNTRc7fL13NufBospyOWiCMtjspAHA9P5WE2ca8TMd6egKx4nzW71HrS3Tau73ks81gQJlD3WFb2bqCJ5TsEgXUQAOvOpcnu95HjyeD1qUbR43GMY4m3QaraNIQYpLn3kWT
NODE_ENV=production
PORT=3000
```

### 4. بناء وتشغيل المشروع
```bash
cd /var/www/eiat
pnpm install
pnpm build
cd packages/eiat-site
pm2 start npm --name "eiat-site" -- start
pm2 save
pm2 startup
```

### 5. إعداد Nginx
```bash
nano /etc/nginx/sites-available/eiat
```

أضف:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/eiat /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🔧 أوامر مفيدة

### PM2 Management
```bash
pm2 status              # عرض الحالة
pm2 logs eiat-site      # عرض الـ logs
pm2 restart eiat-site   # إعادة التشغيل
pm2 stop eiat-site      # إيقاف
pm2 delete eiat-site    # حذف
```

### Update المشروع
```bash
cd /var/www/eiat
git pull origin master
pnpm install
pnpm build
pm2 restart eiat-site
```

### عرض الـ Logs
```bash
# PM2 logs
pm2 logs eiat-site

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## 🔒 الأمان

### Firewall
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### SSL Certificate (Let's Encrypt)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## 📊 Monitoring

### Check Resources
```bash
# CPU & Memory
htop

# Disk Space
df -h

# PM2 Monitoring
pm2 monit
```

## 🆘 Troubleshooting

### المشروع لا يعمل
```bash
# تحقق من PM2
pm2 status
pm2 logs eiat-site

# تحقق من البورت
netstat -tulpn | grep 3000
```

### Nginx لا يعمل
```bash
# تحقق من الإعدادات
nginx -t

# إعادة التشغيل
systemctl restart nginx

# عرض الأخطاء
tail -f /var/log/nginx/error.log
```

### مشاكل في الـ Build
```bash
# تنظيف node_modules
rm -rf node_modules
rm -rf packages/*/node_modules

# إعادة التثبيت
pnpm install
pnpm build
```

## 📞 الدعم
إذا واجهت أي مشاكل، تحقق من:
1. PM2 logs: `pm2 logs eiat-site`
2. Nginx logs: `/var/log/nginx/error.log`
3. System logs: `journalctl -u nginx`

