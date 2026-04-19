import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'whatsappConversation',
  title: 'محادثات واتساب',
  type: 'document',
  icon: () => '💬',
  preview: {
    select: {
      title: 'patientName',
      subtitle: 'phoneNumber',
      status: 'status',
      sentAt: 'sentAt',
    },
    prepare({ title, subtitle, status, sentAt }) {
      const statusMap: Record<string, string> = {
        sent: '✅',
        failed: '❌',
        delivered: '📬',
        read: '👁️',
      }
      const icon = statusMap[status] || '📤'
      const date = sentAt ? new Date(sentAt).toLocaleDateString('ar-SA') : ''
      return {
        title: `${icon} ${title || 'مريض غير معروف'}`,
        subtitle: `${subtitle || ''} — ${date}`,
      }
    },
  },
  fields: [
    defineField({
      name: 'patientName',
      title: 'اسم المريض',
      type: 'string',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'رقم الهاتف',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'messageBody',
      title: 'نص الرسالة',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'messageKind',
      title: 'نوع الرسالة',
      type: 'string',
      options: {
        list: [
          { title: 'نص', value: 'text' },
          { title: 'صورة', value: 'image' },
          { title: 'صوت', value: 'audio' },
          { title: 'فيديو', value: 'video' },
          { title: 'مستند', value: 'document' },
          { title: 'أخرى', value: 'unknown' },
        ],
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'waMediaId',
      title: 'معرّف الميديا (WhatsApp)',
      type: 'string',
      description: 'لعرض الصور/الصوت الواردة عبر واجهة المحادثة',
    }),
    defineField({
      name: 'templateUsed',
      title: 'القالب المستخدم',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'حالة الإرسال',
      type: 'string',
      options: {
        list: [
          { title: '✅ تم الإرسال', value: 'sent' },
          { title: '❌ فشل', value: 'failed' },
          { title: '📬 تم التوصيل', value: 'delivered' },
          { title: '👁️ تمت القراءة', value: 'read' },
        ],
      },
      initialValue: 'sent',
    }),
    defineField({
      name: 'direction',
      title: 'الاتجاه',
      type: 'string',
      options: {
        list: [
          { title: '📤 صادر', value: 'outgoing' },
          { title: '📥 وارد', value: 'incoming' },
        ],
      },
      initialValue: 'outgoing',
    }),
    defineField({
      name: 'wamid',
      title: 'WhatsApp Message ID',
      type: 'string',
      description: 'المعرف الفريد للرسالة من Meta API',
    }),
    defineField({
      name: 'sentAt',
      title: 'وقت الإرسال',
      type: 'datetime',
    }),
    defineField({
      name: 'errorMessage',
      title: 'تفاصيل الخطأ',
      type: 'string',
      hidden: ({ document }) => document?.status !== 'failed',
    }),
    defineField({
      name: 'notes',
      title: 'ملاحظات',
      type: 'text',
      rows: 2,
    }),
  ],
  orderings: [
    {
      title: 'الأحدث أولاً',
      name: 'sentAtDesc',
      by: [{ field: 'sentAt', direction: 'desc' }],
    },
  ],
})
