/**
 * Turso-Inspired Distributed SQLite Configuration
 *
 * Provides distributed database capabilities for SQLite:
 * - Embedded replicas (local SQLite files synced with primary)
 * - WAL-based frame replication
 * - Multi-node synchronization
 * - Edge deployment support
 */

const path = require('path');

const tursoConfig = {
  // Primary database configuration
  primary: {
    enabled: process.env.TURSO_PRIMARY_ENABLED === 'true',
    url: process.env.TURSO_PRIMARY_URL || 'local',
    authToken: process.env.TURSO_PRIMARY_AUTH_TOKEN,
    location: process.env.TURSO_PRIMARY_LOCATION || 'local'
  },

  // Replica configuration
  replica: {
    enabled: process.env.TURSO_REPLICA_ENABLED === 'true',
    mode: process.env.TURSO_REPLICA_MODE || 'embedded', // 'embedded' or 'remote'
    syncInterval: parseInt(process.env.TURSO_SYNC_INTERVAL) || 5000, // ms
    localPath: process.env.TURSO_REPLICA_PATH || path.join(__dirname, '../../data/replica.db'),
    autoSync: process.env.TURSO_AUTO_SYNC !== 'false' // true by default
  },

  // Replication nodes
  nodes: process.env.TURSO_NODES ? JSON.parse(process.env.TURSO_NODES) : [],

  // WAL frame replication
  wal: {
    enabled: process.env.TURSO_WAL_ENABLED !== 'false', // true by default
    frameBufferSize: parseInt(process.env.TURSO_WAL_BUFFER_SIZE) || 1000,
    checkpointInterval: parseInt(process.env.TURSO_WAL_CHECKPOINT_INTERVAL) || 10000, // ms
    compressionEnabled: process.env.TURSO_WAL_COMPRESSION === 'true'
  },

  // Synchronization strategy
  sync: {
    strategy: process.env.TURSO_SYNC_STRATEGY || 'eventual', // 'eventual' or 'strong'
    conflictResolution: process.env.TURSO_CONFLICT_RESOLUTION || 'last-write-wins', // 'last-write-wins' or 'custom'
    batchSize: parseInt(process.env.TURSO_SYNC_BATCH_SIZE) || 100,
    maxRetries: parseInt(process.env.TURSO_SYNC_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.TURSO_SYNC_RETRY_DELAY) || 1000 // ms
  },

  // Performance settings
  performance: {
    cacheSize: parseInt(process.env.TURSO_CACHE_SIZE) || 2000, // pages
    mmapSize: parseInt(process.env.TURSO_MMAP_SIZE) || 30000000000, // bytes (30GB)
    busyTimeout: parseInt(process.env.TURSO_BUSY_TIMEOUT) || 5000, // ms
    journalMode: process.env.TURSO_JOURNAL_MODE || 'WAL',
    synchronous: process.env.TURSO_SYNCHRONOUS || 'NORMAL' // OFF, NORMAL, FULL
  },

  // Security
  security: {
    encryptionEnabled: process.env.TURSO_ENCRYPTION_ENABLED === 'true',
    encryptionKey: process.env.TURSO_ENCRYPTION_KEY,
    tlsEnabled: process.env.TURSO_TLS_ENABLED !== 'false',
    authRequired: process.env.TURSO_AUTH_REQUIRED !== 'false'
  },

  // Monitoring
  monitoring: {
    enabled: process.env.TURSO_MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.TURSO_METRICS_INTERVAL) || 60000, // ms
    logLevel: process.env.TURSO_LOG_LEVEL || 'info' // 'debug', 'info', 'warn', 'error'
  }
};

// Validation
function validateConfig() {
  const errors = [];

  // If replica is enabled, must have sync interval
  if (tursoConfig.replica.enabled && !tursoConfig.replica.syncInterval) {
    errors.push('Replica enabled but no sync interval specified');
  }

  // If primary is remote, must have URL and auth token
  if (tursoConfig.primary.enabled && tursoConfig.primary.url !== 'local') {
    if (!tursoConfig.primary.authToken) {
      errors.push('Remote primary database requires auth token');
    }
  }

  // Validate sync strategy
  const validStrategies = ['eventual', 'strong'];
  if (!validStrategies.includes(tursoConfig.sync.strategy)) {
    errors.push(`Invalid sync strategy: ${tursoConfig.sync.strategy}`);
  }

  // Validate conflict resolution
  const validResolutions = ['last-write-wins', 'custom'];
  if (!validResolutions.includes(tursoConfig.sync.conflictResolution)) {
    errors.push(`Invalid conflict resolution: ${tursoConfig.sync.conflictResolution}`);
  }

  if (errors.length > 0) {
    throw new Error(`Turso configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

// Get deployment mode
function getDeploymentMode() {
  if (tursoConfig.primary.enabled && tursoConfig.replica.enabled) {
    return 'distributed'; // Primary + replicas
  } else if (tursoConfig.replica.enabled) {
    return 'replica-only'; // Edge replica only
  } else {
    return 'standalone'; // Single node
  }
}

// Get replication topology
function getTopology() {
  const nodeCount = tursoConfig.nodes.length;

  if (nodeCount === 0) {
    return 'single-node';
  } else if (nodeCount === 1) {
    return 'primary-replica';
  } else {
    return 'multi-replica';
  }
}

module.exports = {
  config: tursoConfig,
  validateConfig,
  getDeploymentMode,
  getTopology
};
