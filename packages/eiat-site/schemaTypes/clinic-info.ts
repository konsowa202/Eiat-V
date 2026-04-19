import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'clinicInfo',
  title: 'معلومات العياده',
  type: 'document',
  fields: [
    defineField({
      name: 'address',
      title: 'العنوان',
      type: 'string',
      initialValue: 'وسط جدة، حي الأندلس',
    }),
    defineField({
      name: 'phones',
      title: 'أرقام الهواتف',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'phoneNumber',
              title: 'رقم الهاتف',
              type: 'string',
            },
          ],
        },
      ],
      initialValue: [
        {
          phoneNumber: '+966920008437',
        },
      ],
    }),
    defineField({
      name: 'workingDaysAndHours',
      title: 'أيام العمل و ساعات العمل',
      type: 'string',
      initialValue: 'من السبت إلى الخميس – ٩ص إلى ٩م',
    }),
    defineField({
      name: 'email',
      title: 'البريد الإلكتروني',
      type: 'string',
      initialValue: 'Eiatclinic@gmail.com',
    }),
  ],
})
