'use client'

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {whatsappPlugin} from './plugins/whatsapp-tool'

export default defineConfig({
  name: 'eiat-clinics',
  title: 'إيات لطب الأسنان',

  projectId: 'f46widyg',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('لوحة التحكم')
          .items([
            // Clinic content
            S.listItem()
              .title('🏥 الصفحة الرئيسية')
              .schemaType('homepage')
              .child(S.document().schemaType('homepage').documentId('homePage')),

            S.listItem()
              .title('🏥 معلومات العيادة')
              .schemaType('clinicInfo')
              .child(S.document().schemaType('clinicInfo').documentId('clinicInfo')),

            S.documentTypeListItem('doctor').title('👨‍⚕️ الأطباء'),
            S.documentTypeListItem('plan').title('📦 الخدمات والباقات'),
            S.documentTypeListItem('offer').title('🏷️ العروض والخصومات'),
            S.documentTypeListItem('testimonial').title('⭐ تقييمات المرضى'),
            S.documentTypeListItem('device').title('🔬 الأجهزة'),
            S.documentTypeListItem('beforeAfter').title('🪄 قبل وبعد'),

            S.divider(),

            // WhatsApp section
            S.listItem()
              .title('📱 واتساب للأعمال')
              .icon(() => '📱')
              .child(
                S.list()
                  .title('واتساب')
                  .items([
                    S.documentTypeListItem('whatsappTemplate').title('📋 قوالب الرسائل'),
                    S.documentTypeListItem('whatsappConversation').title('💬 سجل المحادثات'),
                    S.documentTypeListItem('whatsappContact').title('👤 جهات الاتصال'),
                  ])
              ),
          ]),
    }),
    visionTool(),
    whatsappPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },
})

