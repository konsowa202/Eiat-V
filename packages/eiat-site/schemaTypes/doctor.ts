// /schemas/doctor.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'doctor',
  title: 'الطبيب',
  type: 'document',
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
  description: 'توثيق معلومات الأطباء بما في ذلك التخصص، التقييم، وسنوات الخبرة والمزيد.',
  fields: [
    defineField({
      name: 'name',
      title: 'الاسم',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'الصورة',
      type: 'image',
      options: {
        hotspot: true,
      },
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
      name: 'experience',
      title: 'سنوات الخبرة',
      type: 'number', // Could be "13 سنة" or use type: 'number' if you prefer
    }),
    defineField({
      name: 'about',
      title: 'نبذة عن الطبيب',
      type: 'text',
      description: 'وصف مختصر عن خبرات الطبيب ومؤهلاته',
      validation: (Rule) => Rule.min(10).max(1000),
    }),

    defineField({
      name: 'joinedAt',
      title: 'سنة الانضمام',
      type: 'number', // Optional: use 'date' if you want ISO
    }),
    defineField({
      name: 'availability',
      title: 'أيام العمل',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'الأحد', value: 'الأحد' },
          { title: 'الإثنين', value: 'الإثنين' },
          { title: 'الثلاثاء', value: 'الثلاثاء' },
          { title: 'الأربعاء', value: 'الأربعاء' },
          { title: 'الخميس', value: 'الخميس' },
          { title: 'الجمعة', value: 'الجمعة' },
          { title: 'السبت', value: 'السبت' },
        ],
      },
      description: 'حدد الأيام التي يكون فيها الطبيب متاحًا للمواعيد',
    }),
  ],
})
