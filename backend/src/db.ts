import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../data/brackets.json')

export interface Participant {
  id: string
  name: string
  seed?: number
}

export interface Match {
  id: string
  round: number
  matchNumber: number
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
  score1?: number
  score2?: number
  nextMatchId?: string
  loserNextMatchId?: string
}

export interface Bracket {
  id: string
  name: string
  type: string
  participants: Participant[]
  matches: Match[]
  createdAt: string
  updatedAt: string
  groupSize?: number
  qualifiersPerGroup?: number
  knockoutMatches?: Match[]
}

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ brackets: [] }, null, 2))
}

function readDB(): { brackets: Bracket[] } {
  const data = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(data)
}

function writeDB(data: { brackets: Bracket[] }): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function createBracket(bracket: Omit<Bracket, 'id' | 'createdAt' | 'updatedAt'>): Bracket {
  const db = readDB()
  const newBracket: Bracket = {
    ...bracket,
    id: `bracket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.brackets.push(newBracket)
  writeDB(db)
  return newBracket
}

export function getAllBrackets(): Bracket[] {
  const db = readDB()
  return db.brackets.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getBracketById(id: string): Bracket | null {
  const db = readDB()
  return db.brackets.find(b => b.id === id) || null
}

export function updateBracket(id: string, updates: Partial<Bracket>): Bracket | null {
  const db = readDB()
  const index = db.brackets.findIndex(b => b.id === id)

  if (index === -1) return null

  db.brackets[index] = {
    ...db.brackets[index],
    ...updates,
    id, // Keep original id
    createdAt: db.brackets[index].createdAt, // Keep original createdAt
    updatedAt: new Date().toISOString(),
  }

  writeDB(db)
  return db.brackets[index]
}

export function deleteBracket(id: string): boolean {
  const db = readDB()
  const initialLength = db.brackets.length
  db.brackets = db.brackets.filter(b => b.id !== id)

  if (db.brackets.length < initialLength) {
    writeDB(db)
    return true
  }

  return false
}
