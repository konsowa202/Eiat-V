import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-03-01',
  token: 'skojJEZRNwNhQjcO1XEMDMnIarDqJEuFfhUkxxKipVN6EfYOCCOlhXGbUt9ZJVnSaQHvwkgGUjvNGZXorcE57zhrqF1C65R7BKQ2Toh3HK6PVWVIYEQRVghSu1IkOEQuIXJlRrOnWZyYzAxOrczdGZrbPCzKcY1WPP2bR6NqL4W7Tov9VegC'
})

async function run() {
  console.log('Fetching contacts to delete...')
  const ids = await client.fetch(`*[_type == "whatsappContact"][]._id`)
  console.log(`Found ${ids.length} contacts to delete.`)
  
  // Delete in batches of 1000
  for (let i = 0; i < ids.length; i += 1000) {
    const batch = ids.slice(i, i + 1000)
    console.log(`Deleting batch ${i/1000 + 1}...`)
    let transaction = client.transaction()
    batch.forEach(id => {
      transaction.delete(id)
    })
    await transaction.commit()
    console.log(`Batch ${i/1000 + 1} deleted.`)
  }
  console.log('Done!')
}

run().catch(console.error)
