export type BracketType = 'single-elimination' | 'double-elimination' | 'round-robin' | 'group-stage'

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
  loserNextMatchId?: string // For double elimination
}

export interface Bracket {
  id?: string
  name: string
  type: BracketType
  participants: Participant[]
  matches: Match[]
  createdAt?: Date
  updatedAt?: Date
}

export interface GroupStageGroup {
  id: string
  name: string
  participants: Participant[]
  matches: Match[]
  standings: GroupStanding[]
}

export interface GroupStanding {
  participant: Participant
  wins: number
  losses: number
  draws: number
  points: number
}

export interface RoundRobinStanding {
  participant: Participant
  wins: number
  losses: number
  draws: number
  points: number
  matchesPlayed: number
}
