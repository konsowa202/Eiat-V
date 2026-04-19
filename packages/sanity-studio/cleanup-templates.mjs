import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env.local' })

const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

async function cleanup() {
  console.log('Fetching templates to clean up duplicates...')
  const templates = await client.fetch(`*[_type == "whatsappTemplate"] | order(_createdAt desc) { _id, name }`)
  
  const seen = new Set()
  const toDelete = []

  for (const t of templates) {
    if (!t.name) continue
    if (seen.has(t.name)) {
      toDelete.push(t._id)
    } else {
      seen.add(t.name)
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found.')
    return
  }

  console.log(`Found ${toDelete.length} duplicates. Deleting...`)
  
  for (const id of toDelete) {
    try {
      await client.delete(id)
      console.log(`Deleted duplicate: ${id}`)
    } catch (err) {
      console.error(`Failed to delete ${id}:`, err.message)
    }
  }
  console.log('Cleanup complete!')
}

cleanup()
