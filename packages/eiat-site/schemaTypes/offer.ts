import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'offer',
    title: 'العروض والخصومات',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'عنوان العرض',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'تفاصيل العرض',
            type: 'text',
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
            name: 'discount',
            title: 'قيمة الخصم / السعر بعد الخصم',
            type: 'string',
        }),
        defineField({
            name: 'active',
            title: 'فعال؟',
            type: 'boolean',
            initialValue: true,
            description: 'تفعيل أو إيقاف العرض من الظهور في الموقع',
        }),
        defineField({
            name: 'image',
            title: 'صورة العرض (اختياري)',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
    ],
})
