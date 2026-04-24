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
 * Loads missing keys from `.env.local` here or in `../eiat-site/.env.local` (does not override existing env).
 */

import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.resolve(__dirname, '..')

function mergeEnvFromFile(absPath) {
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
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

mergeEnvFromFile(path.join(pkgRoot, '.env.local'))
mergeEnvFromFile(path.join(pkgRoot, '../eiat-site/.env.local'))

const token = (process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN || '').trim()
const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'f46widyg').trim()
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
const execute = process.argv.includes('--execute')

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN or SANITY_TOKEN. Set in env or .env.local (studio or eiat-site).')
  process.exit(1)
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
  console.error(e)
  process.exit(1)
})
