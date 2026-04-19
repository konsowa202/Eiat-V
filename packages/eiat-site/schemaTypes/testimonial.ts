// /schemas/testimonial.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'تجربة مريض',
  type: 'document',
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'الاسم',
      type: 'string',
    }),
    defineField({
      name: 'age',
      title: 'العمر',
      type: 'number',
    }),
    defineField({
      name: 'treatment',
      title: 'نوع العلاج',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: 'التقييم',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: 'date',
      title: 'تاريخ العلاج',
      type: 'string', // or 'date' if you want ISO format
    }),
    defineField({
      name: 'location',
      title: 'الموقع',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'صورة المريض',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'quote',
      title: 'اقتباس المريض',
      type: 'text',
    }),
    defineField({
      name: 'beforeImage',
      title: 'صورة قبل العلاج',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'afterImage',
      title: 'صورة بعد العلاج',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})
