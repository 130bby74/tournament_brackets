import { Match } from '../types'

interface DoubleEliminationBracketProps {
  matches: Match[]
  onUpdateMatch?: (matchId: string, score1: number, score2: number, winnerId: string) => void
}

function DoubleEliminationBracket({ matches, onUpdateMatch }: DoubleEliminationBracketProps) {
  const winnersBracket = matches.filter(m => m.id.startsWith('w-'))
  const losersBracket = matches.filter(m => m.id.startsWith('l-'))
  const grandFinals = matches.find(m => m.id === 'grand-finals')

  const winnersRounds = Math.max(...winnersBracket.map(m => m.round), 0)
  const losersRounds = Math.max(...losersBracket.map(m => m.round), 0)

  const winnersByRound: Record<number, Match[]> = {}
  const losersByRound: Record<number, Match[]> = {}

  winnersBracket.forEach(match => {
    if (!winnersByRound[match.round]) winnersByRound[match.round] = []
    winnersByRound[match.round].push(match)
  })

  losersBracket.forEach(match => {
    if (!losersByRound[match.round]) losersByRound[match.round] = []
    losersByRound[match.round].push(match)
  })

  return (
    <div className="space-y-8">
      {/* Winners Bracket */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Winners Bracket</h2>
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-8">
            {Array.from({ length: winnersRounds }, (_, i) => i + 1).map(round => (
              <div key={round} className="flex flex-col" style={{ minWidth: '280px' }}>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                  Round {round}
                </h3>
                <div className="flex flex-col justify-around gap-4 flex-1">
                  {winnersByRound[round]?.map(match => (
                    <MatchCard key={match.id} match={match} onUpdateMatch={onUpdateMatch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Losers Bracket */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-orange-700 mb-6">Losers Bracket</h2>
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-8">
            {Array.from({ length: losersRounds }, (_, i) => i + 1).map(round => (
              <div key={round} className="flex flex-col" style={{ minWidth: '280px' }}>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                  Round {round}
                </h3>
                <div className="flex flex-col justify-around gap-4 flex-1">
                  {losersByRound[round]?.map(match => (
                    <MatchCard key={match.id} match={match} onUpdateMatch={onUpdateMatch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grand Finals */}
      {grandFinals && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Grand Finals</h2>
          <div className="max-w-md mx-auto">
            <MatchCard match={grandFinals} onUpdateMatch={onUpdateMatch} />
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

export default DoubleEliminationBracket
