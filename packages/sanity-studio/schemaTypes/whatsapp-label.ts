import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'whatsappLabel',
  title: 'تصنيفات الواتساب',
  type: 'document',
  icon: () => '🏷️',
  preview: {
    select: {
      title: 'name',
      subtitle: 'color',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'تصنيف',
        subtitle: subtitle || '',
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'اسم التصنيف',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'اللون',
      type: 'string',
      options: {
        list: [
          { title: '🟢 أخضر', value: '#25d366' },
          { title: '🔵 أزرق', value: '#3b82f6' },
          { title: '🟡 أصفر', value: '#eab308' },
          { title: '🟠 برتقالي', value: '#f97316' },
          { title: '🔴 أحمر', value: '#ef4444' },
          { title: '🟣 بنفسجي', value: '#8b5cf6' },
          { title: '⚪ رمادي', value: '#6b7280' },
        ],
      },
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'order',
      title: 'الترتيب',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'الترتيب',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
