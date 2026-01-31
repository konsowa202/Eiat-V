import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'صفحة الرئيسية',
  type: 'document',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'عنوان القسم',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(50),
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'عنوان القسم الفرعي',
      type: 'string',
      validation: (Rule) => Rule.min(3).max(100),
    }),
    defineField({
      name: 'sectionDesc',
      title: 'وصف القسم',
      type: 'text',
      validation: (Rule) => Rule.min(10).max(500),
    }),
    defineField({
      name: 'sectionCategory',
      title: 'تصنيف القسم',
      type: 'string',
      options: {
        list: [
          { title: 'الأطباء', value: 'الأطباء' },
          { title: 'التقيمات', value: 'التقيمات' },
          { title: 'الحجز', value: 'الحجز' },
          { title: 'معرض الصور', value: 'معرض الصور' },
          { title: 'خدمات', value: 'خدمات' },
          { title: 'نبذة عنا', value: 'نبذة عنا' },
          { title: 'تواصل معنا', value: 'تواصل معنا' },
        ],
      },

      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'sectionTitle',
      subtitle: 'sectionSubtitle',
      Category: 'sectionCategory',
    },
    prepare({ title, subtitle, Category }) {
      return {
        title: `${Category} — ${title}`,
        subtitle: subtitle || '',
      }
    },
  },
})
