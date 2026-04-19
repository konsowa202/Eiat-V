import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'whatsappTemplate',
  title: 'قوالب واتساب',
  type: 'document',
  icon: () => '📱',
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
    },
    prepare({ title, subtitle }) {
      const categoryLabels: Record<string, string> = {
        offer: 'عرض/خصم',
        package: 'باقة علاج',
        appointment: 'موعد',
        followup: 'متابعة',
        custom: 'مخصص',
      }
      return {
        title,
        subtitle: categoryLabels[subtitle] || subtitle,
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'اسم القالب',
      type: 'string',
      description: 'اسم داخلي للتعرف على القالب',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'نوع القالب',
      type: 'string',
      options: {
        list: [
          { title: '🏷️ عرض وخصومات', value: 'offer' },
          { title: '📦 باقة علاج', value: 'package' },
          { title: '📅 تأكيد موعد', value: 'appointment' },
          { title: '🔄 متابعة مريض', value: 'followup' },
          { title: '✏️ رسالة مخصصة', value: 'custom' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'messageBody',
      title: 'نص الرسالة',
      type: 'text',
      rows: 6,
      description:
        'يمكنك استخدام متغيرات: {{اسم_المريض}} | {{اسم_العرض}} | {{السعر}} | {{تاريخ_الموعد}} | {{اسم_الطبيب}}',
      validation: (Rule) => Rule.required().max(1000),
    }),
    defineField({
      name: 'linkedOffer',
      title: 'العرض المرتبط (اختياري)',
      type: 'reference',
      to: [{ type: 'offer' }],
      description: 'اربط هذا القالب بعرض موجود لملء البيانات تلقائياً',
    }),
    defineField({
      name: 'linkedService',
      title: 'الباقة/الخدمة المرتبطة (اختياري)',
      type: 'reference',
      to: [{ type: 'plan' }],
      description: 'اربط هذا القالب بباقة علاج لملء بيانات السعر تلقائياً',
    }),
    defineField({
      name: 'includeCallButton',
      title: 'إضافة زر اتصال؟',
      type: 'boolean',
      description: 'أضف رابط اتصال مباشر في نهاية الرسالة',
      initialValue: false,
    }),
    defineField({
      name: 'callPhoneNumber',
      title: 'رقم الاتصال',
      type: 'string',
      description: 'رقم الهاتف لزر الاتصال (مثل: +966920008437)',
      hidden: ({ document }) => !document?.includeCallButton,
    }),
    defineField({
      name: 'active',
      title: 'مفعّل؟',
      type: 'boolean',
      initialValue: true,
      description: 'تفعيل أو إيقاف هذا القالب من قائمة الإرسال',
    }),
    defineField({
      name: 'notes',
      title: 'ملاحظات داخلية',
      type: 'text',
      rows: 2,
      description: 'ملاحظات للفريق الداخلي فقط - لا تظهر في الرسالة',
    }),
  ],
  orderings: [
    {
      title: 'الأحدث',
      name: 'createdAtDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})
