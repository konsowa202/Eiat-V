/**
 * سكريبت لإضافة قوالب واتساب الافتراضية إلى Sanity
 * Run: node seed-whatsapp-templates.mjs
 */

import { createClient } from '@sanity/client'

const token = (process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN || '').trim()
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN or SANITY_TOKEN in the environment.')
  process.exit(1)
}

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const templates = [
  {
    _type: 'whatsappTemplate',
    name: 'ترحيب بعرض خصم',
    category: 'offer',
    messageBody: `مرحباً {{اسم_المريض}} 👋

🎉 نحن في *عيادة إيات لطب الأسنان* يسعدنا إخبارك بعرض حصري خصيصاً لك!

✨ *{{اسم_العرض}}*
💰 *الخصم: {{السعر}}*

⏰ العرض محدود المدة — لا تفوت الفرصة!

احجز موعدك الآن وابتسامتك بين أيدي أمهر الأطباء 🦷

📞 للحجز والاستفسار: +966920008437`,
    includeCallButton: true,
    callPhoneNumber: '+966920008437',
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'تأكيد موعد',
    category: 'appointment',
    messageBody: `مرحباً {{اسم_المريض}} 😊

✅ تم تأكيد موعدك في *عيادة إيات لطب الأسنان*

📅 *التاريخ والوقت:* {{تاريخ_الموعد}}
👨‍⚕️ *الطبيب/ة:* {{اسم_الطبيب}}
📍 *الموقع:* حي الأندلس، وسط جدة

نرجو الحضور قبل الموعد بـ 10 دقائق 🙏

في حال الرغبة في التغيير أو الإلغاء، يرجى التواصل قبل 24 ساعة.`,
    includeCallButton: true,
    callPhoneNumber: '+966920008437',
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'متابعة بعد العلاج',
    category: 'followup',
    messageBody: `مرحباً {{اسم_المريض}} 💚

نتمنى أن تكون بصحة وعافية 😊

نود التحقق من حالتك بعد زيارتك لـ *عيادة إيات لطب الأسنان*.

هل تشعر بتحسن؟ هل لديك أي استفسار أو ألم يزعجك؟

نحن هنا دائماً لخدمتك، لا تتردد في التواصل معنا! 🦷✨`,
    includeCallButton: true,
    callPhoneNumber: '+966920008437',
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'ترويج باقة تبييض',
    category: 'package',
    messageBody: `مرحباً {{اسم_المريض}} ✨

🌟 *باقة تبييض الأسنان الاحترافية*

احصل على ابتسامة ساطعة ومشرقة مع *عيادة إيات*!

💎 *ما تشمله الباقة:*
• جلسة تبييض ليزر متطورة
• تنظيف وتلميع احترافي
• استشارة طبية مجانية

💰 *السعر: {{السعر}}*

🔥 العروض محدودة — احجز الآن!`,
    includeCallButton: true,
    callPhoneNumber: '+966920008437',
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'رسالة تذكير بالموعد',
    category: 'appointment',
    messageBody: `تذكير 📅

مرحباً {{اسم_المريض}}،

نود تذكيرك بأن لديك موعد غداً في *عيادة إيات لطب الأسنان*

🕐 *الوقت:* {{تاريخ_الموعد}}
👨‍⚕️ *مع:* {{اسم_الطبيب}}

نراك قريباً 😊
فريق عيادة إيات 🦷`,
    includeCallButton: false,
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'confirmation',
    category: 'appointment',
    messageBody: `✅ تم تأكيد حجز الموعد بنجاح.
مرحباً {{اسم_المريض}}، تم تأكيد موعدك لتاريخ {{تاريخ_الموعد}}.
نتشوق لرؤيتك في عيادة إيات!`,
    includeCallButton: false,
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'eiat',
    category: 'offer',
    messageBody: `مرحباً بك من عيادات إيات لطب الأسنان! 🦷✨
سعداء بتواصلك معنا، وسنقوم بالرد عليك في أقرب وقت ممكن.`,
    includeCallButton: false,
    active: true,
  },
  {
    _type: 'whatsappTemplate',
    name: 'eiat1',
    category: 'followup',
    messageBody: `أهلاً بك عميلنا العزيز بكلمة تأكيد!
تم استلام رسالتك وسيتم التعامل معها فوراً.`,
    includeCallButton: false,
    active: true,
  },
]

async function seedTemplates() {
  console.log('🚀 بدء إضافة قوالب واتساب إلى Sanity...\n')

  for (const template of templates) {
    try {
      const result = await client.create(template)
      console.log(`✅ تم إضافة: "${template.name}" (${result._id})`)
    } catch (err) {
      console.error(`❌ فشل إضافة "${template.name}":`, err.message)
    }
  }

  console.log('\n🎉 اكتمل الإضافة!')
}

seedTemplates()
