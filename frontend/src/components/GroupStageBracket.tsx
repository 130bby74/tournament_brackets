import { useState, useEffect } from 'react'
import { Match, Participant, GroupStanding } from '../types'
import SingleEliminationBracket from './SingleEliminationBracket'
import { generateKnockoutMatches } from '../utils/bracketGenerator'
import { autoAdvanceWinners } from '../utils/autoAdvance'

interface GroupStageBracketProps {
  matches: Match[]
  participants: Participant[]
  knockoutMatches?: Match[]
  groupSize?: number
  qualifiersPerGroup?: number
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function GroupStageBracket({
  matches,
  participants,
  knockoutMatches: initialKnockoutMatches,
  groupSize = 4,
  qualifiersPerGroup = 2,
  onUpdateMatch
}: GroupStageBracketProps) {
  const [groups, setGroups] = useState<Map<number, { participants: Participant[], matches: Match[], standings: GroupStanding[] }>>(new Map())
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>(initialKnockoutMatches || [])
  const [qualifiedParticipants, setQualifiedParticipants] = useState<Participant[]>([])

  useEffect(() => {
    organizeGroups()
  }, [matches, participants])

  useEffect(() => {
    // Check if all group matches are complete
    const allGroupMatchesComplete = matches.every(m =>
      m.score1 !== undefined && m.score2 !== undefined
    )

    if (allGroupMatchesComplete && groups.size > 0) {
      updateQualifiedParticipants()
    }
  }, [groups, matches])

  const organizeGroups = () => {
    const groupMap = new Map<number, { participants: Participant[], matches: Match[], standings: GroupStanding[] }>()

    // Organize matches by group (using round as group identifier)
    // Filter out knockout matches
    const groupStageMatches = matches.filter(m => !m.id.startsWith('knockout-'))

    groupStageMatches.forEach(match => {
      const groupId = match.round
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, { participants: [], matches: [], standings: [] })
      }
      groupMap.get(groupId)!.matches.push(match)
    })

    // Extract unique participants per group
    groupMap.forEach((group, groupId) => {
      const participantSet = new Set<string>()
      group.matches.forEach(match => {
        if (match.participant1) participantSet.add(match.participant1.id)
        if (match.participant2) participantSet.add(match.participant2.id)
      })

      group.participants = Array.from(participantSet)
        .map(id => participants.find(p => p.id === id))
        .filter(p => p !== undefined) as Participant[]

      // Calculate standings
      group.standings = calculateGroupStandings(group.matches, group.participants)
    })

