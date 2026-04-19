// cleanup-and-sync-sanity.mjs
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skojJEZRNwNhQjcO1XEMDMnIarDqJEuFfhUkxxKipVN6EfYOCCOlhXGbUt9ZJVnSaQHvwkgGUjvNGZXorcE57zhrqF1C65R7BKQ2Toh3HK6PVWVIYEQRVghSu1IkOEQuIXJlRrOnWZyYzAxOrczdGZrbPCzKcY1WPP2bR6NqL4W7Tov9VegC',
  useCdn: false,
})

async function sync() {
  console.log('--- Cleaning up Sanity WhatsApp Templates ---')
  
  // 1. Delete all existing templates
  const oldTpls = await client.fetch('*[_type == "whatsappTemplate"]')
  for (const t of oldTpls) {
    console.log(`Deleting old template: ${t.name}`)
    await client.delete(t._id)
  }

  // 2. Create the 3 official Meta templates
  const officialTpls = [
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: eiat (Marketing)',
      category: 'offer',
      active: true,
      messageBody: 'تم ارسال القالب التسويقي eiat بنجاح (يحتوي على صورة ورابط الموقع)',
    },
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: eiat1 (Utility)',
      category: 'followup',
      active: true,
      messageBody: 'تم ارسال القالب eiat1 بنجاح (يحتوي على صورة وتاكيد الحجز)',
    },
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: تأكيد موعد (confirmation)',
      category: 'appointment',
      active: true,
      messageBody: 'تم ارسال قالب التأكيد بنجاح (يحتوي على 4 متغيرات: الاسم، التاريخ، الطبيب، الموقع)',
    }
  ]

  for (const t of officialTpls) {
    console.log(`Creating official template: ${t.name}`)
    await client.create(t)
  }

  console.log('--- Sync Completed Successfully ---')
}

sync()
