import { Participant, Match, BracketType } from '../types'

// Generate standard tournament seeding order to prevent BYE vs BYE matches
function getStandardSeeding(numParticipants: number): number[] {
  const rounds = Math.log2(numParticipants)
  let seeds = [1]

  for (let round = 0; round < rounds; round++) {
    const newSeeds: number[] = []
    const maxSeed = Math.pow(2, round + 1)

    for (const seed of seeds) {
      newSeeds.push(seed)
      newSeeds.push(maxSeed + 1 - seed)
    }

    seeds = newSeeds
  }

  return seeds
}

export function generateSingleEliminationBracket(participants: Participant[]): Match[] {
  const matches: Match[] = []
  let participantsCopy = [...participants]

  // Pad to next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantsCopy.length)))
  while (participantsCopy.length < nextPowerOf2) {
    participantsCopy.push({ id: `bye-${participantsCopy.length}`, name: 'BYE' })
  }

  // Apply standard tournament seeding to prevent BYE vs BYE
  const seeding = getStandardSeeding(nextPowerOf2)
  const seededParticipants = seeding.map(seed => participantsCopy[seed - 1])

  let currentRound = 1
  let matchCounter = 1
  let currentMatches: Match[] = []

  // First round with proper seeding
  for (let i = 0; i < seededParticipants.length; i += 2) {
    const match: Match = {
      id: `match-${matchCounter}`,
      round: currentRound,
      matchNumber: matchCounter,
      participant1: seededParticipants[i],
      participant2: seededParticipants[i + 1],
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
  const matches: Match[] = []
  let participantsCopy = [...participants]

  // Pad to next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantsCopy.length)))
  while (participantsCopy.length < nextPowerOf2) {
    participantsCopy.push({ id: `bye-${participantsCopy.length}`, name: 'BYE' })
  }

  // Apply standard tournament seeding to prevent BYE vs BYE
  const seeding = getStandardSeeding(nextPowerOf2)
  const seededParticipants = seeding.map(seed => participantsCopy[seed - 1])

  const totalRounds = Math.log2(nextPowerOf2)

  // Generate Winners Bracket (similar to single elimination)
  let currentRound = 1
  let matchCounter = 1
  let currentMatches: Match[] = []
  const winnersBracketMatches: Match[] = []

  // First round of winners bracket with proper seeding
  for (let i = 0; i < seededParticipants.length; i += 2) {
    const match: Match = {
      id: `w-r${currentRound}-m${matchCounter}`,
      round: currentRound,
      matchNumber: matchCounter,
      participant1: seededParticipants[i],
      participant2: seededParticipants[i + 1],
    }
    currentMatches.push(match)
    winnersBracketMatches.push(match)
    matchCounter++
  }

  // Subsequent rounds of winners bracket
  let winnersRound = currentRound
  while (currentMatches.length > 1) {
    winnersRound++
    const nextRoundMatches: Match[] = []
    matchCounter = 1

    for (let i = 0; i < currentMatches.length; i += 2) {
      const match: Match = {
        id: `w-r${winnersRound}-m${matchCounter}`,
        round: winnersRound,
        matchNumber: matchCounter,
      }

      currentMatches[i].nextMatchId = match.id
      currentMatches[i + 1].nextMatchId = match.id

      nextRoundMatches.push(match)
      winnersBracketMatches.push(match)
      matchCounter++
    }

    currentMatches = nextRoundMatches
  }

  // Generate Losers Bracket
  const losersBracketMatches: Match[] = []
  let losersRound = 1
  matchCounter = 1

  // The losers bracket has two types of rounds:
  // - Type A: Losers from winners bracket meet each other
  // - Type B: Winners from previous losers round meet new losers from winners bracket

  // Calculate number of participants that will drop to losers bracket from each winners round
  let losersFromWinnersRounds: number[] = []
  let tempParticipants = nextPowerOf2
  for (let i = 1; i <= totalRounds; i++) {
    losersFromWinnersRounds.push(tempParticipants / 2)
    tempParticipants = tempParticipants / 2
  }

  // Round 1 of losers bracket: First round losers from winners bracket meet
  const firstRoundLosersCount = losersFromWinnersRounds[0]
  const losersRound1Matches: Match[] = []
  for (let i = 0; i < firstRoundLosersCount / 2; i++) {
    const match: Match = {
      id: `l-r${losersRound}-m${i + 1}`,
      round: losersRound,
      matchNumber: i + 1,
    }
    losersRound1Matches.push(match)
    losersBracketMatches.push(match)
  }

  // Link winners bracket round 1 losers to losers bracket round 1
  for (let i = 0; i < winnersBracketMatches.length && i < losersFromWinnersRounds[0]; i++) {
    if (winnersBracketMatches[i].round === 1) {
      const loserMatchIndex = Math.floor(i / 2)
      winnersBracketMatches[i].loserNextMatchId = losersRound1Matches[loserMatchIndex]?.id
    }
  }

  let previousLosersMatches = losersRound1Matches
  losersRound++

  // Continue building losers bracket
  for (let winnersRoundIndex = 2; winnersRoundIndex <= totalRounds; winnersRoundIndex++) {
    // Type B round: Winners from previous losers round meet losers from current winners round
    if (previousLosersMatches.length > 0) {
      const typeARoundMatches: Match[] = []
      matchCounter = 1

      for (let i = 0; i < previousLosersMatches.length; i++) {
        const match: Match = {
          id: `l-r${losersRound}-m${matchCounter}`,
          round: losersRound,
          matchNumber: matchCounter,
        }

        // Previous losers round winner goes here
        previousLosersMatches[i].nextMatchId = match.id

        typeARoundMatches.push(match)
        losersBracketMatches.push(match)
        matchCounter++
      }

      // Link losers from current winners round to these matches
      const currentWinnersMatches = winnersBracketMatches.filter(m => m.round === winnersRoundIndex)
      for (let i = 0; i < currentWinnersMatches.length; i++) {
        currentWinnersMatches[i].loserNextMatchId = typeARoundMatches[i]?.id
      }

      previousLosersMatches = typeARoundMatches
      losersRound++

      // Type A round: Winners from type B round meet each other (if more than one match)
      if (typeARoundMatches.length > 1) {
        const typeBRoundMatches: Match[] = []
        matchCounter = 1

        for (let i = 0; i < typeARoundMatches.length; i += 2) {
          const match: Match = {
            id: `l-r${losersRound}-m${matchCounter}`,
            round: losersRound,
            matchNumber: matchCounter,
          }

          typeARoundMatches[i].nextMatchId = match.id
          if (typeARoundMatches[i + 1]) {
            typeARoundMatches[i + 1].nextMatchId = match.id
          }

          typeBRoundMatches.push(match)
          losersBracketMatches.push(match)
          matchCounter++
        }

        previousLosersMatches = typeBRoundMatches
        losersRound++
      }
    }
  }

  // Grand Finals
  const grandFinals: Match = {
    id: 'grand-finals',
    round: losersRound,
    matchNumber: 1,
  }

  // Link winners bracket finals winner to grand finals
  const winnersFinals = winnersBracketMatches[winnersBracketMatches.length - 1]
  winnersFinals.nextMatchId = grandFinals.id

  // Link losers bracket finals winner to grand finals
  if (previousLosersMatches.length > 0) {
    previousLosersMatches[previousLosersMatches.length - 1].nextMatchId = grandFinals.id
  }

  matches.push(...winnersBracketMatches, ...losersBracketMatches, grandFinals)

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

export function generateBracket(type: BracketType, participants: Participant[], groupSize: number = 4): Match[] {
  switch (type) {
    case 'single-elimination':
      return generateSingleEliminationBracket(participants)
    case 'double-elimination':
      return generateDoubleEliminationBracket(participants)
    case 'round-robin':
      return generateRoundRobinMatches(participants)
    case 'group-stage':
      return generateGroupStageMatches(participants, groupSize)
    default:
      return []
  }
}

export function generateKnockoutMatches(qualifiedParticipants: Participant[]): Match[] {
  // Generate a single elimination bracket for qualified players
  return generateSingleEliminationBracket(qualifiedParticipants).map(match => ({
    ...match,
    id: `knockout-${match.id}`,
  }))
}
