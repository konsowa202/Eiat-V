import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'f46widyg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skojJEZRNwNhQjcO1XEMDMnIarDqJEuFfhUkxxKipVN6EfYOCCOlhXGbUt9ZJVnSaQHvwkgGUjvNGZXorcE57zhrqF1C65R7BKQ2Toh3HK6PVWVIYEQRVghSu1IkOEQuIXJlRrOnWZyYzAxOrczdGZrbPCzKcY1WPP2bR6NqL4W7Tov9VegC',
  useCdn: false,
})

async function listTemplates() {
  const tpls = await client.fetch('*[_type == "whatsappTemplate"]{name, category}')
  console.log(JSON.stringify(tpls, null, 2))
}

listTemplates()
