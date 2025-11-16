import { Participant, Match, BracketType } from '../types'

export function generateSingleEliminationBracket(participants: Participant[]): Match[] {
  const matches: Match[] = []
  let participantsCopy = [...participants]

  // Pad to next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantsCopy.length)))
  while (participantsCopy.length < nextPowerOf2) {
    participantsCopy.push({ id: `bye-${participantsCopy.length}`, name: 'BYE' })
  }

  let currentRound = 1
  let matchCounter = 1
  let currentMatches: Match[] = []

  // First round
  for (let i = 0; i < participantsCopy.length; i += 2) {
    const match: Match = {
      id: `match-${matchCounter}`,
      round: currentRound,
      matchNumber: matchCounter,
      participant1: participantsCopy[i],
      participant2: participantsCopy[i + 1],
    }
    currentMatches.push(match)
    matches.push(match)
    matchCounter++
  }

  // Subsequent rounds
  while (currentMatches.length > 1) {
    currentRound++
    const nextRoundMatches: Match[] = []

    for (let i = 0; i < currentMatches.length; i += 2) {
      const match: Match = {
        id: `match-${matchCounter}`,
        round: currentRound,
        matchNumber: matchCounter,
      }

      currentMatches[i].nextMatchId = match.id
      currentMatches[i + 1].nextMatchId = match.id

      nextRoundMatches.push(match)
      matches.push(match)
      matchCounter++
    }

    currentMatches = nextRoundMatches
  }

  return matches
}

export function generateDoubleEliminationBracket(participants: Participant[]): Match[] {
  // For simplicity, generate winners bracket similar to single elimination
  // Plus a losers bracket
  const matches: Match[] = []
  const winnersBracket = generateSingleEliminationBracket(participants)

  // Add winners bracket
  matches.push(...winnersBracket.map(m => ({ ...m, id: `w-${m.id}` })))

  // Generate losers bracket (simplified version)
  // In a full implementation, this would be more complex
  const losersRounds = Math.ceil(Math.log2(participants.length))
  let matchCounter = 1

  for (let round = 1; round <= losersRounds * 2 - 1; round++) {
    const match: Match = {
      id: `l-match-${matchCounter}`,
      round: round,
      matchNumber: matchCounter,
    }
    matches.push(match)
    matchCounter++
  }

  // Grand finals
  matches.push({
    id: 'grand-finals',
    round: losersRounds * 2,
    matchNumber: matchCounter,
  })

  return matches
}

export function generateRoundRobinMatches(participants: Participant[]): Match[] {
  const matches: Match[] = []
  let matchCounter = 1

  // Generate all possible pairings
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: `rr-match-${matchCounter}`,
        round: 1,
        matchNumber: matchCounter,
        participant1: participants[i],
        participant2: participants[j],
      })
      matchCounter++
    }
  }

  return matches
}

export function generateGroupStageMatches(participants: Participant[], groupSize: number = 4): Match[] {
  const matches: Match[] = []
  const numGroups = Math.ceil(participants.length / groupSize)
  let matchCounter = 1

  // Divide participants into groups
  for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
    const groupParticipants = participants.slice(
      groupIndex * groupSize,
      (groupIndex + 1) * groupSize
    )

    // Generate round-robin for each group
    for (let i = 0; i < groupParticipants.length; i++) {
      for (let j = i + 1; j < groupParticipants.length; j++) {
        matches.push({
          id: `g${groupIndex}-match-${matchCounter}`,
          round: groupIndex + 1,
          matchNumber: matchCounter,
          participant1: groupParticipants[i],
          participant2: groupParticipants[j],
        })
        matchCounter++
      }
    }
  }

  return matches
}

export function generateBracket(type: BracketType, participants: Participant[]): Match[] {
  switch (type) {
    case 'single-elimination':
      return generateSingleEliminationBracket(participants)
    case 'double-elimination':
      return generateDoubleEliminationBracket(participants)
    case 'round-robin':
      return generateRoundRobinMatches(participants)
    case 'group-stage':
      return generateGroupStageMatches(participants)
    default:
      return []
  }
}
