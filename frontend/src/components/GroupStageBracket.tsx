import { useState, useEffect } from 'react'
import { Match, Participant, GroupStanding } from '../types'

interface GroupStageBracketProps {
  matches: Match[]
  participants: Participant[]
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function GroupStageBracket({ matches, participants, onUpdateMatch }: GroupStageBracketProps) {
  const [groups, setGroups] = useState<Map<number, { participants: Participant[], matches: Match[], standings: GroupStanding[] }>>(new Map())

  useEffect(() => {
    organizeGroups()
  }, [matches, participants])

  const organizeGroups = () => {
    const groupMap = new Map<number, { participants: Participant[], matches: Match[], standings: GroupStanding[] }>()

    // Organize matches by group (using round as group identifier)
    matches.forEach(match => {
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

  const calculateGroupStandings = (matches: Match[], participants: Participant[]): GroupStanding[] => {
    const standingsMap = new Map<string, GroupStanding>()

    participants.forEach(p => {
      standingsMap.set(p.id, {
        participant: p,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
      })
    })

    matches.forEach(match => {
      if (match.participant1 && match.participant2 && match.score1 !== undefined && match.score2 !== undefined) {
        const standing1 = standingsMap.get(match.participant1.id)!
        const standing2 = standingsMap.get(match.participant2.id)!

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

    return Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.participant.name.localeCompare(b.participant.name)
    })
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([groupId, group]) => (
        <div key={groupId} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              Group {String.fromCharCode(65 + groupId - 1)}
            </h2>
          </div>

          <div className="p-6">
            {/* Standings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Standings</h3>
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
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.standings.map((standing, index) => (
                      <tr key={standing.participant.id} className={index < 2 ? 'bg-green-50' : ''}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {index + 1}
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
                        <td className="px-4 py-2 text-center text-sm font-bold text-primary-600">
                          {standing.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matches */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Matches</h3>
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
