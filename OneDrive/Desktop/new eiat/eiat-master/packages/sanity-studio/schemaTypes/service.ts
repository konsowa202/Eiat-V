import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'plan',
  title: 'خدمة/باقة',
  type: 'document',
  preview: {
    select: {
      title: 'name',
      subtitle: 'department',
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'اسم الخدمة',
      type: 'string',
    }),
    defineField({
      name: 'department',
      title: 'القسم',
      type: 'string',
      options: {
        list: [
          { title: 'أسنان', value: 'dental' },
          { title: 'جلدية', value: 'dermatology' },
          { title: 'ليزر', value: 'laser' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'السعر',
      type: 'string',
    }),
    // Keep 'period' if it's used for subscription-like services, otherwise optional
    defineField({
      name: 'period',
      title: 'الفترة (اختياري)',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'الوصف',
      type: 'text',
    }),
    defineField({
      name: 'features',
      title: 'المميزات',
      type: 'array',
      of: [{ type: 'string', title: 'ميزة' }],
    }),
    defineField({
      name: 'popular',
      title: 'خدمة مميزة',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'buttonText',
      title: 'نص الزر',
      type: 'string',
    }),
  ],
})
