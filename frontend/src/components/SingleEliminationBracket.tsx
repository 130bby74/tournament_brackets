import { Match } from '../types'

interface SingleEliminationBracketProps {
  matches: Match[]
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function SingleEliminationBracket({ matches, onUpdateMatch }: SingleEliminationBracketProps) {
  const rounds = Math.max(...matches.map(m => m.round))
  const matchesByRound: Record<number, Match[]> = {}

  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = []
    }
    matchesByRound[match.round].push(match)
  })

  const getRoundName = (round: number) => {
    const remaining = rounds - round + 1
    if (remaining === 1) return 'Finals'
    if (remaining === 2) return 'Semi-Finals'
    if (remaining === 3) return 'Quarter-Finals'
    return `Round ${round}`
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-8 min-w-full px-4">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
          <div key={round} className="flex flex-col" style={{ minWidth: '280px' }}>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
              {getRoundName(round)}
            </h3>
            <div className="flex flex-col justify-around gap-4 flex-1">
              {matchesByRound[round]?.map(match => (
                <MatchCard key={match.id} match={match} onUpdateMatch={onUpdateMatch} />
              ))}
            </div>
          </div>
        ))}
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
    const winnerId = score1 > score2 ? match.participant1.id : match.participant2.id

    onUpdateMatch(match.id, score1, score2, winnerId)
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600">
          Match {match.matchNumber}
        </span>
      </div>

      <div className="divide-y divide-gray-200">
        <ParticipantRow
          participant={match.participant1}
          score={match.score1}
          isWinner={match.winner?.id === match.participant1?.id}
          onScoreChange={(score) => handleScoreUpdate(1, score)}
        />
        <ParticipantRow
          participant={match.participant2}
          score={match.score2}
          isWinner={match.winner?.id === match.participant2?.id}
          onScoreChange={(score) => handleScoreUpdate(2, score)}
        />
      </div>
    </div>
  )
}

interface ParticipantRowProps {
  participant?: { id: string; name: string }
  score?: number
  isWinner: boolean
  onScoreChange?: (score: number) => void
}

function ParticipantRow({ participant, score, isWinner, onScoreChange }: ParticipantRowProps) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 ${isWinner ? 'bg-green-50' : ''}`}>
      <span className={`flex-1 text-sm ${isWinner ? 'font-semibold text-green-900' : 'text-gray-700'}`}>
        {participant?.name || 'TBD'}
      </span>
      <input
        type="number"
        min="0"
        value={score ?? ''}
        onChange={(e) => onScoreChange?.(parseInt(e.target.value) || 0)}
        placeholder="-"
        className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1"
        disabled={!participant || participant.name === 'BYE'}
      />
    </div>
  )
}

export default SingleEliminationBracket
