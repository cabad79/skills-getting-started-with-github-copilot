# PersonalityMatch - Architecture Document

**System:** PersonalityMatch Dating Platform
**Version:** 1.0
**Date:** December 2024
**Architects:** Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Overview](#2-architectural-overview)
3. [System Components](#3-system-components)
4. [Data Architecture](#4-data-architecture)
5. [Security Architecture](#5-security-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Algorithm Architecture](#7-algorithm-architecture)
8. [Technology Stack](#8-technology-stack)
9. [Design Decisions](#9-design-decisions)
10. [Future Architecture](#10-future-architecture)

---

## 1. Executive Summary

### 1.1 Architectural Philosophy

PersonalityMatch employs a **radical client-side architecture** where all data processing, storage, and matching algorithms run entirely in the user's browser. This approach is driven by three core principles:

1. **Privacy by Design:** No user data ever transmitted to servers
2. **Zero Trust:** System cannot access user data even if compromised
3. **Scalability:** Client-side processing scales infinitely with user base

### 1.2 Key Characteristics

- **Architecture Pattern:** Single-Page Application (SPA) + Client-Side Database
- **Data Flow:** Unidirectional (no server communication post-load)
- **State Management:** Local browser storage (IndexedDB)
- **Compute Model:** Edge computing (user's device)
- **Hosting Model:** Static file distribution via CDN

### 1.3 Unique Architectural Features

✅ **No Backend Servers** - Zero API endpoints
✅ **Distributed Database** - Each user has isolated database instance
✅ **Client-Side Algorithms** - All matching logic runs in browser
✅ **Zero-Knowledge Architecture** - Platform cannot access user data
✅ **Horizontally Scalable** - No server capacity constraints

---

## 2. Architectural Overview

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER (Client)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              React Application Layer                   │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │  │
│  │  │  Pages   │  │Components│  │  Routing │  │ State│  │  │
│  │  │          │  │          │  │          │  │      │  │  │
│  │  │ Welcome  │  │ Consent  │  │  React   │  │React │  │  │
│  │  │ Consent  │  │ Question │  │  Router  │  │State │  │  │
│  │  │ Results  │  │ Match    │  │   DOM    │  │Hooks │  │  │
│  │  │ Matches  │  │ Profile  │  │          │  │      │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                       │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  Database   │  │  Matching   │  │  Scoring     │  │  │
│  │  │  Utils      │  │  Algorithm  │  │  Logic       │  │  │
│  │  │             │  │             │  │              │  │  │
│  │  │  CRUD ops   │  │ Mahalanobis │  │ Big Five     │  │  │
│  │  │  Queries    │  │ similarity  │  │ calculation  │  │  │
│  │  │  Schema     │  │ Filtering   │  │ Z-scores     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Data Persistence Layer                     │  │
│  │                                                        │  │
│  │  ┌─────────────────┐         ┌──────────────────────┐  │  │
│  │  │   SQL.js        │         │   localforage        │  │  │
│  │  │   (SQLite WASM) │◄────────┤   (IndexedDB)        │  │  │
│  │  │                 │         │                      │  │  │
│  │  │  In-Memory DB   │  Save/  │  Persistent Storage  │  │  │
│  │  │  Full SQL       │  Load   │  Key-Value Store     │  │  │
│  │  │  Transactional  │         │  Async API           │  │  │
│  │  └─────────────────┘         └──────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

                           ↕ HTTPS
                   (Initial Load ONLY)

┌──────────────────────────────────────────────────────────────┐
│              CDN / Static File Host (Edge)                    │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │  index.html    │  │  JS Bundles    │  │  CSS Files    │  │
│  │  Entry point   │  │  vendor.js     │  │  styles.css   │  │
│  │                │  │  database.js   │  │  components   │  │
│  │                │  │  app.js        │  │               │  │
│  └────────────────┘  └────────────────┘  └───────────────┘  │
│                                                              │
│  AWS S3 / CloudFront / Netlify / Vercel                      │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Architecture

```
User Action Flow:
─────────────────

1. INITIAL LOAD
   Browser → CDN: GET /index.html
   CDN → Browser: HTML + JS + CSS
   Browser: Load React app
   Browser: Initialize SQL.js (download WASM)
   Browser: Load database from IndexedDB (if exists)

2. USER INTERACTION (e.g., Complete Questionnaire)
   User → React: Click response button
   React → Business Logic: Calculate scores
   Business Logic → SQL.js: INSERT response
   SQL.js → localforage: Persist database
   localforage → IndexedDB: Save binary data
   React: Update UI (instant feedback)

3. MATCHING
   User → React: Click "Find Matches"
   React → Business Logic: Run matching algorithm
   Business Logic → SQL.js: Query user pool
   SQL.js: Return candidates
   Business Logic: Calculate similarity scores
   React: Display ranked matches

NO SERVER COMMUNICATION after initial load!
```

### 2.3 Component Interaction Diagram

```
React Components           Business Logic               Data Layer
─────────────────         ────────────────             ──────────

  ┌──────────┐
  │ Welcome  │
  └────┬─────┘
       │
       ↓
  ┌──────────┐            ┌──────────────┐
  │ Consent  │───────────→│ createUser() │───────→ SQL.js
  └────┬─────┘            └──────────────┘           ↓
       │                                          IndexedDB
       ↓
  ┌──────────┐            ┌──────────────┐
  │Question- │───────────→│ saveResponse │───────→ SQL.js
  │naire     │            │ ()           │           ↓
  └────┬─────┘            └──────────────┘        IndexedDB
       │
       ↓
  ┌──────────┐            ┌──────────────┐
  │ Results  │◄───────────│ getBigFive   │←─────── SQL.js
  └────┬─────┘            │ Scores()     │           ↑
       │                  └──────────────┘        IndexedDB
       │
       ↓                   ┌──────────────┐
  ┌──────────┐            │ generate     │
  │ Matches  │───────────→│ Matches()    │───────→ SQL.js
  └──────────┘            └──────────────┘           ↓
                                                  IndexedDB
```

---

## 3. System Components

### 3.1 Frontend Layer

#### 3.1.1 React Application

**Framework:** React 18.3.1

**Architecture Pattern:** Component-Based

**Key Components:**

```
src/
├── pages/              # Route-level components
│   ├── Welcome.jsx     # Landing page
│   ├── Consent.jsx     # Multi-step consent flow
│   ├── Questionnaire.jsx  # IPIP-50 assessment
│   ├── Results.jsx     # Big Five profile display
│   └── Matches.jsx     # Match browsing & details
│
├── components/         # Reusable UI components
│   └── (future shared components)
│
├── utils/              # Business logic
│   ├── database.js     # Database operations (800+ lines)
│   └── matching.js     # Matching algorithm (400+ lines)
│
├── data/               # Static data
│   └── ipip50.js       # Questionnaire items
│
├── hooks/              # Custom React hooks
│   └── (future: useDatabase, useMatching)
│
└── App.jsx             # Main app + routing
```

**State Management:**
- **Local State:** React `useState` for UI state
- **Global State:** None (by design—data in SQL.js)
- **Side Effects:** `useEffect` for database initialization

**Routing:**
- **Library:** React Router DOM v6
- **Strategy:** Client-side routing (no page reloads)
- **Routes:**
  - `/` → Welcome
  - `/consent` → Consent
  - `/questionnaire` → Questionnaire
  - `/results` → Results
  - `/matches` → Matches

#### 3.1.2 Build System

**Bundler:** Vite 5.x

**Why Vite?**
- Fast development server (instant HMR)
- Optimized production builds
- Native ES modules support
- Excellent React support

**Build Configuration:**

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'database': ['sql.js', 'localforage']
        }
      }
    }
  },
  base: './'  // Relative URLs for S3/CDN
});
```

**Output Structure:**

```
dist/
├── index.html           # Entry point (cache: 0)
├── assets/
│   ├── vendor.[hash].js    # React libs (cache: 1 year)
│   ├── database.[hash].js  # SQL.js + helpers (cache: 1 year)
│   ├── app.[hash].js       # App code (cache: 1 year)
│   └── index.[hash].css    # Styles (cache: 1 year)
└── assets/
    └── (images, fonts)
```

### 3.2 Database Layer

#### 3.2.1 SQL.js (SQLite in WebAssembly)

**What is SQL.js?**
- SQLite database compiled to WebAssembly
- Runs entirely in browser memory
- Full SQL support (SELECT, INSERT, JOIN, etc.)
- No network calls after initial WASM load

**Architecture:**

```
┌─────────────────────────────────────────┐
│           JavaScript API                │
│  (database.js - CRUD operations)        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         SQL.js JavaScript Wrapper       │
│  (Translates JS calls to WASM)          │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      SQLite WASM (sql-wasm.wasm)        │
│  (Compiled C code, ~500KB)              │
│  - SQL parser                           │
│  - Query optimizer                      │
│  - B-tree storage engine                │
│  - Transaction manager                  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│       Browser Memory (Heap)             │
│  (In-memory database ~1MB)              │
└─────────────────────────────────────────┘
```

**Initialization Flow:**

```javascript
// 1. Load SQL.js WASM
const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});