    setGroups(groupMap)
  }

  const updateQualifiedParticipants = () => {
    const qualified: Participant[] = []

    // Get top N from each group
    groups.forEach(group => {
      const topN = group.standings.slice(0, qualifiersPerGroup)
      qualified.push(...topN.map(s => s.participant))
    })

    setQualifiedParticipants(qualified)

    // Generate knockout matches if not already present
    if (qualified.length >= 2 && knockoutMatches.length === 0) {
      const newKnockoutMatches = generateKnockoutMatches(qualified)
      setKnockoutMatches(newKnockoutMatches)
    }
  }

  // Helper function to get head-to-head result between two participants
  const getHeadToHeadResult = (p1Id: string, p2Id: string, matches: Match[]): number => {
    const h2hMatch = matches.find(m =>
      (m.participant1?.id === p1Id && m.participant2?.id === p2Id) ||
      (m.participant1?.id === p2Id && m.participant2?.id === p1Id)
    )

    if (!h2hMatch || h2hMatch.score1 === undefined || h2hMatch.score2 === undefined) {
      return 0
    }

    if (h2hMatch.participant1?.id === p1Id) {
      if (h2hMatch.score1 > h2hMatch.score2) return 1 // p1 won
      if (h2hMatch.score1 < h2hMatch.score2) return -1 // p2 won
    } else {
      if (h2hMatch.score2 > h2hMatch.score1) return 1 // p1 won
      if (h2hMatch.score2 < h2hMatch.score1) return -1 // p2 won
    }

    return 0 // draw
  }

  const calculateGroupStandings = (matches: Match[], participants: Participant[]): GroupStanding[] => {
    const standingsMap = new Map<string, GroupStanding>()

    participants.forEach(p => {
      standingsMap.set(p.id, {
        participant: p,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        setWins: 0,
        setLosses: 0,
      })
    })

    matches.forEach(match => {
      if (match.participant1 && match.participant2 && match.score1 !== undefined && match.score2 !== undefined) {
        const standing1 = standingsMap.get(match.participant1.id)!
        const standing2 = standingsMap.get(match.participant2.id)!

        // Track set wins/losses
        standing1.setWins += match.score1
        standing1.setLosses += match.score2
        standing2.setWins += match.score2
        standing2.setLosses += match.score1

        if (match.score1 > match.score2) {
          standing1.wins++
          standing1.points += 3
          standing2.losses++
        } else if (match.score2 > match.score1) {
          standing2.wins++
          standing2.points += 3
          standing1.losses++
        } else {
          standing1.draws++
          standing2.draws++
          standing1.points += 1
          standing2.points += 1
        }
      }
    })

    // Sort standings with proper tie-breaking
    let sortedStandings = Array.from(standingsMap.values()).sort((a, b) => {
      // Primary: Number of wins
      if (b.wins !== a.wins) return b.wins - a.wins

      // Secondary: Set wins (total score)
      if (b.setWins !== a.setWins) return b.setWins - a.setWins

      // Tertiary: Head-to-head result
      const h2h = getHeadToHeadResult(a.participant.id, b.participant.id, matches)
      if (h2h !== 0) return h2h

      // If still tied, they'll have equal rank
      return 0
    })

    // Assign ranks (allowing for ties)
    let currentRank = 1
    for (let i = 0; i < sortedStandings.length; i++) {
      if (i > 0) {
        const prev = sortedStandings[i - 1]
        const curr = sortedStandings[i]

        // Check if tied with previous player (all three criteria must match)
        if (curr.wins === prev.wins && curr.setWins === prev.setWins) {
          const h2h = getHeadToHeadResult(curr.participant.id, prev.participant.id, matches)
          if (h2h === 0) {
            // Equal rank
            curr.rank = prev.rank
          } else {
            currentRank = i + 1
            curr.rank = currentRank
          }
        } else {
          currentRank = i + 1
          curr.rank = currentRank
        }
      } else {
        sortedStandings[i].rank = currentRank
      }
    }

    return sortedStandings
  }

  const handleKnockoutMatchUpdate = (matchId: string, score1: number, score2: number, winnerId: string) => {
    if (!onUpdateMatch) return

    // Update the knockout match with scores and winner
    let updatedKnockoutMatches = knockoutMatches.map(match => {
      if (match.id === matchId) {
        const winner = qualifiedParticipants.find(p => p.id === winnerId)
        return { ...match, score1, score2, winner }
      }
      return match
    })

    // Determine loser
    const currentMatch = updatedKnockoutMatches.find(m => m.id === matchId)
    let loserId = ''
    if (currentMatch && currentMatch.participant1 && currentMatch.participant2) {
      loserId = winnerId === currentMatch.participant1.id
        ? currentMatch.participant2.id
        : currentMatch.participant1.id
    }

    // Auto-advance winners in knockout phase (treated as single elimination)
    updatedKnockoutMatches = autoAdvanceWinners(
      updatedKnockoutMatches,
      matchId,
      winnerId,
      loserId,
      qualifiedParticipants,
      'single-elimination'
    )

    setKnockoutMatches(updatedKnockoutMatches)
    onUpdateMatch(matchId, score1, score2, winnerId)
  }

  const allGroupMatchesComplete = matches.every(m =>
    m.score1 !== undefined && m.score2 !== undefined
  )

  return (
    <div className="space-y-8">
      {/* Group Stage Section */}
      <div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-2xl font-bold text-white">Group Stage</h2>
          <p className="text-purple-100 text-sm mt-1">
            Top {qualifiersPerGroup} from each group advance to knockout stage
          </p>
        </div>

        <div className="space-y-8 mt-4">
          {Array.from(groups.entries()).map(([groupId, group]) => (
            <div key={groupId} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-purple-100 px-6 py-3 border-b-2 border-purple-200">
                <h3 className="text-xl font-bold text-purple-900">
                  Group {String.fromCharCode(65 + groupId - 1)}
                </h3>
              </div>

              <div className="p-6">
                {/* Standings */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Standings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                            Pos
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                            Participant
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            W
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            D
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            L
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            Sets
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            Pts
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.standings.map((standing, index) => {
                          const rank = standing.rank || (index + 1)
                          const isQualified = rank <= qualifiersPerGroup
                          return (
                            <tr key={standing.participant.id} className={isQualified ? 'bg-green-50' : ''}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {rank}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {standing.participant.name}
                              </td>
                              <td className="px-4 py-2 text-center text-sm text-green-600 font-semibold">
                                {standing.wins}
                              </td>
                              <td className="px-4 py-2 text-center text-sm text-gray-600">
                                {standing.draws}
                              </td>
                              <td className="px-4 py-2 text-center text-sm text-red-600 font-semibold">
                                {standing.losses}
                              </td>
                              <td className="px-4 py-2 text-center text-sm font-bold text-blue-600">
                                {standing.setWins}
                              </td>
                              <td className="px-4 py-2 text-center text-sm font-bold text-purple-600">
                                {standing.points}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {allGroupMatchesComplete && isQualified && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                    ✓ Qualified
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Matches */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Matches</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.matches.map(match => (
                      <MatchCard key={match.id} match={match} onUpdateMatch={onUpdateMatch} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knockout Stage Section */}
      {allGroupMatchesComplete && qualifiedParticipants.length >= 2 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Knockout Stage</h2>
            <p className="text-orange-100 text-sm mt-1">
              {qualifiedParticipants.length} qualified participants - Single elimination
            </p>
          </div>
          <div className="p-6">
            {knockoutMatches.length > 0 ? (
              <SingleEliminationBracket
                matches={knockoutMatches}
                onUpdateMatch={handleKnockoutMatchUpdate}
              />
            ) : (
              <div className="text-center py-8 text-gray-600">
                Generating knockout bracket...
              </div>
            )}
          </div>
        </div>
      )}

      {!allGroupMatchesComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⏳</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                Group Stage In Progress
              </h3>
              <p className="text-yellow-800">
                Complete all group stage matches to unlock the knockout phase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MatchCardProps {
  match: Match
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function MatchCard({ match, onUpdateMatch }: MatchCardProps) {
  const handleScoreUpdate = (participant: 1 | 2, score: number) => {
    if (!onUpdateMatch || !match.participant1 || !match.participant2) return

    const score1 = participant === 1 ? score : (match.score1 || 0)
    const score2 = participant === 2 ? score : (match.score2 || 0)
    const winnerId = score1 > score2 ? match.participant1.id :
                     score2 > score1 ? match.participant2.id : ''

    onUpdateMatch(match.id, score1, score2, winnerId)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 flex-1">
            {match.participant1?.name || 'TBD'}
          </span>
          <input
            type="number"
            min="0"
            value={match.score1 ?? ''}
            onChange={(e) => handleScoreUpdate(1, parseInt(e.target.value) || 0)}
            placeholder="-"
            className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 flex-1">
            {match.participant2?.name || 'TBD'}
          </span>
          <input
            type="number"
            min="0"
            value={match.score2 ?? ''}
            onChange={(e) => handleScoreUpdate(2, parseInt(e.target.value) || 0)}
            placeholder="-"
            className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1"
          />
        </div>
      </div>
    </div>
  )
}

export default GroupStageBracket
