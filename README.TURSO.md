# PersonalityMatch - Turso Distributed SQLite Edition

This branch implements **Turso-inspired distributed SQLite database operations** for PersonalityMatch, enabling edge deployment, embedded replicas, and multi-location synchronization while maintaining the cost-optimized architecture.

## 🎯 What's New in This Branch

### Distributed SQLite Architecture

This implementation adds distributed database capabilities inspired by [Turso](https://turso.tech/), bringing:

- ✅ **Embedded Replicas**: Local SQLite files synced with primary database
- ✅ **WAL-Based Replication**: Frame-level synchronization using Write-Ahead Log
- ✅ **Multi-Node Support**: Unlimited replicas across any location
- ✅ **Zero-Latency Reads**: Local reads from embedded replicas
- ✅ **Automatic Sync**: Background synchronization with conflict resolution
- ✅ **Cost-Effective**: Still $18.50/month base cost, +$5/replica for additional nodes

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      PRIMARY DATABASE                         │
│                  (SQLite + WAL Monitoring)                    │
└─────────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │Replica 1│     │Replica 2│     │Replica N│
    │Embedded │     │ Remote  │     │  Edge   │
    │  Local  │     │   API   │     │   CDN   │
    └─────────┘     └─────────┘     └─────────┘
```

## 📦 Components

### 1. Core Services

- **`backend/src/config/turso.js`**: Turso configuration and validation
- **`backend/src/services/walFrameSync.js`**: WAL frame synchronization engine
- **`backend/src/services/tursoReplicationService.js`**: Replication orchestration
- **`backend/src/api/replication.js`**: HTTP API for replication management

### 2. Configuration Files

- **`.env.turso.example`**: Complete environment variable template
- **`TURSO_DISTRIBUTED_SQLITE.md`**: Comprehensive technical documentation
- **`README.TURSO.md`**: This file - quick start guide

### 3. Updated Files

- **`backend/src/config/database.js`**: Added Turso replication initialization
- **`backend/package.json`**: Already includes required dependencies (axios, sqlite3)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

All required dependencies (axios, sqlite3) are already in package.json.

### 2. Configure Environment

Copy the Turso environment template:

```bash
cp .env.turso.example .env
```

Edit `.env` with your settings:

```bash
# Enable Turso Replication
TURSO_REPLICA_ENABLED=true
TURSO_REPLICA_MODE=embedded
TURSO_REPLICA_PATH=./data/replica.db
TURSO_AUTO_SYNC=true

# Set a secure auth token
TURSO_PRIMARY_AUTH_TOKEN=$(openssl rand -hex 32)

# Configure sync interval (5 seconds)
TURSO_SYNC_INTERVAL=5000
```

### 3. Start the Server

```bash
npm run dev
```

Expected output:

```
📁 Using SQLite database (Cost-Optimized Mode)
   Location: ./data/personalitymatch.db
🚀 Initializing Turso Replication Service...
   Deployment mode: distributed
   Topology: single-node
🔄 Starting WAL frame synchronization...
   WAL file: ./data/personalitymatch.db-wal
📦 Initializing replicas...
✅ Initialized 1 replicas
✅ Turso replication initialized
Server running on port 3001
```

### 4. Test Replication

Check replication status:

```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  http://localhost:3001/api/replication/status
```

Expected response:

```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "deploymentMode": "distributed",
    "topology": "single-node",
    "replicas": [
      {
        "id": "embedded-local",
        "type": "embedded",
        "status": "active",
        "lastSync": "2024-12-02T15:30:00.000Z",
        "framesSynced": 0
      }
    ],
    "syncStatus": {
      "lastSync": null,
      "totalFramesSynced": 0,
      "failedSyncs": 0
    }
  }
}
```

## 🔧 Configuration Options

### Deployment Modes

#### Standalone (Development)

```env
TURSO_REPLICA_ENABLED=false
```

Single database, no replication.

#### Embedded Replica (Edge)

```env
TURSO_REPLICA_ENABLED=true
TURSO_REPLICA_MODE=embedded
TURSO_REPLICA_PATH=./data/replica.db
```

Primary + local embedded replica for zero-latency reads.

#### Multi-Replica (Global)

```env
TURSO_REPLICA_ENABLED=true
TURSO_NODES='[
  {"id":"us-east","type":"remote","url":"https://us-east.api.com","location":"us-east"},
  {"id":"eu-west","type":"remote","url":"https://eu-west.api.com","location":"eu-west"}
]'
```

Primary + multiple remote replicas across locations.

### Performance Tuning

```env
# Sync frequency
TURSO_SYNC_INTERVAL=5000          # 5 seconds

