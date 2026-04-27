import {createClient} from '@sanity/client'

const GRAPH = 'https://graph.facebook.com/v21.0'

function must(name, value) {
  const v = String(value || '').trim()
  if (!v) {
    throw new Error(`Missing required env: ${name}`)
  }
  return v
}

function envAny(...names) {
  for (const n of names) {
    const v = String(process.env[n] || '').trim()
    if (v) return v
  }
  return ''
}

function mapCategory(metaCategory) {
  const c = String(metaCategory || '').toUpperCase()
  if (c === 'MARKETING') return 'offer'
  if (c === 'UTILITY') return 'appointment'
  if (c === 'AUTHENTICATION') return 'followup'
  return 'custom'
}

function extractVars(text) {
  return Array.from(new Set((String(text || '').match(/\{\{\d+\}\}/g) || []).map((x) => x.trim())))
}

function componentByType(components, type) {
  return (components || []).find((c) => String(c?.type || '').toUpperCase() === type)
}

async function fetchAllMetaTemplates({waToken, waBusinessId}) {
  let after = ''
  const all = []
  while (true) {
    const url = new URL(`${GRAPH}/${waBusinessId}/message_templates`)
    url.searchParams.set('limit', '100')
    if (after) url.searchParams.set('after', after)
    const res = await fetch(url.toString(), {
      headers: {Authorization: `Bearer ${waToken}`},
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error?.message || `Meta API HTTP ${res.status}`)
    }
    const rows = Array.isArray(data?.data) ? data.data : []
    all.push(...rows)
    const nextAfter = data?.paging?.cursors?.after
    if (!nextAfter) break
    after = String(nextAfter)
  }
  return all
}

function buildSanityDocFromMeta(row) {
  const name = String(row?.name || '').trim()
  const language = String(row?.language || '').trim() || 'ar'
  const status = String(row?.status || '').toUpperCase()
  const category = String(row?.category || '')
  const components = Array.isArray(row?.components) ? row.components : []

  const body = componentByType(components, 'BODY')
  const header = componentByType(components, 'HEADER')

  const bodyText = String(body?.text || '').trim()
  const headerText = String(header?.text || '').trim()
  const headerFormat = String(header?.format || 'NONE').toUpperCase()

  const bodyVars = extractVars(bodyText)
  const headerVars = headerFormat === 'TEXT' ? extractVars(headerText) : []

  const active = status === 'APPROVED'
  const messageBody = bodyText || `قالب واتساب: ${name}`
  const notesLines = [
    'Synced from Meta',
    `templateName: ${name}`,
    `language: ${language}`,
    `status: ${status || 'UNKNOWN'}`,
    `metaCategory: ${category || 'UNKNOWN'}`,
    `headerFormat: ${headerFormat}`,
    `bodyVariables: ${bodyVars.length} ${bodyVars.join(' ')}`.trim(),
    `headerVariables: ${headerVars.length} ${headerVars.join(' ')}`.trim(),
  ]

  return {
    _type: 'whatsappTemplate',
    _id: `metaTemplate.${name}.${language}`.replace(/[^\w.-]/g, '_'),
    name: `${name} · ${language}`,
    category: mapCategory(category),
    messageBody,
    active,
    includeCallButton: false,
    notes: notesLines.join('\n'),
  }
}

async function main() {
  const sanityToken = must(
    'SANITY_API_WRITE_TOKEN or SANITY_TOKEN',
    envAny('SANITY_API_WRITE_TOKEN', 'SANITY_TOKEN'),
  )
  const waToken = must(
    'WHATSAPP_ACCESS_TOKEN or WA_ACCESS_TOKEN',
    envAny('WHATSAPP_ACCESS_TOKEN', 'WA_ACCESS_TOKEN'),
  )
  const waBusinessId =
    envAny('WHATSAPP_BUSINESS_ACCOUNT_ID', 'WA_BUSINESS_ACCOUNT_ID') || '1650904936252257'

  const sanity = createClient({
    projectId: envAny('NEXT_PUBLIC_SANITY_PROJECT_ID') || 'f46widyg',
    dataset: envAny('NEXT_PUBLIC_SANITY_DATASET') || 'production',
    apiVersion: '2024-01-01',
    token: sanityToken,
    useCdn: false,
  })

  const metaTemplates = await fetchAllMetaTemplates({waToken, waBusinessId})
  const docs = metaTemplates.map(buildSanityDocFromMeta)

  let upserted = 0
  for (const doc of docs) {
    await sanity.createOrReplace(doc)
    upserted += 1
  }

  const activeCount = docs.filter((d) => d.active).length
  const inactiveCount = docs.length - activeCount

  console.log(`Synced ${upserted} templates from Meta to Sanity.`)
  console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}`)
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
