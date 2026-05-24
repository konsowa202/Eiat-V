import { createClient } from '@sanity/client'
import { randomUUID } from 'crypto'

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-03-01',
  token: 'skojJEZRNwNhQjcO1XEMDMnIarDqJEuFfhUkxxKipVN6EfYOCCOlhXGbUt9ZJVnSaQHvwkgGUjvNGZXorcE57zhrqF1C65R7BKQ2Toh3HK6PVWVIYEQRVghSu1IkOEQuIXJlRrOnWZyYzAxOrczdGZrbPCzKcY1WPP2bR6NqL4W7Tov9VegC'
})

function normalizePhone(raw) {
  let v = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (!v) return null;
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (!v.startsWith("+")) v = `+${v}`;
  const digits = v.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("05")) {
    return `+966${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return `+966${digits}`;
  }
  return `+${digits}`;
}

async function run() {
  console.log('Fetching all old conversations...')
  const oldConvs = await client.fetch(`*[_type == "whatsappConversation"] | order(sentAt asc)`)
  console.log(`Found ${oldConvs.length} old conversations.`)

  const threadsMap = new Map()

  for (const conv of oldConvs) {
    const phone = normalizePhone(conv.phoneNumber)
    if (!phone) continue
    
    if (!threadsMap.has(phone)) {
      threadsMap.set(phone, {
        phoneNumber: phone,
        patientName: conv.patientName || 'بدون اسم',
        lastMessageAt: conv.sentAt,
        messages: []
      })
    }

    const t = threadsMap.get(phone)
    if (conv.patientName && t.patientName === 'بدون اسم') {
      t.patientName = conv.patientName
    }
    if (conv.sentAt && (!t.lastMessageAt || new Date(conv.sentAt) > new Date(t.lastMessageAt))) {
      t.lastMessageAt = conv.sentAt
    }

    t.messages.push({
      _key: randomUUID(),
      messageBody: conv.messageBody || '',
      direction: conv.direction || 'outgoing',
      status: conv.status || 'sent',
      messageKind: conv.messageKind || 'text',
      waMediaId: conv.waMediaId || undefined,
      templateUsed: conv.templateUsed || undefined,
      wamid: conv.wamid || undefined,
      errorMessage: conv.errorMessage || undefined,
      sentAt: conv.sentAt || new Date().toISOString()
    })
  }

  const threads = Array.from(threadsMap.values())
  console.log(`Grouped into ${threads.length} threads. Creating threads...`)

  // Create threads in batches
  for (let i = 0; i < threads.length; i += 100) {
    const batch = threads.slice(i, i + 100)
    console.log(`Creating threads batch ${i/100 + 1}...`)
    let tx = client.transaction()
    for (const t of batch) {
      // Use phone digits as ID to be safe and predictable
      const phoneDigits = t.phoneNumber.replace(/\D/g, '')
      tx.createOrReplace({
        _id: `whatsappThread.${phoneDigits}`,
        _type: 'whatsappThread',
        ...t
      })
    }
    await tx.commit()
  }

  console.log('Threads created. Now deleting old conversations...')
  const idsToDelete = oldConvs.map(c => c._id)
  
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100)
    console.log(`Deleting old convs batch ${i/100 + 1}...`)
    let tx = client.transaction()
    batch.forEach(id => tx.delete(id))
    await tx.commit()
  }

  console.log('Migration completed!')
}

run().catch(console.error)