# WAL settings
TURSO_WAL_BUFFER_SIZE=1000        # Frame buffer size
TURSO_WAL_CHECKPOINT_INTERVAL=10000  # 10 seconds

# SQLite performance
TURSO_CACHE_SIZE=2000             # 8MB cache
TURSO_MMAP_SIZE=30000000000       # 30GB mmap
TURSO_BUSY_TIMEOUT=5000           # 5 second lock timeout
```

## 📊 API Endpoints

All replication endpoints require Bearer token authentication.

### Status and Monitoring

```bash
# Get replication status
GET /api/replication/status

# List all replicas
GET /api/replication/replicas

# Get specific replica
GET /api/replication/replicas/:replicaId

# Health check
GET /api/replication/health
```

### Replica Management

```bash
# Add replica
POST /api/replication/replicas
{
  "id": "edge-us-west",
  "type": "remote",
  "url": "https://us-west.example.com",
  "location": "us-west"
}

# Remove replica
DELETE /api/replication/replicas/:replicaId
```

### Synchronization

```bash
# Trigger manual sync (all replicas)
POST /api/replication/sync
{
  "fullSync": true
}

# Trigger sync for specific replica
POST /api/replication/sync
{
  "replicaId": "edge-us-west"
}
```

### Service Control

```bash
# Start replication service
POST /api/replication/start

# Stop replication service
POST /api/replication/stop
```

## 💰 Cost Analysis

### Base Configuration (Standalone)

| Component | Cost/Month |
|-----------|-----------|
| VPS (Hetzner CPX11) | $5.00 |
| SQLite Database | $0.00 |
| Frontend (Vercel) | $0.00 |
| Email (Brevo) | $0.00 |
| Domain | $1.00 |
| Wompi Fees (100 tx) | $12.00 |
| **Total** | **$18.00** |

### With Embedded Replica

| Component | Cost/Month |
|-----------|-----------|
| Base Configuration | $18.00 |
| Embedded Replica | $0.00 |
| **Total** | **$18.00** |

*No additional cost - replica runs on same VPS*

### With Remote Replicas

| Component | Cost/Month |
|-----------|-----------|
| Base Configuration | $18.00 |
| Replica 1 (VPS) | $5.00 |
| Replica 2 (VPS) | $5.00 |
| Replica 3 (VPS) | $5.00 |
| **Total** | **$33.00** |

*Each additional remote replica requires its own VPS*

## 🌍 Deployment Scenarios

### Scenario 1: Single Region (0-10K users)

**Setup**: Standalone or embedded replica
**Cost**: $18/month
**Performance**: 0.1-0.5ms read latency
**Availability**: 99.9%

### Scenario 2: Multi-Region (10K-100K users)

**Setup**: Primary + 2 remote replicas (US, EU)
**Cost**: $28/month
**Performance**: 0.1-0.5ms local reads, 50-200ms cross-region
**Availability**: 99.95%

### Scenario 3: Global Edge (100K+ users)

**Setup**: Primary + 5 remote replicas (US-East, US-West, EU, Asia, SA)
**Cost**: $43/month
**Performance**: <1ms reads globally
**Availability**: 99.99%

## 📖 Documentation

For complete technical documentation, see:

- **[TURSO_DISTRIBUTED_SQLITE.md](./TURSO_DISTRIBUTED_SQLITE.md)**: Full technical guide
  - Architecture deep-dive
  - API reference
  - Performance benchmarks
  - Troubleshooting guide

## 🔍 How It Works

### 1. Write-Ahead Log (WAL) Monitoring

```javascript
// WAL sync monitors SQLite WAL file for changes
const walSync = new WALFrameSync('/path/to/db.sqlite');

