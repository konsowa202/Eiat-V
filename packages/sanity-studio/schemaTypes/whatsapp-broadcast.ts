import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'whatsappBroadcast',
  title: 'حملات الإرسال الجماعي',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'اسم الحملة',
      type: 'string',
    }),
    defineField({
      name: 'sentAt',
      title: 'تاريخ الإرسال',
      type: 'datetime',
    }),
    defineField({
      name: 'message',
      title: 'الرسالة / القالب',
      type: 'text',
    }),
    defineField({
      name: 'recipients',
      title: 'المستلمون',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'phone', title: 'الرقم', type: 'string' },
            { name: 'name', title: 'الاسم', type: 'string' },
            { name: 'status', title: 'الحالة', type: 'string' },
            { name: 'error', title: 'الخطأ', type: 'string' },
            { name: 'wamid', title: 'Wamid', type: 'string' },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'sentAt',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'حملة بدون اسم',
        subtitle: subtitle ? new Date(subtitle).toLocaleString('ar-SA') : 'بدون تاريخ',
        media: () => '📣',
      }
    },
  },
})