// 2. Check for existing database in IndexedDB
const savedDb = await localforage.getItem('dating_personality_db');

// 3. Load or create database
if (savedDb) {
  db = new SQL.Database(new Uint8Array(savedDb));
} else {
  db = new SQL.Database();  // New empty database
  await createSchema();
}

// 4. Database is ready
return db;
```

**Performance Characteristics:**
- **Read Query:** < 1ms (in-memory)
- **Write + Persist:** < 10ms (write to IndexedDB)
- **Join Queries:** < 5ms (even with 1000+ rows)
- **Full-Table Scan:** < 10ms (user pool of 50)

#### 3.2.2 IndexedDB (Persistence Layer)

**Purpose:** Persist SQL.js database across browser sessions

**Library:** localforage (IndexedDB abstraction)

**Why IndexedDB?**
- Async API (non-blocking)
- Large storage quota (50MB+ typical)
- Persistent (survives browser restarts)
- Transactions and locking

**Storage Flow:**

```javascript
// Save database to IndexedDB
export async function saveDatabase() {
  const data = db.export();  // Serialize to Uint8Array
  await localforage.setItem('dating_personality_db', data);
}

// Called after every write operation
saveQuestionnaireResponse(...);
saveDatabase();  // Auto-persist
```

**Storage Size:**
- Empty database: ~50KB
- After questionnaire: ~100KB
- With 50 match records: ~150KB
- Typical: < 1MB per user

### 3.3 Algorithm Layer

#### 3.3.1 Personality Scoring

**Input:** 50 questionnaire responses (1-5 Likert scale)

**Process:**

```javascript
// 1. Group by trait
responses.forEach(r => {
  const item = IPIP50_ITEMS.find(i => i.id === r.itemId);
  let score = r.response;
  
  // 2. Reverse-score minus-keyed items
  if (item.keyed === 'minus') {
    score = 6 - score;  // 1→5, 2→4, 3→3, 4→2, 5→1
  }
  
  traits[item.trait].push(score);
});

