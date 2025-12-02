const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Database Configuration
 * Supports both PostgreSQL (production/high-scale) and SQLite (cost-optimized)
 * With optional Turso-inspired distributed replication
 */

const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'postgres' or 'sqlite'
const TURSO_ENABLED = process.env.TURSO_REPLICA_ENABLED === 'true';

let sequelize;
let replicationService = null;

if (DB_TYPE === 'sqlite') {
  // SQLite Configuration (Cost-Optimized: $0/month)
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/personalitymatch.db');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // SQLite Optimizations
    dialectOptions: {
      // Enable Write-Ahead Logging for better concurrency
      mode: 'WAL'
    },

    // Connection pool (SQLite uses single connection)
    pool: {
      max: 1,
      min: 1,
      acquire: 30000,
      idle: 10000
    },

    define: {
      underscored: true,
      freezeTableName: true
    },

    // Disable auto-quoting (SQLite doesn't need it)
    quoteIdentifiers: false
  });

  console.log('📁 Using SQLite database (Cost-Optimized Mode)');
  console.log(`   Location: ${dbPath}`);

} else {
  // PostgreSQL Configuration (High-Scale)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,

      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      },

      define: {
        underscored: true,
        freezeTableName: true
      }
    }
  );

  console.log('🐘 Using PostgreSQL database (High-Scale Mode)');
}

// Initialize Turso replication if enabled
if (TURSO_ENABLED && DB_TYPE === 'sqlite') {
  const { getInstance } = require('../services/tursoReplicationService');
  replicationService = getInstance();

  // Initialize replication service asynchronously
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/personalitymatch.db');

  replicationService.initialize(dbPath)
    .then(() => {
      console.log('✅ Turso replication initialized');
    })
    .catch(error => {
      console.error('❌ Failed to initialize Turso replication:', error);
    });
}

module.exports = sequelize;
module.exports.replicationService = replicationService;
