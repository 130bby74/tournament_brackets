import { Match, Participant, BracketType } from '../types'

export function autoAdvanceWinners(
  matches: Match[],
  updatedMatchId: string,
  winnerId: string,
  loserId: string,
  participants: Participant[],
  bracketType: BracketType
): Match[] {
  const updatedMatches = [...matches]
  const currentMatch = updatedMatches.find(m => m.id === updatedMatchId)

  if (!currentMatch) return updatedMatches

  const winner = participants.find(p => p.id === winnerId)
  const loser = participants.find(p => p.id === loserId)

  // Handle single elimination and group stage knockout
  if (bracketType === 'single-elimination' || currentMatch.id.startsWith('knockout-')) {
    if (currentMatch.nextMatchId && winner) {
      const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)
      if (nextMatch) {
        // Determine if winner should go to participant1 or participant2
        // Find which match in previous round feeds into this position
        const previousMatches = updatedMatches.filter(m => m.nextMatchId === nextMatch.id)
        const matchIndex = previousMatches.findIndex(m => m.id === currentMatch.id)

        if (matchIndex === 0) {
          nextMatch.participant1 = winner
        } else if (matchIndex === 1) {
          nextMatch.participant2 = winner
        } else {
          // Fallback: put in first empty slot
          if (!nextMatch.participant1) {
            nextMatch.participant1 = winner
          } else if (!nextMatch.participant2) {
            nextMatch.participant2 = winner
          }
        }
      }
    }
  }

  // Handle double elimination
  if (bracketType === 'double-elimination') {
    // Advance winner in winners bracket
    if (currentMatch.id.startsWith('w-') && currentMatch.nextMatchId && winner) {
      const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)
      if (nextMatch) {
        const previousMatches = updatedMatches.filter(m => m.nextMatchId === nextMatch.id)
        const matchIndex = previousMatches.findIndex(m => m.id === currentMatch.id)

        if (matchIndex === 0) {
          nextMatch.participant1 = winner
        } else if (matchIndex === 1) {
          nextMatch.participant2 = winner
        } else {
          if (!nextMatch.participant1) {
            nextMatch.participant1 = winner
          } else if (!nextMatch.participant2) {
            nextMatch.participant2 = winner
          }
        }
      }
    }

    // Send loser to losers bracket
    if (currentMatch.id.startsWith('w-') && currentMatch.loserNextMatchId && loser) {
      const loserNextMatch = updatedMatches.find(m => m.id === currentMatch.loserNextMatchId)
      if (loserNextMatch) {
        if (!loserNextMatch.participant1) {
          loserNextMatch.participant1 = loser
        } else if (!loserNextMatch.participant2) {
          loserNextMatch.participant2 = loser
        }
      }
    }

    // Advance winner in losers bracket
    if (currentMatch.id.startsWith('l-') && currentMatch.nextMatchId && winner) {
      const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)
      if (nextMatch) {
        const previousMatches = updatedMatches.filter(m => m.nextMatchId === nextMatch.id)
        const matchIndex = previousMatches.findIndex(m => m.id === currentMatch.id)

        if (matchIndex === 0) {
          nextMatch.participant1 = winner
        } else if (matchIndex === 1) {
          nextMatch.participant2 = winner
        } else {
          if (!nextMatch.participant1) {
            nextMatch.participant1 = winner
          } else if (!nextMatch.participant2) {
            nextMatch.participant2 = winner
          }
        }
      }
    }

    // Handle grand finals
    if (currentMatch.id === 'grand-finals' && winner) {
      // Grand finals winner is the tournament winner - no advancement needed
    }
  }

  return updatedMatches
}

export function clearDownstreamMatches(
  matches: Match[],
  updatedMatchId: string,
  bracketType: BracketType
): Match[] {
  // When a match is updated, clear any downstream matches that were populated by this match
  // This allows re-entering scores if needed
  const updatedMatches = [...matches]
  const currentMatch = updatedMatches.find(m => m.id === updatedMatchId)

  if (!currentMatch || !currentMatch.nextMatchId) return updatedMatches

  const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)
  if (!nextMatch) return updatedMatches

  // Find which participant slot this match feeds into
  const previousMatches = updatedMatches.filter(m => m.nextMatchId === nextMatch.id)
  const matchIndex = previousMatches.findIndex(m => m.id === currentMatch.id)

  // Clear the appropriate participant
  if (matchIndex === 0) {
    nextMatch.participant1 = undefined
    nextMatch.score1 = undefined
    nextMatch.winner = undefined
  } else if (matchIndex === 1) {
    nextMatch.participant2 = undefined
    nextMatch.score2 = undefined
    nextMatch.winner = undefined
  }

  // Recursively clear downstream matches
  if (nextMatch.nextMatchId) {
    return clearDownstreamMatches(updatedMatches, nextMatch.id, bracketType)
  }

  return updatedMatches
}