// 3. Calculate means
Object.keys(traits).forEach(trait => {
  const mean = sum(traits[trait]) / traits[trait].length;
  
  // 4. Convert to z-score
  const z = (mean - populationMean) / populationSD;
  // populationMean ≈ 3.0, populationSD ≈ 0.7
  
  results[trait] = { raw: mean, z: z };
});
```

**Output:** Big Five z-scores (mean=0, SD=1)

#### 3.3.2 Matching Algorithm

**Method:** Uncertainty-Aware Mahalanobis Distance

**Formula:**

```
distance = (t_A - t_B)ᵀ · Σ⁻¹ · (t_A - t_B)

where:
  t_A, t_B = trait vectors (5D: O, C, E, A, N)
  Σ = combined covariance matrix (uncertainty)
    = Σ_A + Σ_B + Σ_pop
  
similarity = exp(-0.5 · distance)

final_score = α · similarity + β · complementarity - γ · penalties
```

**Weights:**

```javascript
const traitWeights = {
  openness: 1.0,
  conscientiousness: 1.2,  // Higher weight
  extraversion: 1.0,
  agreeableness: 1.2,      // Higher weight
  neuroticism: 0.8         // Lower weight
};

const scoreWeights = {
  alpha: 0.7,   // Similarity
  beta: 0.2,    // Complementarity
  gamma: 1.0    // Penalties
};
```

**Implementation:**

```javascript
export function generateMatches(userTraits, userPrefs, candidatePool, topK=20) {
  // 1. Hard filters
  const filtered = candidatePool.filter(c => 
    passesHardFilters(userPrefs, c)
  );
  
  // 2. Score each candidate
  const scored = filtered.map(candidate => {
    const similarity = computeUncertaintyAwareSimilarity(
      userTraits, 
      extractTraits(candidate)
    );
    
    const complementarity = computeComplementarity(...);
    const penalties = computePenalties(...);
    
    const finalScore = 
      0.7 * similarity + 
      0.2 * complementarity - 
      1.0 * penalties;
    
    return { candidate, finalScore, similarity, complementarity };
  });
  
  // 3. Sort and take top K
  scored.sort((a,b) => b.finalScore - a.finalScore);
  return scored.slice(0, topK);
}
```

---

## 4. Data Architecture

### 4.1 Database Schema

```sql
-- Users (demographics & consent)
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  age INTEGER,
  gender TEXT,
  locale TEXT,
  signup_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  consent_photo INTEGER DEFAULT 0,
  consent_video INTEGER DEFAULT 0,
  consent_text INTEGER DEFAULT 0,
  consent_sensors INTEGER DEFAULT 0,
  consent_ts DATETIME,
  age_verified INTEGER DEFAULT 0
);