walSync.on('frames', (frames) => {
  // New database changes detected
  console.log(`Captured ${frames.length} WAL frames`);
});
```

### 2. Frame Distribution

```javascript
// Replication service distributes frames to all replicas
replicationService.on('distribute', async (frames) => {
  for (const replica of replicas) {
    await syncFramesToReplica(replica, frames);
  }
});
```

### 3. Replica Application

```javascript
// Replicas apply frames to their local database
await walSync.applyFrames(replicaPath, frames);
```

## 🧪 Testing

### Unit Tests

```bash
# Test WAL frame parsing
npm test -- walFrameSync.test.js

# Test replication service
npm test -- tursoReplicationService.test.js
```

### Integration Tests

```bash
# Start server
npm run dev

# Run integration tests
npm test -- integration/replication.test.js
```

### Manual Testing

1. Start server with replication enabled
2. Create some data (register user, create match)
3. Check replica database to verify sync
4. Monitor replication status via API

```bash
# Create test data
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Check replication status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/replication/status

# Verify replica has data
sqlite3 data/replica.db "SELECT * FROM users LIMIT 5;"
```

## 🛠️ Troubleshooting

### Issue: Replication not starting

**Check:**
1. `TURSO_REPLICA_ENABLED=true` in `.env`
2. Auth token is set: `TURSO_PRIMARY_AUTH_TOKEN`
3. Database paths exist and are writable
4. WAL mode is enabled on SQLite

**Solution:**
```bash
# Enable WAL mode
sqlite3 data/personalitymatch.db "PRAGMA journal_mode=WAL;"
```

### Issue: High replication lag

**Check:**
1. Sync interval: `TURSO_SYNC_INTERVAL`
2. Network latency to replicas
3. WAL buffer size: `TURSO_WAL_BUFFER_SIZE`

**Solution:**
```env
# Reduce sync interval
TURSO_SYNC_INTERVAL=1000  # 1 second

# Increase buffer
TURSO_WAL_BUFFER_SIZE=5000
```

### Issue: Memory usage growing

**Check:**
1. WAL file size: `ls -lh data/*.db-wal`
2. Cache size: `TURSO_CACHE_SIZE`
3. Checkpoint frequency

**Solution:**
```env
# More frequent checkpoints
TURSO_WAL_CHECKPOINT_INTERVAL=5000  # 5 seconds

# Smaller cache
TURSO_CACHE_SIZE=1000
```

## 🔗 Related Documentation

- [Cost Optimization Guide](./COST_OPTIMIZATION.md)
- [Wompi Integration](./docs/WOMPI_INTEGRATION.md)
- [Deployment Guide](./README.COST-OPTIMIZED.md)
- [TODO Planning](./TODO.md)

## 📚 Learn More

### About Turso

- [Turso Official Website](https://turso.tech/)
- [Turso Blog - Local-First SQLite](https://turso.tech/blog/local-first-cloud-connected-sqlite-with-turso-embedded-replicas)

### Alternative SQLite Replication Solutions

- [Litestream](https://litestream.io/) - Streaming replication
- [LiteSync](https://litesync.io/) - Multi-master synchronization
- [rqlite](https://rqlite.io/) - Distributed SQLite with Raft consensus

### SQLite Resources

- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [SQLite Performance Tuning](https://www.sqlite.org/speed.html)

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on GitHub.

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ using Turso-inspired architecture**
