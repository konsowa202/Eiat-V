// sync_templates.mjs
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skojJEZRNwNhQjcO1XEMDMnIarDqJEuFfhUkxxKipVN6EfYOCCOlhXGbUt9ZJVnSaQHvwkgGUjvNGZXorcE57zhrqF1C65R7BKQ2Toh3HK6PVWVIYEQRVghSu1IkOEQuIXJlRrOnWZyYzAxOrczdGZrbPCzKcY1WPP2bR6NqL4W7Tov9VegC',
  useCdn: false,
})

async function run() {
  console.log('--- STARTING SYNC ---')
  
  // 1. Delete ALL templates to be sure
  const existing = await client.fetch('*[_type == "whatsappTemplate"]')
  console.log(`Found ${existing.length} templates. Deleting...`)
  for (const doc of existing) {
    await client.delete(doc._id)
    console.log(`Deleted: ${doc.name}`)
  }

  // 2. Create the clean ones
  const docs = [
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: eiat (Marketing)',
      category: 'offer',
      active: true,
      messageBody: 'قالب الصور والروابط'
    },
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: eiat1 (Utility)',
      category: 'followup',
      active: true,
      messageBody: 'قالب المتابعة'
    },
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: تأكيد موعد (confirmation)',
      category: 'appointment',
      active: true,
      messageBody: 'تأكيد الموعد (4 متغيرات)'
    },
    {
      _type: 'whatsappTemplate',
      name: 'قالب فيسبوك: open (بدون متغيرات)',
      category: 'marketing',
      active: true,
      messageBody: 'قالب اختبار بدون متغيرات'
    }
  ]

  for (const d of docs) {
    const res = await client.create(d)
    console.log(`Created: ${res.name}`)
  }

  console.log('--- SYNC FINISHED ---')
}

run().catch(console.error)