-- Questionnaire responses (IPIP-50)
CREATE TABLE questionnaire_responses (
  response_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  instrument TEXT NOT NULL,  -- 'IPIP-50' or 'IPIP-120'
  item_number INTEGER,
  question TEXT,
  response INTEGER,  -- 1-5 Likert
  response_time_ms INTEGER,
  response_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Attention checks (quality control)
CREATE TABLE attention_checks (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  item_number INTEGER,
  expected_response INTEGER,
  actual_response INTEGER,
  passed INTEGER,  -- 0 or 1
  check_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Big Five trait estimates
CREATE TABLE trait_estimates (
  estimate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  trait_name TEXT NOT NULL,  -- 'openness', 'conscientiousness', etc.
  score_z REAL,  -- Z-score
  uncertainty REAL,  -- Standard error
  source TEXT,  -- 'IPIP-50', 'facial', 'sensors', etc.
  created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User preferences (for filtering)
CREATE TABLE user_preferences (
  pref_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  max_distance_km REAL,
  seeking_gender TEXT,
  relationship_type TEXT,
  created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Simulated candidate pool (demo)
CREATE TABLE user_pool (
  pool_user_id TEXT PRIMARY KEY,
  age INTEGER,
  gender TEXT,
  trait_o REAL,  -- Openness z-score
  trait_c REAL,  -- Conscientiousness z-score
  trait_e REAL,  -- Extraversion z-score
  trait_a REAL,  -- Agreeableness z-score
  trait_n REAL,  -- Neuroticism z-score
  created_ts DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Match records
CREATE TABLE matches (
  match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  similarity_score REAL,
  compatibility_score REAL,
  final_score REAL,
  rank INTEGER,
  created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User interactions (likes, passes, etc.)
CREATE TABLE interactions (
  interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  interaction_type TEXT,  -- 'like', 'pass', 'message', etc.
  created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indices for performance
CREATE INDEX idx_responses_user ON questionnaire_responses(user_id);
CREATE INDEX idx_traits_user ON trait_estimates(user_id);
CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_interactions_user ON interactions(user_id);
```

### 4.2 Data Lifecycle

```
User Journey → Data Storage
─────────────────────────────

1. SIGNUP
   Input: Age, gender, locale
   Write: users table (INSERT)
   Storage: ~100 bytes

2. CONSENT
   Input: Consent flags per modality
   Update: users table (UPDATE)
   Storage: ~50 bytes

3. QUESTIONNAIRE
   Input: 50 responses (1-5 scale)
   Write: questionnaire_responses (INSERT × 50)
   Write: attention_checks (INSERT × 3)
   Storage: ~5KB

4. SCORING
   Input: Responses from DB
   Process: Calculate Big Five z-scores
   Write: trait_estimates (INSERT × 5)
   Storage: ~500 bytes

5. MATCHING
   Input: User traits + preferences
   Read: user_pool (SELECT)
   Process: Run matching algorithm
   Write: matches (INSERT × 20)
   Storage: ~2KB

6. PERSISTENCE
   Trigger: After each write
   Action: Export SQL.js DB to Uint8Array
   Storage: IndexedDB ('dating_personality_db')
   Total: ~10-20KB per user
```

---

## 5. Security Architecture

### 5.1 Threat Model

**Threat:** Malicious actor gains access to servers

**Impact:** NONE — no user data on servers

**Threat:** Browser-based XSS attack

**Mitigation:**
- Content Security Policy (CSP)
- React escapes all user input by default
- No `dangerouslySetInnerHTML` used

**Threat:** Man-in-the-middle (MITM) attack

**Mitigation:**
- HTTPS only (forced via CloudFront)
- Subresource Integrity (SRI) for external scripts

**Threat:** Local device compromise

**Mitigation:**
- Limited (data in plain IndexedDB)
- Future: Client-side encryption with user passphrase

### 5.2 Security Layers

```
┌─────────────────────────────────────────┐
│   Layer 1: Transport Security           │
│   - HTTPS/TLS 1.3                       │
│   - Certificate pinning (CloudFront)     │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   Layer 2: Content Security              │
│   - CSP headers                         │
│   - SRI for external scripts            │
│   - X-Content-Type-Options: nosniff     │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   Layer 3: Application Security          │
│   - React XSS protection                │
│   - No eval() or dangerous functions    │
│   - Input validation                    │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   Layer 4: Data Security                 │
│   - Local-only storage (IndexedDB)      │
│   - No server transmission              │
│   - User-controlled deletion            │
└─────────────────────────────────────────┘
```

### 5.3 Privacy by Design

**Principle 1: Data Minimization**
- Collect only essential information
- Age range, not exact birthdate
- Gender, not detailed demographics

**Principle 2: Purpose Limitation**
- Data used only for matching
- No analytics, no tracking

**Principle 3: Transparency**
- Open-source algorithm
- Clear data usage disclosure
- No hidden processes

**Principle 4: User Control**
- Export all data (GDPR)
- Delete all data instantly
- No account recovery = true privacy

---

## 6. Deployment Architecture

### 6.1 Hosting Strategy

```
┌───────────────────────────────────────────────────────┐
│                  Global Users                         │
│  (Browsers: Chrome, Safari, Firefox, Edge)            │
└────────────────────┬──────────────────────────────────┘
                     ↓ HTTPS Request
┌───────────────────────────────────────────────────────┐
│              CloudFront (CDN)                          │
│  - SSL/TLS termination                                │
│  - Edge caching (200+ locations)                       │
│  - DDoS protection                                    │
│  - Gzip/Brotli compression                            │
└────────────────────┬──────────────────────────────────┘
                     ↓ Cache Miss
┌───────────────────────────────────────────────────────┐
│              AWS S3 (Origin)                           │
│  - Static file storage                                │
│  - Website hosting enabled                            │
│  - Versioning enabled                                 │
└────────────────────────────────────────────────────────┘
```

### 6.2 CI/CD Pipeline

```
┌─────────────┐
│ Developer   │
│ Commits Code│
└──────┬──────┘
       ↓
┌──────────────┐
│ Git Push     │
│ (GitHub)     │
└──────┬───────┘
       ↓
┌──────────────────┐
│ GitHub Actions   │
│ - Run tests      │
│ - Build (Vite)   │
│ - Lint/Format    │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Artifact         │
│ dist/            │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Deploy to S3     │
│ aws s3 sync...   │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Invalidate CDN   │
│ CloudFront cache │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Live!            │
│ Users see update │
└──────────────────┘
```

---

## 7. Algorithm Architecture

### 7.1 Big Five Scoring Algorithm

```
Input: 50 responses (1-5 scale)
  ↓
┌─────────────────────────────────────┐
│ 1. Group by Trait                   │
│    - Extraversion: items 1-10       │
│    - Agreeableness: items 11-20     │
│    - Conscientiousness: items 21-30 │
│    - Neuroticism: items 31-40       │
│    - Openness: items 41-50          │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. Reverse Score Minus-Keyed Items  │
│    score_new = 6 - score_old        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. Calculate Raw Means              │
│    mean = Σ(scores) / n_items       │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. Convert to Z-Scores              │
│    z = (mean - μ_pop) / σ_pop       │
│    μ_pop ≈ 3.0, σ_pop ≈ 0.7         │
└─────────────────────────────────────┘
  ↓
Output: 5 z-scores (O, C, E, A, N)
```

### 7.2 Matching Algorithm Architecture

```
Input: User traits, Candidate pool
  ↓
┌─────────────────────────────────────┐
│ 1. Hard Filters                     │
│    - Age range                      │
│    - Gender preference              │
│    - Distance (future)              │
│    Pool: 1000 → 300 candidates      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. For Each Candidate:              │
│    a) Calculate similarity          │
│       dist = (t_A-t_B)ᵀΣ⁻¹(t_A-t_B) │
│       sim = exp(-0.5 * dist)        │
│    b) Calculate complementarity     │
│    c) Calculate penalties           │
│    d) Final score = weighted sum    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. Sort by Final Score (desc)       │
│    300 candidates ranked            │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. Take Top K (default K=20)        │
│    20 best matches                  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 5. (Optional) MMR Diversification   │
│    Balance similarity vs. diversity │
└─────────────────────────────────────┘
  ↓
Output: Ranked list of 20 matches
```

---

## 8. Technology Stack

### 8.1 Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI component library |
| **Build Tool** | Vite | 5.x | Fast bundler & dev server |
| **Routing** | React Router DOM | 6.28.0 | Client-side routing |
| **Styling** | CSS | CSS3 | Custom properties, responsive |
| **Database** | SQL.js | 1.10.3 | SQLite in WebAssembly |
| **Storage** | localforage | 1.10.0 | IndexedDB abstraction |

### 8.2 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | JavaScript linting |
| **Prettier** | Code formatting |
| **Vite DevTools** | Fast refresh, HMR |
| **Chrome DevTools** | Debugging, profiling |

### 8.3 Deployment Stack

| Component | Service | Purpose |
|-----------|---------|---------|
| **Static Hosting** | AWS S3 | Origin for static files |
| **CDN** | CloudFront | Global content delivery |
| **DNS** | Route 53 | Domain management |
| **CI/CD** | GitHub Actions | Automated deployment |
| **Monitoring** | CloudWatch | Logs, metrics, alarms |

---

## 9. Design Decisions

### 9.1 Why Client-Side Only?

**Decision:** Process all data in browser, no backend

**Rationale:**
1. **Privacy:** No server access to user data
2. **Scalability:** Infinite scaling at near-zero cost
3. **Simplicity:** No server management, APIs, databases
4. **Trust:** Users can verify no data transmission
5. **Compliance:** GDPR-compliant by design

**Trade-offs:**
- ❌ No real-time matching between users
- ❌ Cannot sync across devices (future: export/import)
- ❌ Requires capable device (but most phones sufficient)
- ✅ Ultimate privacy, infinite scale, minimal cost

### 9.2 Why SQL.js vs. Other Options?

**Alternatives Considered:**
- **localStorage:** Too limited (key-value only, 5MB limit)
- **Plain IndexedDB:** Low-level, no SQL, complex
- **Dexie.js:** Better than raw IndexedDB, but no SQL
- **PouchDB:** Sync-focused, heavier than needed

**Why SQL.js:**
- ✅ Full SQL support (familiar, powerful)
- ✅ Relational model fits data structure
- ✅ Mature (SQLite is 20+ years old)
- ✅ Good performance (compiled C → WASM)
- ✅ ~500KB (acceptable one-time load)

### 9.3 Why React vs. Other Frameworks?

**Alternatives Considered:**
- **Vue:** Good, but smaller ecosystem
- **Svelte:** Excellent, but less mature
- **Vanilla JS:** Too much boilerplate

**Why React:**
- ✅ Largest ecosystem (libraries, tools, support)
- ✅ Component model fits UI structure
- ✅ Virtual DOM for efficient updates
- ✅ Excellent documentation
- ✅ Team familiarity

### 9.4 Why Vite vs. Create React App?

**Why Vite:**
- ✅ 10-100x faster dev server (native ES modules)
- ✅ Faster builds (Rollup + esbuild)
- ✅ Better tree shaking
- ✅ Modern, actively maintained
- ❌ CRA is legacy, deprecated

---

## 10. Future Architecture

### 10.1 Planned Enhancements

**Phase 2: Real User Matching**
- Add authentication (OAuth, magic links)
- Backend API for user discovery
- Real-time presence indicators
- In-app messaging (WebSockets)

**Architecture Change:**
```
Current: 100% client-side
Future: Hybrid (profile storage server + client-side matching)
```

**Why Hybrid:**
- User discovery requires central registry
- Messaging requires server relay
- But personality matching stays client-side

### 10.2 Multimodal Data Integration

**Planned Features:**
- Facial personality analysis (computer vision)
- Text analysis from bio (NLP)
- Smartphone behavioral sensing

**Architecture Addition:**
```
┌─────────────────────────────────┐
│  Browser (Extended)             │
│  ┌──────────────────────────┐  │
│  │  Current: SQL.js + React  │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  New: TensorFlow.js       │  │
│  │  - Facial analysis        │  │
│  │  - Text embeddings        │  │
│  │  - Multimodal fusion      │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

### 10.3 Advanced Matching

**Planned Algorithms:**
- Learning-to-rank (learn from user feedback)
- Temporal dynamics (traits evolve over time)
- Context-aware matching (mood, location, time)

---

## Conclusion

PersonalityMatch's architecture represents a paradigm shift in dating platforms: prioritizing privacy through radical client-side design while maintaining sophisticated matching capabilities. By leveraging modern web technologies—React, SQL.js, IndexedDB, and static hosting—we achieve a system that is simultaneously simple, scalable, and secure.

**Key Architectural Strengths:**
1. ✅ Privacy by default (zero-knowledge architecture)
2. ✅ Infinite scalability (client-side processing)
3. ✅ Minimal cost (static hosting pennies/month)
4. ✅ Simple deployment (no backend complexity)
5. ✅ Transparent (open-source, auditable)

This architecture demonstrates that ethical, privacy-first systems can coexist with sophisticated algorithms and excellent user experience.

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** Q2 2025

For technical questions: architecture@personalitymatch.example.com
