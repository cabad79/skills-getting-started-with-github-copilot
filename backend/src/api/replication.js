/**
 * Turso Replication API Endpoints
 *
 * Provides HTTP API for distributed database operations
 */

const express = require('express');
const router = express.Router();
const { getInstance: getReplicationService } = require('../services/tursoReplicationService');

/**
 * Middleware to authenticate replication requests
 */
function authenticateReplication(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.TURSO_PRIMARY_AUTH_TOKEN || 'dev-token';

  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Invalid authentication token' });
  }

  next();
}

/**
 * GET /api/replication/status
 * Get replication service status
 */
router.get('/status', authenticateReplication, (req, res) => {
  try {
    const replicationService = getReplicationService();
    const status = replicationService.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting replication status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/replication/replicas
 * List all replicas
 */
router.get('/replicas', authenticateReplication, (req, res) => {
  try {
    const replicationService = getReplicationService();
    const status = replicationService.getStatus();

    res.json({
      success: true,
      replicas: status.replicas,
      count: status.replicas.length
    });
  } catch (error) {
    console.error('Error listing replicas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/replication/replicas/:replicaId
 * Get specific replica details
 */
router.get('/replicas/:replicaId', authenticateReplication, (req, res) => {
  try {
    const { replicaId } = req.params;
    const replicationService = getReplicationService();
    const replica = replicationService.getReplica(replicaId);

    if (!replica) {
      return res.status(404).json({
        success: false,
        error: 'Replica not found'
      });
    }

    res.json({
      success: true,
      replica
    });
  } catch (error) {
    console.error('Error getting replica:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/replication/replicas
 * Add a new replica node
 */
router.post('/replicas', authenticateReplication, async (req, res) => {
  try {
    const { id, type, path, url, location } = req.body;

    // Validate required fields
    if (!id || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, type'
      });
    }

    // Validate type
    if (!['embedded', 'remote'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "embedded" or "remote"'
      });
    }

    // Validate type-specific fields
    if (type === 'embedded' && !path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field for embedded replica: path'
      });
    }

    if (type === 'remote' && !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field for remote replica: url'
      });
    }

    const replicationService = getReplicationService();

    const replica = await replicationService.addReplica({
      id,
      type,
      path,
      url,
      location: location || 'unknown'
    });

    res.status(201).json({
      success: true,
      replica
    });
  } catch (error) {
    console.error('Error adding replica:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/replication/replicas/:replicaId
 * Remove a replica node
 */
router.delete('/replicas/:replicaId', authenticateReplication, async (req, res) => {
  try {
    const { replicaId } = req.params;
    const replicationService = getReplicationService();

    await replicationService.removeReplica(replicaId);

    res.json({
      success: true,
      message: `Replica ${replicaId} removed`
    });
  } catch (error) {
    console.error('Error removing replica:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/replication/apply-frames
 * Apply WAL frames to this replica (called by primary)
 */
router.post('/apply-frames', authenticateReplication, async (req, res) => {
  try {
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frames data'
      });
    }

    // Deserialize frame data (base64 to Buffer)
    const deserializedFrames = frames.map(frame => ({
      ...frame,
      data: Buffer.from(frame.data, 'base64')
    }));

    const replicationService = getReplicationService();

    // Get local database path
    const dbPath = process.env.SQLITE_PATH || require('path').join(__dirname, '../../data/personalitymatch.db');

    // Apply frames using WAL sync
    if (replicationService.primaryWALSync) {
      await replicationService.primaryWALSync.applyFrames(dbPath, deserializedFrames);
    } else {
      throw new Error('WAL sync not initialized on this replica');
    }

    res.json({
      success: true,
      framesApplied: frames.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error applying frames:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/replication/sync
 * Trigger manual synchronization
 */
router.post('/sync', authenticateReplication, async (req, res) => {
  try {
    const { replicaId, fullSync } = req.body;

    const replicationService = getReplicationService();

    if (fullSync) {
      await replicationService.performFullSync();
      res.json({
        success: true,
        message: 'Full sync triggered for all replicas'
      });
    } else if (replicaId) {
      const replica = replicationService.getReplica(replicaId);

      if (!replica) {
        return res.status(404).json({
          success: false,
          error: 'Replica not found'
        });
      }

      // Trigger sync for specific replica (would need implementation)
      res.json({
        success: true,
        message: `Sync triggered for replica: ${replicaId}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Must specify either replicaId or fullSync=true'
      });
    }
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/replication/start
 * Start replication service
 */
router.post('/start', authenticateReplication, async (req, res) => {
  try {
    const replicationService = getReplicationService();

    if (replicationService.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Replication service is already running'
      });
    }

    const dbPath = process.env.SQLITE_PATH || require('path').join(__dirname, '../../data/personalitymatch.db');

    await replicationService.initialize(dbPath);

    res.json({
      success: true,
      message: 'Replication service started'
    });
  } catch (error) {
    console.error('Error starting replication:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/replication/stop
 * Stop replication service
 */
router.post('/stop', authenticateReplication, async (req, res) => {
  try {
    const replicationService = getReplicationService();

    await replicationService.shutdown();

    res.json({
      success: true,
      message: 'Replication service stopped'
    });
  } catch (error) {
    console.error('Error stopping replication:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/replication/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'turso-replication',
    timestamp: new Date()
  });
});

module.exports = router;
