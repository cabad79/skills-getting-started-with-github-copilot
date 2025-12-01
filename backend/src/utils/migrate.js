/**
 * Database Migration Utility
 * Run with: node src/utils/migrate.js
 */

const db = require('../models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function migrate() {
  try {
    console.log('PersonalityMatch Database Migration Utility');
    console.log('==========================================\n');

    // Test connection
    console.log('Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✓ Database connection successful\n');

    // Confirm migration
    const answer = await new Promise(resolve => {
      rl.question('Run database sync? This will create/update tables. (yes/no): ', resolve);
    });

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Migration cancelled');
      rl.close();
      process.exit(0);
    }

    // Run migration
    console.log('\nSyncing database schema...');
    await db.sequelize.sync({ alter: true });
    console.log('✓ Database schema synchronized\n');

    // Show created tables
    const tables = await db.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
      { type: db.Sequelize.QueryTypes.SELECT }
    );

    console.log('Tables created:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    console.log('\n✓ Migration completed successfully');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    rl.close();
    process.exit(1);
  }
}

migrate();
