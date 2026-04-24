import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'whatsappContact',
  title: 'جهات اتصال واتساب',
  type: 'document',
  icon: () => '👤',
  preview: {
    select: {
      title: 'name',
      subtitle: 'phoneE164',
      status: 'status',
      source: 'source',
    },
    prepare({title, subtitle, status, source}) {
      const statusIcon: Record<string, string> = {
        active: '✅',
        archived: '📦',
        invalid: '⚠️',
        blocked: '⛔',
      }
      return {
        title: `${statusIcon[status] || '👤'} ${title || 'بدون اسم'}`,
        subtitle: `${subtitle || ''}${source ? ` — ${source}` : ''}`,
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'الاسم',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
    }),
    defineField({
      name: 'phoneE164',
      title: 'رقم واتساب (+966...)',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^\+\d{8,16}$/),
    }),
    defineField({
      name: 'phoneDigits',
      title: 'رقم بدون رموز',
      type: 'string',
      validation: (Rule) => Rule.required().min(8),
    }),
    defineField({
      name: 'status',
      title: 'الحالة',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          {title: 'نشط', value: 'active'},
          {title: 'مؤرشف (مخفي من القوائم)', value: 'archived'},
          {title: 'غير صالح', value: 'invalid'},
          {title: 'محظور', value: 'blocked'},
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: 'وسوم',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'source',
      title: 'المصدر',
      type: 'string',
      initialValue: 'excel-import',
    }),
    defineField({
      name: 'lastImportedAt',
      title: 'آخر استيراد',
      type: 'datetime',
    }),
  ],
  orderings: [
    {
      title: 'الأحدث استيرادًا',
      name: 'importDesc',
      by: [{field: 'lastImportedAt', direction: 'desc'}],
    },
  ],
})
