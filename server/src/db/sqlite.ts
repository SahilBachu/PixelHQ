import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/pixelhq.db';

// Create data directory if it doesn't exist
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better for concurrent access

// Initialize tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      googleId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      picture TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'idle',
      knowledgeTopics TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agentId) REFERENCES agents(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      topic TEXT NOT NULL,
      sources TEXT,
      status TEXT DEFAULT 'processing',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agentId) REFERENCES agents(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      userId TEXT PRIMARY KEY,
      openai_key TEXT,
      anthropic_key TEXT,
      google_key TEXT,
      groq_key TEXT,
      encrypted BOOLEAN DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS positions (
      agentId TEXT PRIMARY KEY,
      x REAL,
      y REAL,
      FOREIGN KEY(agentId) REFERENCES agents(id)
    );
  `);

  console.log('✓ Database initialized');
}

// Helper functions
export function getUser(googleId: string) {
  return db.prepare('SELECT * FROM users WHERE googleId = ?').get(googleId);
}

export function createUser(googleId: string, email: string, name: string, picture: string) {
  const id = `user_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, googleId, email, name, picture)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, googleId, email, name, picture);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getAgentsByUser(userId: string) {
  return db.prepare('SELECT * FROM agents WHERE userId = ? ORDER BY createdAt DESC').all(userId);
}

export function getAgent(agentId: string) {
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
}

export function createAgent(agentData: any) {
  const id = `agent_${Date.now()}`;
  db.prepare(`
    INSERT INTO agents (id, userId, name, title, avatar)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, agentData.userId, agentData.name, agentData.title, agentData.avatar);
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
}

export function updateAgent(agentId: string, updates: any) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE agents SET ${fields} WHERE id = ?`).run(...values, agentId);
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
}

export function saveMessage(agentId: string, userId: string, role: string, content: string) {
  db.prepare(`
    INSERT INTO messages (agentId, userId, role, content)
    VALUES (?, ?, ?, ?)
  `).run(agentId, userId, role, content);
}

export function getMessages(agentId: string, limit: number = 50) {
  return db.prepare(`
    SELECT * FROM messages WHERE agentId = ? ORDER BY timestamp DESC LIMIT ?
  `).all(agentId, limit).reverse();
}

export function saveApiKeys(userId: string, keys: any) {
  const existing = db.prepare('SELECT * FROM api_keys WHERE userId = ?').get(userId);
  if (existing) {
    db.prepare(`
      UPDATE api_keys 
      SET openai_key = ?, anthropic_key = ?, google_key = ?, groq_key = ?
      WHERE userId = ?
    `).run(keys.openai, keys.anthropic, keys.google, keys.groq, userId);
  } else {
    db.prepare(`
      INSERT INTO api_keys (userId, openai_key, anthropic_key, google_key, groq_key)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, keys.openai, keys.anthropic, keys.google, keys.groq);
  }
}

export function getApiKeys(userId: string) {
  return db.prepare('SELECT * FROM api_keys WHERE userId = ?').get(userId);
}

export function saveAgentPosition(agentId: string, x: number, y: number) {
  const existing = db.prepare('SELECT * FROM positions WHERE agentId = ?').get(agentId);
  if (existing) {
    db.prepare('UPDATE positions SET x = ?, y = ? WHERE agentId = ?').run(x, y, agentId);
  } else {
    db.prepare('INSERT INTO positions (agentId, x, y) VALUES (?, ?, ?)').run(agentId, x, y);
  }
}

export function getAgentPosition(agentId: string) {
  return db.prepare('SELECT * FROM positions WHERE agentId = ?').get(agentId);
}

export function saveKnowledge(agentId: string, userId: string, topic: string, sources: string[]) {
  db.prepare(`
    INSERT INTO knowledge (agentId, userId, topic, sources, status)
    VALUES (?, ?, ?, ?, 'embedded')
  `).run(agentId, userId, topic, JSON.stringify(sources));
}

export function getKnowledge(agentId: string) {
  return db.prepare('SELECT * FROM knowledge WHERE agentId = ?').all(agentId);
}

export default db;
