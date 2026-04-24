/**
 * Deletes every Sanity document of type `whatsappContact` only.
 * Does NOT touch `whatsappConversation` (chat history).
 *
 * Usage (from repo root or this package):
 *   cd packages/sanity-studio
 *   pnpm exec node scripts/delete-all-whatsapp-contacts.mjs              # count only
 *   pnpm exec node scripts/delete-all-whatsapp-contacts.mjs --execute  # delete
 *
 * Env: SANITY_API_WRITE_TOKEN or SANITY_TOKEN (Editor). Optional: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET.
 * Loads `.env.local` from `../eiat-site` first, then this package (studio wins on duplicate keys).
 */

import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.resolve(__dirname, '..')

/** @param {{ override?: boolean }} opts - if override, keys in this file replace existing process.env */
function mergeEnvFromFile(absPath, opts = {}) {
  const override = opts.override === true
  if (!fs.existsSync(absPath)) return
  const raw = fs.readFileSync(absPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const noExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed
    const eq = noExport.indexOf('=')
    if (eq <= 0) continue
    const key = noExport.slice(0, eq).trim()
    let val = noExport.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key && (override || process.env[key] === undefined)) process.env[key] = val
  }
}

mergeEnvFromFile(path.join(pkgRoot, '../eiat-site/.env.local'), {override: false})
mergeEnvFromFile(path.join(pkgRoot, '.env.local'), {override: true})

const tokenFrom = process.env.SANITY_API_WRITE_TOKEN?.trim()
  ? 'SANITY_API_WRITE_TOKEN'
  : process.env.SANITY_TOKEN?.trim()
    ? 'SANITY_TOKEN'
    : ''
const token = (process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN || '').trim()
const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'f46widyg').trim()
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
const execute = process.argv.includes('--execute')

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN or SANITY_TOKEN. Set in env or .env.local (studio or eiat-site).')
  process.exit(1)
}
if (tokenFrom === 'SANITY_TOKEN' && execute) {
  console.warn(
    '\n⚠️  Using SANITY_TOKEN only. If deletes fail with 403, create an Editor API token and set SANITY_API_WRITE_TOKEN in packages/sanity-studio/.env.local\n',
  )
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const chunk = 100

async function main() {
  const convCount = await client.fetch(`count(*[_type == "whatsappConversation"])`)
  const contactCount = await client.fetch(`count(*[_type == "whatsappContact"])`)

  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Token env var used: ${tokenFrom || '(inline)'}`)
  console.log(`whatsappConversation (unchanged): ${convCount}`)
  console.log(`whatsappContact (to delete):      ${contactCount}`)

  if (!execute) {
    console.log('\nDry run only. To delete all contacts, run again with: --execute')
    process.exit(0)
  }

  if (contactCount === 0) {
    console.log('Nothing to delete.')
    process.exit(0)
  }

  let deleted = 0
  while (true) {
    const ids = await client.fetch(`*[_type == "whatsappContact"][0...${chunk}]._id`)
    if (!Array.isArray(ids) || ids.length === 0) break
    const trx = client.transaction()
    for (const id of ids) trx.delete(id)
    await trx.commit()
    deleted += ids.length
    process.stdout.write(`\rDeleted ${deleted} / ${contactCount} …`)
  }
  console.log(`\nDone. Deleted ${deleted} whatsappContact document(s). whatsappConversation count still: ${convCount}`)
}

main().catch((e) => {
  const code = e?.statusCode ?? e?.response?.statusCode
  const desc = e?.details?.description || e?.message || String(e)
  if (code === 403 || String(desc).includes('Insufficient permissions')) {
    console.error('\n── Sanity 403 / صلاحيات ──')
    console.error('التوكن الحالي لا يملك صلاحية update/delete على هذا الـ dataset.')
    console.error('الحل:')
    console.error('  1) sanity.io/manage → Project → API → Add API token → دور Editor')
    console.error('  2) ضع القيمة في: packages/sanity-studio/.env.local')
    console.error('     SANITY_API_WRITE_TOKEN=sk...')
    console.error('  (ملف الاستوديو يطغى على eiat-site بعد التحديث الأخير للسكربت)')
    console.error('────────────────────────\n')
  }
  console.error(e)
  process.exit(1)
})
