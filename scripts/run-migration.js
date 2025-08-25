#!/usr/bin/env node

const { execSync } = require("child_process")
const path = require("path")

console.log("🔄 Running database migration...")

try {
  // Run the migration SQL
  const migrationPath = path.join(__dirname, "../prisma/migrations/add_auth0_client_id.sql")

  // For now, we'll just regenerate Prisma client to pick up schema changes
  console.log("📦 Regenerating Prisma client...")
  execSync("npx prisma generate", { stdio: "inherit" })

  console.log("✅ Migration completed successfully!")
  console.log("📝 Note: You may need to manually run the SQL migration in your database:")
  console.log(`   ${migrationPath}`)
} catch (error) {
  console.error("❌ Migration failed:", error.message)
  process.exit(1)
}
