import {defineField, defineType} from 'sanity'

function hasAssetRef(img: unknown): boolean {
  if (img == null || typeof img !== 'object') return false
  const o = img as {asset?: {_ref?: string}; _ref?: string}
  if (typeof o._ref === 'string' && o._ref.length > 0) return true
  return typeof o.asset?._ref === 'string' && o.asset._ref.length > 0
}

export default defineType({
  name: 'beforeAfter',
  title: 'قبل وبعد',
  type: 'document',
  icon: () => '🪄',
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      caseImage: 'caseImage',
      afterImage: 'afterImage',
      beforeImage: 'beforeImage',
    },
    prepare({title, subtitle, caseImage, afterImage, beforeImage}) {
      const categoryLabels: Record<string, string> = {
        dental: '🦷 أسنان',
        skin: '✨ بشرة',
        laser: '⚡ ليزر',
        cosmetics: '💄 تجميل',
      }
      return {
        title: title || 'حالة غير مسماة',
        subtitle: categoryLabels[subtitle] || subtitle,
        media: caseImage || afterImage || beforeImage,
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
          {title: '🦷 أسنان', value: 'dental'},
          {title: '✨ بشرة', value: 'skin'},
          {title: '⚡ ليزر', value: 'laser'},
          {title: '💄 تجميل', value: 'cosmetics'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caseImage',
      title: 'صورة الحالة (قبل وبعد في تصميم واحد)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description:
        'مُفضّل: صورة واحدة جاهزة من التصميم (قبل + بعد في نفس القالب). إن وُظفت، لن تُعرض صور «قبل/بعد» المنفصلة.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const p = context.parent as {beforeImage?: unknown; afterImage?: unknown} | undefined
          const hasPair = hasAssetRef(p?.beforeImage) && hasAssetRef(p?.afterImage)
          if (hasAssetRef(value) || hasPair) return true
          return 'أضف إما صورة الحالة المجمّعة، أو صورتي قبل وبعد (الوضع القديم).'
        }),
    }),
    defineField({
      name: 'beforeImage',
      title: 'صورة قبل العلاج (اختياري — للمحتوى القديم)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description:
        'تُستخدم فقط إذا لم تضف «صورة الحالة» المجمّعة. يلزم معها صورة بعد مكتملة.',
      fieldset: 'splitLegacy',
    }),
    defineField({
      name: 'afterImage',
      title: 'صورة بعد العلاج (اختياري — للمحتوى القديم)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'نفس نسبة صورة «قبل» إن استخدمتَ الوضعين منفصلين.',
      fieldset: 'splitLegacy',
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
  fieldsets: [
    {
      name: 'splitLegacy',
      title: 'طريقة قديمة: صورتان منفصلتان (بدل صورة واحدة)',
      options: {collapsible: true, collapsed: true},
    },
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
