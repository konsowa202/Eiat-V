import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'device',
    title: 'الأجهزة الطبية',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'اسم الجهاز',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'category',
            title: 'القسم',
            type: 'string',
            options: {
                list: [
                    { title: 'أسنان', value: 'dental' },
                    { title: 'جلدية وزر', value: 'derma-laser' },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'image',
            title: 'صورة الجهاز',
            type: 'image',
            options: {
                hotspot: true,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'لماذا هذا الجهاز؟',
            type: 'text',
            description: 'شرح مبسط عن فوائد الجهاز للمريض',
        }),
        defineField({
            name: 'specifications',
            title: 'المواصفات التقنية',
            type: 'array',
            of: [{ type: 'string' }],
        }),
    ],
})
