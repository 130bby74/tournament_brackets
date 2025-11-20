import { Match, Participant, BracketType } from '../types'

export function checkAndAutoWinBYE(matches: Match[]): Match[] {
  // Automatically award wins for matches against BYE opponents
  const updatedMatches = [...matches]

  updatedMatches.forEach(match => {
    // Skip if match already has a winner
    if (match.winner) return

    // Check if one participant is BYE
    const p1IsBye = match.participant1?.name === 'BYE'
    const p2IsBye = match.participant2?.name === 'BYE'

    // Special case: BYE vs BYE in round 1 of loser bracket is allowed
    // In this case, advance participant1 (first BYE)
    if (p1IsBye && p2IsBye && match.id.startsWith('l-r1-')) {
      match.score1 = 1
      match.score2 = 0
      match.winner = match.participant1
      return
    }

    if (p1IsBye && match.participant2) {
      // Participant 2 wins automatically
      match.score1 = 0
      match.score2 = 1
      match.winner = match.participant2
    } else if (p2IsBye && match.participant1) {
      // Participant 1 wins automatically
      match.score1 = 1
      match.score2 = 0
      match.winner = match.participant1
    }
  })

  return updatedMatches
}

export function autoAdvanceWinners(
  matches: Match[],
  updatedMatchId: string,
  winnerId: string,
  loserId: string,
  participants: Participant[],
  bracketType: BracketType
): Match[] {
  let updatedMatches = [...matches]
  const currentMatch = updatedMatches.find(m => m.id === updatedMatchId)

  if (!currentMatch) return updatedMatches

  // Get winner and loser from participants array OR from the current match
  // This ensures BYEs (which aren't in participants array) are properly handled
  let winner = participants.find(p => p.id === winnerId)
  let loser = participants.find(p => p.id === loserId)

  // If not found in participants (e.g., BYE), get from current match
  if (!winner) {
    winner = currentMatch.participant1?.id === winnerId ? currentMatch.participant1 : currentMatch.participant2
  }
  if (!loser) {
    loser = currentMatch.participant1?.id === loserId ? currentMatch.participant1 : currentMatch.participant2
  }

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

        // Check if the next match now has a BYE opponent and auto-advance if so
        updatedMatches = checkAndAutoWinBYE(updatedMatches)

        // If next match has auto-win, recursively advance
        const updatedNextMatch = updatedMatches.find(m => m.id === nextMatch.id)
        if (updatedNextMatch?.winner && updatedNextMatch.participant1 && updatedNextMatch.participant2) {
          const nextWinnerId = updatedNextMatch.winner.id
          const nextLoserId = updatedNextMatch.winner.id === updatedNextMatch.participant1.id
            ? updatedNextMatch.participant2.id
            : updatedNextMatch.participant1.id

          updatedMatches = autoAdvanceWinners(
            updatedMatches,
            updatedNextMatch.id,
            nextWinnerId,
            nextLoserId,
            participants,
            bracketType
          )
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

        // Check if the next match now has a BYE opponent and auto-advance if so
        updatedMatches = checkAndAutoWinBYE(updatedMatches)

        // If next match has auto-win, recursively advance
        const updatedNextMatch = updatedMatches.find(m => m.id === nextMatch.id)
        if (updatedNextMatch?.winner && updatedNextMatch.participant1 && updatedNextMatch.participant2) {
          const nextWinnerId = updatedNextMatch.winner.id
          const nextLoserId = updatedNextMatch.winner.id === updatedNextMatch.participant1.id
            ? updatedNextMatch.participant2.id
            : updatedNextMatch.participant1.id

          updatedMatches = autoAdvanceWinners(
            updatedMatches,
            updatedNextMatch.id,
            nextWinnerId,
            nextLoserId,
            participants,
            bracketType
          )
        }
      }
    }

    // Send loser to losers bracket
    if (currentMatch.id.startsWith('w-') && currentMatch.loserNextMatchId && loser) {
      const loserNextMatch = updatedMatches.find(m => m.id === currentMatch.loserNextMatchId)
      if (loserNextMatch) {
        // Determine which slot the loser should go into
        // Check if this match also receives winners from previous losers round
        const winnersFromLosersFeedingToMatch = updatedMatches.filter(m =>
          m.id.startsWith('l-') && m.nextMatchId === loserNextMatch.id
        )

        // If losers bracket winners feed here, they take participant1, losers from winners take participant2
        // Otherwise, use index-based placement
        if (winnersFromLosersFeedingToMatch.length > 0) {
          // This match receives both winners from losers + losers from winners
          // Winners from losers go to participant1, losers from winners go to participant2
          if (!loserNextMatch.participant2) {
            loserNextMatch.participant2 = loser
          } else if (!loserNextMatch.participant1) {
            loserNextMatch.participant1 = loser
          }
        } else {
          // Regular loser bracket placement (first round)
          const matchesFeedingToLoserMatch = updatedMatches.filter(m => m.loserNextMatchId === loserNextMatch.id)
          const currentMatchIndexInFeeders = matchesFeedingToLoserMatch.findIndex(m => m.id === currentMatch.id)

          if (currentMatchIndexInFeeders === 0 || !loserNextMatch.participant1) {
            loserNextMatch.participant1 = loser
          } else {
            loserNextMatch.participant2 = loser
          }
        }

        // Check if the loser match now has a BYE opponent and auto-advance if so
        updatedMatches = checkAndAutoWinBYE(updatedMatches)

        // If loser match has auto-win, recursively advance
        const updatedLoserMatch = updatedMatches.find(m => m.id === loserNextMatch.id)
        if (updatedLoserMatch?.winner && updatedLoserMatch.participant1 && updatedLoserMatch.participant2) {
          const nextWinnerId = updatedLoserMatch.winner.id
          const nextLoserId = updatedLoserMatch.winner.id === updatedLoserMatch.participant1.id
            ? updatedLoserMatch.participant2.id
            : updatedLoserMatch.participant1.id

          updatedMatches = autoAdvanceWinners(
            updatedMatches,
            updatedLoserMatch.id,
            nextWinnerId,
            nextLoserId,
            participants,
            bracketType
          )
        }
      }
    }

    // Advance winner in losers bracket
    if (currentMatch.id.startsWith('l-') && currentMatch.nextMatchId && winner) {
      const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)
      if (nextMatch) {
        // Check if this next match receives losers from winners bracket
        const hasLoserFeeds = updatedMatches.some(m => m.loserNextMatchId === nextMatch.id)

        if (hasLoserFeeds) {
          // This match receives both a loser from winners bracket and winner from losers bracket
          // The winner from losers bracket should go to participant1 or the first empty slot
          if (!nextMatch.participant1) {
            nextMatch.participant1 = winner
          } else if (!nextMatch.participant2) {
            nextMatch.participant2 = winner
          }
        } else {
          // Regular losers bracket advancement
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

        // Check if the next match now has a BYE opponent and auto-advance if so
        updatedMatches = checkAndAutoWinBYE(updatedMatches)

        // If next match has auto-win, recursively advance
        const updatedNextMatch = updatedMatches.find(m => m.id === nextMatch.id)
        if (updatedNextMatch?.winner && updatedNextMatch.participant1 && updatedNextMatch.participant2) {
          const nextWinnerId = updatedNextMatch.winner.id
          const nextLoserId = updatedNextMatch.winner.id === updatedNextMatch.participant1.id
            ? updatedNextMatch.participant2.id
            : updatedNextMatch.participant1.id

          updatedMatches = autoAdvanceWinners(
            updatedMatches,
            updatedNextMatch.id,
            nextWinnerId,
            nextLoserId,
            participants,
            bracketType
          )
        }
      }
    }

    // Advance to grand finals
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
