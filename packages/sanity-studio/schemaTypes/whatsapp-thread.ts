import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'whatsappThread',
  title: 'محادثات الواتساب (Threads)',
  type: 'document',
  icon: () => '💬',
  preview: {
    select: {
      title: 'patientName',
      subtitle: 'phoneNumber',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'مريض غير معروف',
        subtitle: subtitle || '',
      }
    },
  },
  fields: [
    defineField({
      name: 'phoneNumber',
      title: 'رقم الهاتف',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'patientName',
      title: 'اسم المريض',
      type: 'string',
    }),
    defineField({
      name: 'lastMessageAt',
      title: 'وقت آخر رسالة',
      type: 'datetime',
    }),
    defineField({
      name: 'threadLabel',
      title: 'التصنيف',
      type: 'string',
      initialValue: 'جديد',
    }),
    defineField({
      name: 'messages',
      title: 'الرسائل',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'message',
          fields: [
            { name: 'messageBody', title: 'نص الرسالة', type: 'text', rows: 3 },
            { 
              name: 'direction', 
              title: 'الاتجاه', 
              type: 'string',
              options: { list: ['outgoing', 'incoming'] }
            },
            {
              name: 'status',
              title: 'حالة الإرسال',
              type: 'string',
              options: { list: ['sent', 'failed', 'delivered', 'read'] }
            },
            { name: 'messageKind', title: 'نوع الرسالة', type: 'string', initialValue: 'text' },
            { name: 'waMediaId', title: 'معرّف الميديا', type: 'string' },
            { name: 'templateUsed', title: 'القالب', type: 'string' },
            { name: 'wamid', title: 'Wamid', type: 'string' },
            { name: 'errorMessage', title: 'خطأ', type: 'string' },
            { name: 'sentAt', title: 'وقت الإرسال', type: 'datetime' },
            { name: 'replyToWamid', title: 'رد على رسالة', type: 'string' },
          ],
          preview: {
            select: {
              title: 'messageBody',
              subtitle: 'sentAt',
              dir: 'direction'
            },
            prepare({ title, subtitle, dir }) {
              const icon = dir === 'incoming' ? '📥' : '📤'
              return {
                title: `${icon} ${title || '(رسالة)'}`,
                subtitle: subtitle ? new Date(subtitle).toLocaleString('ar-SA') : ''
              }
            }
          }
        }
      ]
    })
  ],
  orderings: [
    {
      title: 'الأحدث أولاً',
      name: 'lastMessageAtDesc',
      by: [{ field: 'lastMessageAt', direction: 'desc' }],
    },
  ],
})
