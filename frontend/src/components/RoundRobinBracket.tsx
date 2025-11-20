import { useState, useEffect } from 'react'
import { Match, Participant, RoundRobinStanding } from '../types'

interface RoundRobinBracketProps {
  matches: Match[]
  participants: Participant[]
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function RoundRobinBracket({ matches, participants, onUpdateMatch }: RoundRobinBracketProps) {
  const [standings, setStandings] = useState<RoundRobinStanding[]>([])

  useEffect(() => {
    calculateStandings()
  }, [matches, participants])

  // Helper function to get head-to-head result between two participants
  // Returns: positive if p1 won, negative if p2 won, 0 if draw or no match
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

  const calculateStandings = () => {
    const standingsMap = new Map<string, RoundRobinStanding>()

    // Initialize standings
    participants.forEach(p => {
      standingsMap.set(p.id, {
        participant: p,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        matchesPlayed: 0,
        setWins: 0,
        setLosses: 0,
      })
    })

    // Calculate from matches
    matches.forEach(match => {
      if (match.participant1 && match.participant2 && match.score1 !== undefined && match.score2 !== undefined) {
        const standing1 = standingsMap.get(match.participant1.id)!
        const standing2 = standingsMap.get(match.participant2.id)!

        standing1.matchesPlayed++
        standing2.matchesPlayed++

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
      // Primary: Set wins (total score)
      if (b.setWins !== a.setWins) return b.setWins - a.setWins

      // Secondary: Head-to-head result
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

        // Check if tied with previous player
        if (curr.setWins === prev.setWins) {
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

    setStandings(sortedStandings)
  }

  return (
    <div className="space-y-8">
      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Played
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Wins
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Draws
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Losses
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Set Wins
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((standing, index) => {
                const rank = standing.rank || (index + 1)
                return (
                  <tr key={standing.participant.id} className={rank <= 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${rank === 1 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {rank === 1 && '🥇 '}
                        {rank === 2 && '🥈 '}
                        {rank === 3 && '🥉 '}
                        {rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {standing.participant.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {standing.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">
                      {standing.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {standing.draws}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">
                      {standing.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-blue-600">
                        {standing.setWins}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-primary-600">
                        {standing.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">All Matches</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} onUpdateMatch={onUpdateMatch} />
          ))}
        </div>
      </div>
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
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600">
          Match {match.matchNumber}
        </span>
      </div>
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

export default RoundRobinBracket
