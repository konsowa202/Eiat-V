# دليل رفع مشروع EIAT

المشروع مقسم إلى نشرتين منفصلتين:

| المشروع | المحتوى | مكان النشر | الدومين |
|---|---|---|---|
| `packages/eiat-site` | اللاندينج بيدج + نموذج التواصل (`/api/send-email`) | Hostinger VPS (Node.js + Nginx + PM2) | https://eiatclinics.com |
| `packages/sanity-studio` | Sanity Studio (لوحة التحكم) + كل APIs واتساب (`/api/whatsapp/*`) | Vercel | https://eiat-v.vercel.app |

> ملاحظة مهمة: قبل الفصل ده كان المشروعين مكومين في حتة واحدة، ودا اللي كان بيخلي الزوار اللي بيفتحوا `eiatclinics.com` يتحولوا تلقائياً لـ `/studio`. الآن:
> - `eiat-site` **بدون** Studio و**بدون** WhatsApp APIs.
> - `sanity-studio` **لوحده** هو اللي فيه الـ Studio والـ APIs.

---

## 1) رفع اللاندينج بيدج على Hostinger VPS (`eiatclinics.com`)

### المتطلبات
- VPS من Hostinger
- SSH access
- الدومين `eiatclinics.com` موجهّ للسيرفر

### الخطوات السريعة (بسكريبت)

```bash
# 1) اتصل بالسيرفر
ssh root@62.72.35.127

# 2) ارفع سكريبتات الرفع
#   (من جهازك)
scp deploy-simple.sh setup-nginx.sh root@62.72.35.127:/root/

# 3) شغّل السكريبت
ssh root@62.72.35.127
chmod +x deploy-simple.sh setup-nginx.sh
./deploy-simple.sh
./setup-nginx.sh eiatclinics.com
```

السكريبت بيعمل:
- تحميل Node.js 20 و pnpm و PM2 لو مش موجودين
- git clone / pull للريبو
- إنشاء `packages/eiat-site/.env` بالقيم الصحيحة (Sanity read token + Gmail SMTP)
- `pnpm install --filter eiat...` (بيثبّت فقط تبعيات اللاندينج بيدج)
- `pnpm build` داخل `packages/eiat-site`
- بدء العملية بـ PM2
- إعداد Nginx + SSL

### تحديث بعد كل تغيير
```bash
cd /var/www/eiat
git pull origin master
pnpm install --filter eiat...
cd packages/eiat-site
pnpm build
pm2 restart eiat-site
```

### متغيرات البيئة المطلوبة (`packages/eiat-site/.env`)
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=f46widyg
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_TOKEN=<Sanity read token>
EMAIL_USER=<Gmail>
EMAIL_PASS=<Gmail App Password>
NODE_ENV=production
```

---

## 2) رفع لوحة التحكم على Vercel (`eiat-v.vercel.app`)

`packages/sanity-studio` دلوقتي Next.js app بالكامل بيشغّل الـ Studio على `/` والـ APIs على `/api/*`.

### الإعداد في Vercel
1. ادخل Vercel → Project Settings → **General**.
2. **Root Directory** = `packages/sanity-studio`
3. **Framework Preset** = Next.js (يتحدد تلقائياً)
4. **Build Command** = `pnpm build` (أو اتركه افتراضي)
5. **Install Command** = `pnpm install --filter eiat-sanity-studio...` (لو بتستخدم workspaces)

### متغيرات البيئة في Vercel (Project Settings → Environment Variables)
```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=f46widyg
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=<Sanity write token>

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=<Meta access token>
WHATSAPP_PHONE_NUMBER_ID=1067072803156944
WHATSAPP_BUSINESS_ACCOUNT_ID=495811770284793
WHATSAPP_VERIFY_TOKEN=eiat_webhook_2025

# Re-engagement template (for /api/whatsapp/send-media fallback)
WHATSAPP_REENGAGEMENT_TEMPLATE_NAME=appointment_confirmed
WHATSAPP_REENGAGEMENT_TEMPLATE_LANG=ar
```

### Webhook واتساب في Meta
فضّل المسار زي ما هو:
```
https://eiat-v.vercel.app/api/whatsapp/webhook
```
Verify token: `eiat_webhook_2025`

---

## 🆘 Troubleshooting

### الزوار بيروحوا على `/studio` لما يفتحوا eiatclinics.com
لو حصل ده تاني بعد التحديث ده، تأكد إن:
- `packages/eiat-site/next.config.ts` **ما فيهوش** `redirects()` قديم.
- `packages/eiat-site/app/studio/` غير موجود.
- بنيت النسخة الجديدة: `pnpm build` بعد `git pull`.

### الـ Studio بيقول "فشل في إرسال رسالة واتساب"
- تأكد إن كل `WHATSAPP_*` متعرّفين في إعدادات Vercel.
- راجع اللوغ في Vercel → Deployments → Functions Logs.

### اللاندينج بيدج بيعرض بيانات قديمة
- الصفحات معمولة `force-dynamic` بالفعل. لو لسه بتلاقي بيانات قديمة راجع `SANITY_TOKEN` في الـ `.env`.
