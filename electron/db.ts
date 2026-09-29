import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

export interface CharacterRecord {
  id: string
  name: string
  avatar: string
  mood?: string
}

export interface MessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  characterId?: string
  imageUrl?: string
  videoUrl?: string
  isAudio?: number | boolean
  audioUrl?: string
}

const dbPath = path.join(app.getPath('userData'), 'chat_history.db')
const db = new Database(dbPath)

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    mood TEXT
  );

 CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    character_id TEXT,
    image_url TEXT,
    video_url TEXT,
    is_audio INTEGER DEFAULT 0,
    audio_url TEXT
  );
`)

// Мягкие миграции
try {
  db.exec(`ALTER TABLE messages ADD COLUMN character_id TEXT;`)
} catch {}

try {
  db.exec(`ALTER TABLE messages ADD COLUMN image_url TEXT;`)
} catch {}

try {
  db.exec(`ALTER TABLE messages ADD COLUMN video_url TEXT;`)
} catch {}

try {
  db.exec(`ALTER TABLE messages ADD COLUMN is_audio INTEGER DEFAULT 0;`)
} catch {}

try {
  db.exec(`ALTER TABLE messages ADD COLUMN audio_url TEXT;`)
} catch {}

const defaultCharacters: CharacterRecord[] = [
  // AI Girls (1-10)
  { id: 'sakura', name: 'Sakura', avatar: '/avatars/1.jpg', mood: 'Missing you...' },
  { id: 'yuki', name: 'Yuki', avatar: '/avatars/2.jpg', mood: 'Thinking about you...' },
  { id: 'hana', name: 'Hana', avatar: '/avatars/3.jpg', mood: 'Wants to talk...' },
  { id: 'rin', name: 'Rin', avatar: '/avatars/4.jpg', mood: 'Busy reading...' },
  { id: 'asuka', name: 'Asuka', avatar: '/avatars/5.jpg', mood: 'Gaming right now...' },
  { id: 'miku', name: 'Miku', avatar: '/avatars/6.jpg', mood: 'Listening to music...' },
  { id: 'rei', name: 'Rei', avatar: '/avatars/7.jpg', mood: 'Stargazing...' },
  { id: 'hinata', name: 'Hinata', avatar: '/avatars/8.jpg', mood: 'Cooking dinner...' },
  { id: 'akane', name: 'Akane', avatar: '/avatars/9.jpg', mood: 'On a walk...' },
  { id: 'kuro', name: 'Kuro', avatar: '/avatars/10.jpg', mood: 'Chilling...' },

  // Anime (11-20)
  { id: 'anime_11', name: 'Nami', avatar: '/avatars/11.jpg', mood: 'Navigating...' },
  { id: 'anime_12', name: 'Zero Two', avatar: '/avatars/12.jpg', mood: 'Darling~' },
  { id: 'anime_13', name: 'Power', avatar: '/avatars/13.jpg', mood: 'Meowy is hungry' },
  { id: 'anime_14', name: 'Makima', avatar: '/avatars/14.jpg', mood: 'Looking at you...' },
  { id: 'anime_15', name: 'Marin', avatar: '/avatars/15.jpg', mood: 'Making cosplay!' },
  { id: 'anime_16', name: 'Yor', avatar: '/avatars/16.jpg', mood: 'Cooking dinner...' },
  { id: 'anime_17', name: 'Chika', avatar: '/avatars/17.jpg', mood: 'Playing board games' },
  { id: 'anime_18', name: 'Megumin', avatar: '/avatars/18.jpg', mood: 'Charging explosion magic' },
  { id: 'anime_19', name: 'Tohru', avatar: '/avatars/19.jpg', mood: 'Baking for you...' },
  { id: 'anime_20', name: 'Shoko', avatar: '/avatars/20.jpg', mood: 'Reading a book' },

  // MILF (21-25)
  { id: 'milf_21', name: 'Victoria', avatar: '/avatars/21.jpg', mood: 'Sipping wine...' },
  { id: 'milf_22', name: 'Samantha', avatar: '/avatars/22.jpg', mood: 'In the office' },
  { id: 'milf_23', name: 'Monica', avatar: '/avatars/23.jpg', mood: 'Relaxing at home' },
  { id: 'milf_24', name: 'Beatrice', avatar: '/avatars/24.jpg', mood: 'Listening to jazz' },
  { id: 'milf_25', name: 'Diana', avatar: '/avatars/25.jpg', mood: 'Working on art' },

  // Ex (26)
  { id: 'ex_26', name: 'Chloe', avatar: '/avatars/26.jpg', mood: 'Up at 2 AM...' },
]

const insertStmt = db.prepare('INSERT OR REPLACE INTO characters (id, name, avatar, mood) VALUES (?, ?, ?, ?)')
for (const char of defaultCharacters) {
  insertStmt.run(char.id, char.name, char.avatar, char.mood || '')
}

export const dbService = {
  getAllMessages(): MessageRecord[] {
    const stmt = db.prepare('SELECT id, role, content, timestamp, character_id as characterId, image_url as imageUrl, video_url as videoUrl, is_audio as isAudio, audio_url as audioUrl FROM messages ORDER BY timestamp ASC')
    return stmt.all() as MessageRecord[]
  },

  saveMessage(msg: MessageRecord): void {
    const charId = msg.characterId || 'sakura'
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO messages (id, role, content, timestamp, character_id, image_url, video_url, is_audio, audio_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      msg.id,
      msg.role,
      msg.content,
      msg.timestamp,
      charId,
      msg.imageUrl || null,
      msg.videoUrl || null,
      msg.isAudio ? 1 : 0,
      msg.audioUrl || null
    )
  },

  deleteMessage(id: string): void {
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?')
    stmt.run(id)
  },
  
  clearHistory(): void {
    const stmt = db.prepare('DELETE FROM messages')
    stmt.run()
  },

  getCharacters(): CharacterRecord[] {
    return db.prepare('SELECT id, name, avatar, mood FROM characters').all() as CharacterRecord[]
  },

  getMessagesByCharacter(characterId: string): MessageRecord[] {
    const stmt = db.prepare(`
      SELECT id, role, content, timestamp, character_id as characterId, image_url as imageUrl, video_url as videoUrl, is_audio as isAudio, audio_url as audioUrl
      FROM messages
      WHERE character_id = ?
      ORDER BY timestamp ASC
    `)
    return stmt.all(characterId) as MessageRecord[]
  },

  getLastMessageByCharacter(characterId: string): MessageRecord | undefined {
    const stmt = db.prepare(`
      SELECT id, role, content, timestamp, character_id as characterId, image_url as imageUrl, video_url as videoUrl, is_audio as isAudio, audio_url as audioUrl
      FROM messages
      WHERE character_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `)
    return stmt.get(characterId) as MessageRecord | undefined
  },

  // Новый метод для сохранения созданной через онбординг девушки
  addCharacter(char: CharacterRecord): void {
    const stmt = db.prepare('INSERT OR REPLACE INTO characters (id, name, avatar, mood) VALUES (?, ?, ?, ?)')
    stmt.run(char.id, char.name, char.avatar, char.mood || '')
  },
}