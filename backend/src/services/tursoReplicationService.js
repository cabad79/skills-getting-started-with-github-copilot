/**
 * Turso Replication Service
 *
 * Orchestrates distributed SQLite database operations:
 * - Manages primary and replica databases
 * - Coordinates WAL frame synchronization
 * - Handles multi-node replication
 * - Provides conflict resolution
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const WALFrameSync = require('./walFrameSync');
const { config: tursoConfig } = require('../config/turso');

class TursoReplicationService {
  constructor() {
    this.config = tursoConfig;
    this.primaryWALSync = null;
    this.replicas = new Map();
    this.syncStatus = {
      lastSync: null,
      totalFramesSynced: 0,
      failedSyncs: 0,
      activeSyncs: 0
    };
    this.isRunning = false;
  }

  /**
   * Initialize replication service
   */
  async initialize(primaryDbPath) {
    console.log('🚀 Initializing Turso Replication Service...');
    console.log(`   Deployment mode: ${this.getDeploymentMode()}`);
    console.log(`   Topology: ${this.getTopology()}`);

    this.primaryDbPath = primaryDbPath;

    // Initialize WAL sync for primary database
    if (this.config.wal.enabled) {
      this.primaryWALSync = new WALFrameSync(primaryDbPath, this.config.wal);

      // Listen for WAL frame events
      this.primaryWALSync.on('frames', async (frames) => {
        await this.distributeFrames(frames);
      });

      this.primaryWALSync.on('flush', async (data) => {
        console.log(`💾 WAL flushed: ${data.count} frames`);
        this.syncStatus.totalFramesSynced += data.count;
        this.syncStatus.lastSync = new Date();
      });

      this.primaryWALSync.on('error', (error) => {
        console.error('❌ WAL sync error:', error);
        this.syncStatus.failedSyncs++;
      });
    }

    // Initialize replicas
    if (this.config.replica.enabled) {
      await this.initializeReplicas();
    }

    // Start automatic synchronization
    if (this.config.replica.autoSync) {
      this.startAutoSync();
    }

    this.isRunning = true;
    console.log('✅ Turso Replication Service initialized');
  }

  /**
   * Initialize replica databases
   */
  async initializeReplicas() {
    console.log('📦 Initializing replicas...');

    // Add configured nodes as replicas
    for (const node of this.config.nodes) {
      await this.addReplica(node);
    }

    // Initialize embedded replica if configured
    if (this.config.replica.mode === 'embedded') {
      await this.addReplica({
        id: 'embedded-local',
        type: 'embedded',
        path: this.config.replica.localPath,
        location: 'local'
      });
    }

    console.log(`✅ Initialized ${this.replicas.size} replicas`);
  }

  /**
   * Add a replica node
   */
  async addReplica(nodeConfig) {
    const { id, type, path: replicaPath, url, location } = nodeConfig;

    console.log(`➕ Adding replica: ${id} (${type}) at ${location}`);

    const replica = {
      id,
      type, // 'embedded' or 'remote'
      path: replicaPath,
      url,
      location,
      status: 'initializing',
      lastSync: null,
      framesSynced: 0,
      errors: 0
    };

    // For embedded replicas, ensure database file exists
    if (type === 'embedded') {
      await this.ensureReplicaDatabase(replicaPath);
    }

    this.replicas.set(id, replica);

    // Mark as active
    replica.status = 'active';

    console.log(`✅ Replica added: ${id}`);

    return replica;
  }

  /**
   * Ensure replica database exists (copy from primary if needed)
   */
  async ensureReplicaDatabase(replicaPath) {
    try {
      await fs.access(replicaPath);
      console.log(`   Replica database exists: ${replicaPath}`);
    } catch (error) {
      // Replica doesn't exist, copy from primary
      console.log(`   Creating new replica database: ${replicaPath}`);

      // Ensure directory exists
      const replicaDir = path.dirname(replicaPath);
      await fs.mkdir(replicaDir, { recursive: true });

      // Copy primary database to replica
      await fs.copyFile(this.primaryDbPath, replicaPath);

      console.log(`   ✅ Replica database created`);
    }
  }

  /**
   * Distribute WAL frames to all replicas
   */
  async distributeFrames(frames) {
    if (this.replicas.size === 0) {
      return;
    }

    this.syncStatus.activeSyncs++;

    const syncPromises = [];

    for (const [replicaId, replica] of this.replicas.entries()) {
      syncPromises.push(
        this.syncFramesToReplica(replica, frames)
          .catch(error => {
            console.error(`Failed to sync to replica ${replicaId}:`, error);
            replica.errors++;
            this.syncStatus.failedSyncs++;
          })
      );
    }

    await Promise.allSettled(syncPromises);

    this.syncStatus.activeSyncs--;
  }

  /**
   * Sync frames to a specific replica
   */
  async syncFramesToReplica(replica, frames) {
    if (replica.status !== 'active') {
      return;
    }

    const startTime = Date.now();

    if (replica.type === 'embedded') {
      // Apply frames directly to local replica
      await this.primaryWALSync.applyFrames(replica.path, frames);
    } else if (replica.type === 'remote') {
      // Send frames to remote replica via HTTP
      await this.sendFramesToRemote(replica, frames);
    }

    // Update replica stats
    replica.lastSync = new Date();
    replica.framesSynced += frames.length;

    const duration = Date.now() - startTime;
    console.log(`✅ Synced ${frames.length} frames to ${replica.id} in ${duration}ms`);
  }

  /**
   * Send frames to remote replica via HTTP
   */
  async sendFramesToRemote(replica, frames) {
    const endpoint = `${replica.url}/api/replication/apply-frames`;

    // Prepare frames for transmission (serialize buffers)
    const serializedFrames = frames.map(frame => ({
      ...frame,
      data: frame.data.toString('base64')
    }));

    const response = await axios.post(
      endpoint,
      { frames: serializedFrames },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.primary.authToken}`
        },
        timeout: 10000
      }
    );

    if (response.status !== 200) {
      throw new Error(`Remote sync failed: ${response.statusText}`);
    }

    return response.data;
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    if (this.autoSyncInterval) {
      return;
    }

    console.log(`🔄 Starting auto-sync (interval: ${this.config.replica.syncInterval}ms)`);

    // Start WAL sync
    if (this.primaryWALSync) {
      this.primaryWALSync.start();
    }

    // Periodic full sync
    this.autoSyncInterval = setInterval(async () => {
      await this.performFullSync();
    }, this.config.replica.syncInterval);
  }

  /**
   * Stop automatic synchronization
   */
  async stopAutoSync() {
    if (!this.autoSyncInterval) {
      return;
    }

    console.log('🛑 Stopping auto-sync...');

    if (this.primaryWALSync) {
      await this.primaryWALSync.stop();
    }

    clearInterval(this.autoSyncInterval);
    this.autoSyncInterval = null;

    console.log('✅ Auto-sync stopped');
  }

  /**
   * Perform full database synchronization
   */
  async performFullSync() {
    console.log('🔄 Performing full database sync...');

    for (const [replicaId, replica] of this.replicas.entries()) {
      if (replica.type === 'embedded' && replica.status === 'active') {
        try {
          // Copy entire database file
          await fs.copyFile(this.primaryDbPath, replica.path);

          replica.lastSync = new Date();
          console.log(`✅ Full sync complete for replica: ${replicaId}`);
        } catch (error) {
          console.error(`❌ Full sync failed for replica ${replicaId}:`, error);
          replica.errors++;
        }
      }
    }
  }

  /**
   * Handle write conflicts (last-write-wins strategy)
   */
  resolveConflict(local, remote) {
    if (this.config.sync.conflictResolution === 'last-write-wins') {
      // Use most recent timestamp
      return local.timestamp > remote.timestamp ? local : remote;
    }

    // Custom conflict resolution can be implemented here
    throw new Error('Custom conflict resolution not implemented');
  }

  /**
   * Get deployment mode
   */
  getDeploymentMode() {
    if (this.config.primary.enabled && this.config.replica.enabled) {
      return 'distributed';
    } else if (this.config.replica.enabled) {
      return 'replica-only';
    } else {
      return 'standalone';
    }
  }

  /**
   * Get replication topology
   */
  getTopology() {
    const nodeCount = this.config.nodes.length;

    if (nodeCount === 0) {
      return 'single-node';
    } else if (nodeCount === 1) {
      return 'primary-replica';
    } else {
      return 'multi-replica';
    }
  }

  /**
   * Get replication status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      deploymentMode: this.getDeploymentMode(),
      topology: this.getTopology(),
      replicas: Array.from(this.replicas.values()),
      syncStatus: this.syncStatus,
      walSync: this.primaryWALSync ? this.primaryWALSync.getStats() : null
    };
  }

  /**
   * Get replica by ID
   */
  getReplica(replicaId) {
    return this.replicas.get(replicaId);
  }

  /**
   * Remove replica
   */
  async removeReplica(replicaId) {
    const replica = this.replicas.get(replicaId);

    if (!replica) {
      throw new Error(`Replica not found: ${replicaId}`);
    }

    console.log(`➖ Removing replica: ${replicaId}`);

    this.replicas.delete(replicaId);

    console.log(`✅ Replica removed: ${replicaId}`);
  }

  /**
   * Shutdown replication service
   */
  async shutdown() {
    console.log('🛑 Shutting down Turso Replication Service...');

    await this.stopAutoSync();

    this.isRunning = false;

    console.log('✅ Turso Replication Service shutdown complete');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  TursoReplicationService,
  getInstance: () => {
    if (!instance) {
      instance = new TursoReplicationService();
    }
    return instance;
  }
};
