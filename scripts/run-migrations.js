import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigrations() {
  const migrationFiles = [
    '001_create_profiles.sql',
    '002_create_documents.sql',
    '003_create_analyses.sql',
    '004_create_clauses.sql',
  ]

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, file)
    console.log(`\n Running migration: ${file}`)

    try {
      const sql = fs.readFileSync(filePath, 'utf-8')
      const { error } = await supabase.rpc('exec', { sql })

      if (error) {
        console.error(`Error in ${file}:`, error)
      } else {
        console.log(`✓ ${file} completed`)
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err)
    }
  }

  console.log('\n✓ All migrations completed')
}

runMigrations()
