/**
 * Database Utility - SQLite in Browser using SQL.js
 *
 * This module handles all database operations for the dating personality matching system.
 * It uses SQL.js (SQLite compiled to WebAssembly) to run a complete database in the browser.
 */

import initSqlJs from 'sql.js';
import localforage from 'localforage';

const DB_NAME = 'dating_personality_db';
const DB_VERSION = 1;

let db = null;
let SQL = null;

/**
 * Initialize SQL.js and load or create database
 */
export async function initDatabase() {
  if (db) return db;

  try {
    // Initialize SQL.js
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from IndexedDB
    const savedDb = await localforage.getItem(DB_NAME);

    if (savedDb) {
      // Load existing database
      db = new SQL.Database(new Uint8Array(savedDb));
      console.log('Loaded existing database from storage');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('Created new database');
      await createSchema();
      await saveDatabase();
    }

    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create database schema
 */
async function createSchema() {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
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

    -- Questionnaire responses
    CREATE TABLE IF NOT EXISTS questionnaire_responses (
      response_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      instrument TEXT NOT NULL,
      item_number INTEGER,
      question TEXT,
      response INTEGER,
      response_time_ms INTEGER,
      response_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    -- Attention checks
    CREATE TABLE IF NOT EXISTS attention_checks (
      check_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_number INTEGER,
      expected_response INTEGER,
      actual_response INTEGER,
      passed INTEGER,
      check_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    -- Big Five trait estimates
    CREATE TABLE IF NOT EXISTS trait_estimates (
      estimate_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      trait_name TEXT NOT NULL,
      score_z REAL,
      uncertainty REAL,
      source TEXT,
      created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    -- User preferences
    CREATE TABLE IF NOT EXISTS user_preferences (
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

    -- Match candidates
    CREATE TABLE IF NOT EXISTS matches (
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

    -- User interactions (swipes, messages, etc.)
    CREATE TABLE IF NOT EXISTS interactions (
      interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      interaction_type TEXT,
      created_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    -- Simulated user pool for matching
    CREATE TABLE IF NOT EXISTS user_pool (
      pool_user_id TEXT PRIMARY KEY,
      age INTEGER,
      gender TEXT,
      trait_o REAL,
      trait_c REAL,
      trait_e REAL,
      trait_a REAL,
      trait_n REAL,
      created_ts DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indices for performance
    CREATE INDEX IF NOT EXISTS idx_responses_user ON questionnaire_responses(user_id);
    CREATE INDEX IF NOT EXISTS idx_traits_user ON trait_estimates(user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_user ON matches(user_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
  `;

  db.run(schema);
  console.log('Database schema created');
}

/**
 * Save database to IndexedDB
 */
export async function saveDatabase() {
  if (!db) return;

  const data = db.export();
  await localforage.setItem(DB_NAME, data);
  console.log('Database saved to storage');
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearDatabase() {
  await localforage.removeItem(DB_NAME);
  db = null;
  console.log('Database cleared');
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Create a new user
 */
export function createUser(userData) {
  const userId = generateUUID();

  const stmt = db.prepare(`
    INSERT INTO users (user_id, age, gender, locale, age_verified)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    userData.age,
    userData.gender,
    userData.locale || 'en-US',
    userData.age_verified ? 1 : 0
  ]);

  stmt.free();
  saveDatabase();

  return userId;
}

/**
 * Update user consent flags
 */
export function updateConsent(userId, consentData) {
  const stmt = db.prepare(`
    UPDATE users
    SET consent_photo = ?,
        consent_video = ?,
        consent_text = ?,
        consent_sensors = ?,
        consent_ts = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);

  stmt.run([
    consentData.photo ? 1 : 0,
    consentData.video ? 1 : 0,
    consentData.text ? 1 : 0,
    consentData.sensors ? 1 : 0,
    userId
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Get user by ID
 */
export function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  stmt.bind([userId]);

  let user = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }

  stmt.free();
  return user;
}

/**
 * Get current user (assumes single user for demo)
 */
export function getCurrentUser() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY signup_ts DESC LIMIT 1');

  let user = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }

  stmt.free();
  return user;
}

// ============================================================================
// QUESTIONNAIRE OPERATIONS
// ============================================================================

/**
 * Save questionnaire response
 */
export function saveQuestionnaireResponse(userId, instrument, itemData) {
  const stmt = db.prepare(`
    INSERT INTO questionnaire_responses
    (user_id, instrument, item_number, question, response, response_time_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    instrument,
    itemData.itemNumber,
    itemData.question,
    itemData.response,
    itemData.responseTime || 0
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Save attention check result
 */
export function saveAttentionCheck(userId, checkData) {
  const stmt = db.prepare(`
    INSERT INTO attention_checks
    (user_id, item_number, expected_response, actual_response, passed)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    checkData.itemNumber,
    checkData.expected,
    checkData.actual,
    checkData.passed ? 1 : 0
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Get questionnaire responses for user
 */
export function getQuestionnaireResponses(userId, instrument) {
  const query = instrument
    ? 'SELECT * FROM questionnaire_responses WHERE user_id = ? AND instrument = ? ORDER BY item_number'
    : 'SELECT * FROM questionnaire_responses WHERE user_id = ? ORDER BY item_number';

  const stmt = db.prepare(query);
  stmt.bind(instrument ? [userId, instrument] : [userId]);

  const responses = [];
  while (stmt.step()) {
    responses.push(stmt.getAsObject());
  }

  stmt.free();
  return responses;
}

/**
 * Get attention check pass rate
 */
export function getAttentionCheckPassRate(userId) {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(passed) as passed
    FROM attention_checks
    WHERE user_id = ?
  `);

  stmt.bind([userId]);

  let result = { total: 0, passed: 0, rate: 0 };
  if (stmt.step()) {
    const data = stmt.getAsObject();
    result = {
      total: data.total,
      passed: data.passed,
      rate: data.total > 0 ? data.passed / data.total : 0
    };
  }

  stmt.free();
  return result;
}

// ============================================================================
// TRAIT ESTIMATION OPERATIONS
// ============================================================================

/**
 * Save trait estimate
 */
export function saveTraitEstimate(userId, traitData) {
  const stmt = db.prepare(`
    INSERT INTO trait_estimates (user_id, trait_name, score_z, uncertainty, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    traitData.trait,
    traitData.score,
    traitData.uncertainty || 0.5,
    traitData.source || 'questionnaire'
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Get trait estimates for user
 */
export function getTraitEstimates(userId) {
  const stmt = db.prepare(`
    SELECT * FROM trait_estimates
    WHERE user_id = ?
    ORDER BY created_ts DESC
  `);

  stmt.bind([userId]);

  const estimates = [];
  while (stmt.step()) {
    estimates.push(stmt.getAsObject());
  }

  stmt.free();
  return estimates;
}

/**
 * Get Big Five scores for user (most recent)
 */
export function getBigFiveScores(userId) {
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const scores = {};

  traits.forEach(trait => {
    const stmt = db.prepare(`
      SELECT score_z, uncertainty
      FROM trait_estimates
      WHERE user_id = ? AND trait_name = ?
      ORDER BY created_ts DESC
      LIMIT 1
    `);

    stmt.bind([userId, trait]);

    if (stmt.step()) {
      const data = stmt.getAsObject();
      scores[trait] = {
        score: data.score_z,
        uncertainty: data.uncertainty
      };
    } else {
      scores[trait] = { score: 0, uncertainty: 1.0 };
    }

    stmt.free();
  });

  return scores;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Save user preferences
 */
export function saveUserPreferences(userId, preferences) {
  const stmt = db.prepare(`
    INSERT INTO user_preferences
    (user_id, min_age, max_age, max_distance_km, seeking_gender, relationship_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    preferences.minAge,
    preferences.maxAge,
    preferences.maxDistance,
    preferences.seekingGender,
    preferences.relationshipType
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Get user preferences
 */
export function getUserPreferences(userId) {
  const stmt = db.prepare(`
    SELECT * FROM user_preferences
    WHERE user_id = ?
    ORDER BY created_ts DESC
    LIMIT 1
  `);

  stmt.bind([userId]);

  let prefs = null;
  if (stmt.step()) {
    prefs = stmt.getAsObject();
  }

  stmt.free();
  return prefs;
}

// ============================================================================
// MATCHING OPERATIONS
// ============================================================================

/**
 * Initialize simulated user pool for matching demo
 */
export function initializeUserPool(count = 50) {
  const stmt = db.prepare(`
    INSERT INTO user_pool (pool_user_id, age, gender, trait_o, trait_c, trait_e, trait_a, trait_n)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < count; i++) {
    const poolUserId = generateUUID();
    const age = Math.floor(Math.random() * 30) + 20; // 20-50
    const gender = Math.random() > 0.5 ? 'male' : 'female';

    // Generate random Big Five scores (z-scores roughly -2 to +2)
    const traits = {
      o: (Math.random() - 0.5) * 4,
      c: (Math.random() - 0.5) * 4,
      e: (Math.random() - 0.5) * 4,
      a: (Math.random() - 0.5) * 4,
      n: (Math.random() - 0.5) * 4
    };

    stmt.run([
      poolUserId,
      age,
      gender,
      traits.o,
      traits.c,
      traits.e,
      traits.a,
      traits.n
    ]);
  }

  stmt.free();
  saveDatabase();
  console.log(`Initialized user pool with ${count} candidates`);
}

/**
 * Get user pool
 */
export function getUserPool() {
  const stmt = db.prepare('SELECT * FROM user_pool');

  const pool = [];
  while (stmt.step()) {
    pool.push(stmt.getAsObject());
  }

  stmt.free();
  return pool;
}

/**
 * Save match
 */
export function saveMatch(userId, matchData) {
  const stmt = db.prepare(`
    INSERT INTO matches
    (user_id, candidate_id, similarity_score, compatibility_score, final_score, rank)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    userId,
    matchData.candidateId,
    matchData.similarityScore,
    matchData.compatibilityScore,
    matchData.finalScore,
    matchData.rank
  ]);

  stmt.free();
  saveDatabase();
}

/**
 * Get matches for user
 */
export function getMatches(userId, limit = 10) {
  const stmt = db.prepare(`
    SELECT m.*, p.*
    FROM matches m
    JOIN user_pool p ON m.candidate_id = p.pool_user_id
    WHERE m.user_id = ?
    ORDER BY m.final_score DESC
    LIMIT ?
  `);

  stmt.bind([userId, limit]);

  const matches = [];
  while (stmt.step()) {
    matches.push(stmt.getAsObject());
  }

  stmt.free();
  return matches;
}

/**
 * Save interaction (like, pass, message)
 */
export function saveInteraction(userId, targetUserId, type) {
  const stmt = db.prepare(`
    INSERT INTO interactions (user_id, target_user_id, interaction_type)
    VALUES (?, ?, ?)
  `);

  stmt.run([userId, targetUserId, type]);
  stmt.free();
  saveDatabase();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Execute raw SQL (for debugging)
 */
export function executeSQL(sql, params = []) {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();
  return results;
}

/**
 * Get database statistics
 */
export function getStats() {
  const stats = {
    users: executeSQL('SELECT COUNT(*) as count FROM users')[0]?.count || 0,
    responses: executeSQL('SELECT COUNT(*) as count FROM questionnaire_responses')[0]?.count || 0,
    traits: executeSQL('SELECT COUNT(*) as count FROM trait_estimates')[0]?.count || 0,
    matches: executeSQL('SELECT COUNT(*) as count FROM matches')[0]?.count || 0,
    poolSize: executeSQL('SELECT COUNT(*) as count FROM user_pool')[0]?.count || 0
  };

  return stats;
}

export default {
  initDatabase,
  saveDatabase,
  clearDatabase,
  createUser,
  updateConsent,
  getUser,
  getCurrentUser,
  saveQuestionnaireResponse,
  saveAttentionCheck,
  getQuestionnaireResponses,
  getAttentionCheckPassRate,
  saveTraitEstimate,
  getTraitEstimates,
  getBigFiveScores,
  saveUserPreferences,
  getUserPreferences,
  initializeUserPool,
  getUserPool,
  saveMatch,
  getMatches,
  saveInteraction,
  executeSQL,
  getStats
};
