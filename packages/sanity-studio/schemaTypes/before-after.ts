import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'beforeAfter',
  title: 'قبل وبعد',
  type: 'document',
  icon: () => '🪄',
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'afterImage',
    },
    prepare({ title, subtitle }) {
      const categoryLabels: Record<string, string> = {
        dental: '🦷 أسنان',
        skin: '✨ بشرة',
        laser: '⚡ ليزر',
        cosmetics: '💄 تجميل',
      }
      return {
        title: title || 'حالة غير مسماة',
        subtitle: categoryLabels[subtitle] || subtitle,
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'عنوان الحالة',
      type: 'string',
      description: 'مثال: تلبيس أسنان بورسلان كامل',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'القسم',
      type: 'string',
      options: {
        list: [
          { title: '🦷 أسنان', value: 'dental' },
          { title: '✨ بشرة', value: 'skin' },
          { title: '⚡ ليزر', value: 'laser' },
          { title: '💄 تجميل', value: 'cosmetics' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'beforeImage',
      title: 'صورة قبل العلاج',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'يُنصح بصورة مربعة أو بنسبة 1:1 للعرض الأفضل',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'afterImage',
      title: 'صورة بعد العلاج',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'يُنصح بنفس نسبة أبعاد صورة القبل',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'وصف الحالة (اختياري)',
      type: 'text',
      rows: 3,
      description: 'تفاصيل إضافية عن العلاج أو نوع الحالة',
    }),
    defineField({
      name: 'treatmentDuration',
      title: 'مدة العلاج (اختياري)',
      type: 'string',
      description: 'مثال: جلسة واحدة | 3 أشهر | أسبوعان',
    }),
    defineField({
      name: 'active',
      title: 'إظهار في الموقع؟',
      type: 'boolean',
      initialValue: true,
      description: 'تفعيل أو إخفاء هذه الحالة من الموقع',
    }),
    defineField({
      name: 'order',
      title: 'الترتيب',
      type: 'number',
      description: 'رقم أصغر = يظهر أولاً (1، 2، 3...)',
      initialValue: 99,
    }),
  ],
  orderings: [
    {
      title: 'الأحدث أولاً',
      name: 'createdAtDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
    {
      title: 'حسب الترتيب',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
