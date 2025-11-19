import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bracket, Match, Participant } from '../types'
import { getBracket, updateBracket } from '../services/api'
import { generateBracket } from '../utils/bracketGenerator'
import { autoAdvanceWinners } from '../utils/autoAdvance'
import SingleEliminationBracket from '../components/SingleEliminationBracket'
import DoubleEliminationBracket from '../components/DoubleEliminationBracket'
import RoundRobinBracket from '../components/RoundRobinBracket'
import GroupStageBracket from '../components/GroupStageBracket'
import ParticipantEditor from '../components/ParticipantEditor'

function BracketPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showParticipantEditor, setShowParticipantEditor] = useState(false)

  useEffect(() => {
    if (id) {
      loadBracket(id)
    }
  }, [id])

  const loadBracket = async (bracketId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const loadedBracket = await getBracket(bracketId)

      // Generate matches if not already present
      if (!loadedBracket.matches || loadedBracket.matches.length === 0) {
        const groupSize = loadedBracket.groupSize || 4
        loadedBracket.matches = generateBracket(loadedBracket.type, loadedBracket.participants, groupSize)
      }

      setBracket(loadedBracket)
    } catch (err) {
      console.error('Error loading bracket:', err)
      setError('Failed to load bracket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMatch = async (matchId: string, score1: number, score2: number, winnerId: string) => {
    if (!bracket) return

    // First, update the current match with scores and winner
    let updatedMatches = bracket.matches.map(match => {
      if (match.id === matchId) {
        const winner = bracket.participants.find(p => p.id === winnerId)
        return { ...match, score1, score2, winner }
      }
      return match
    })

    // Determine loser
    const currentMatch = updatedMatches.find(m => m.id === matchId)
    let loserId = ''
    if (currentMatch && currentMatch.participant1 && currentMatch.participant2) {
      loserId = winnerId === currentMatch.participant1.id
        ? currentMatch.participant2.id
        : currentMatch.participant1.id
    }

    // Auto-advance winners (and losers for double elimination)
    if (bracket.type === 'single-elimination' || bracket.type === 'double-elimination') {
      updatedMatches = autoAdvanceWinners(
        updatedMatches,
        matchId,
        winnerId,
        loserId,
        bracket.participants,
        bracket.type
      )
    }

    const updatedBracket = { ...bracket, matches: updatedMatches }
    setBracket(updatedBracket)

    // Save to backend
    try {
      await updateBracket(bracket.id!, { matches: updatedMatches })
    } catch (err) {
      console.error('Error updating bracket:', err)
    }
  }

  const handleSave = async () => {
    if (!bracket || !bracket.id) return

    try {
      await updateBracket(bracket.id, bracket)
      alert('Bracket saved successfully!')
    } catch (err) {
      console.error('Error saving bracket:', err)
      alert('Failed to save bracket')
    }
  }

  const handleParticipantsSave = async (newParticipants: Participant[]) => {
    if (!bracket || !bracket.id) return

    // Check if participant count changed
    const participantCountChanged = newParticipants.length !== bracket.participants.length

    if (participantCountChanged) {
      const confirmed = window.confirm(
        'Changing the number of participants will regenerate the bracket and reset all scores. Continue?'
      )
      if (!confirmed) {
        setShowParticipantEditor(false)
        return
      }
    }

    // Regenerate matches if participant count changed
    const groupSize = bracket.groupSize || 4
    const newMatches = participantCountChanged
      ? generateBracket(bracket.type, newParticipants, groupSize)
      : bracket.matches.map(match => ({
          ...match,
          participant1: match.participant1
            ? newParticipants.find(p => p.id === match.participant1?.id) || match.participant1
            : undefined,
          participant2: match.participant2
            ? newParticipants.find(p => p.id === match.participant2?.id) || match.participant2
            : undefined,
          winner: match.winner
            ? newParticipants.find(p => p.id === match.winner?.id) || match.winner
            : undefined,
        }))

    const updatedBracket = {
      ...bracket,
      participants: newParticipants,
      matches: newMatches,
      knockoutMatches: participantCountChanged ? [] : bracket.knockoutMatches,
    }

    setBracket(updatedBracket)
    setShowParticipantEditor(false)

    // Save to backend
    try {
      await updateBracket(bracket.id, updatedBracket)
      alert('Participants updated successfully!')
    } catch (err) {
      console.error('Error updating participants:', err)
      alert('Failed to update participants')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading bracket...</p>
        </div>
      </div>
    )
  }

  if (error || !bracket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Bracket not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const getBracketTypeDisplay = () => {
    switch (bracket.type) {
      case 'single-elimination': return 'Single Elimination'
      case 'double-elimination': return 'Double Elimination'
      case 'round-robin': return 'Round Robin'
      case 'group-stage': return 'Group Stage'
      default: return bracket.type
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{bracket.name}</h1>
                <p className="text-sm text-gray-600">
                  {getBracketTypeDisplay()} • {bracket.participants.length} participants
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowParticipantEditor(true)}
                className="px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Edit Participants
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bracket Content */}
      <main className="container mx-auto px-4 py-8">
        {bracket.type === 'single-elimination' && (
          <SingleEliminationBracket matches={bracket.matches} onUpdateMatch={handleUpdateMatch} />
        )}
        {bracket.type === 'double-elimination' && (
          <DoubleEliminationBracket matches={bracket.matches} onUpdateMatch={handleUpdateMatch} />
        )}
        {bracket.type === 'round-robin' && (
          <RoundRobinBracket
            matches={bracket.matches}
            participants={bracket.participants}
            onUpdateMatch={handleUpdateMatch}
          />
        )}
        {bracket.type === 'group-stage' && (
          <GroupStageBracket
            matches={bracket.matches}
            participants={bracket.participants}
            knockoutMatches={bracket.knockoutMatches}
            groupSize={bracket.groupSize}
            qualifiersPerGroup={bracket.qualifiersPerGroup}
            onUpdateMatch={handleUpdateMatch}
          />
        )}
      </main>

      {/* Participant Editor Modal */}
      {showParticipantEditor && (
        <ParticipantEditor
          participants={bracket.participants}
          onSave={handleParticipantsSave}
          onCancel={() => setShowParticipantEditor(false)}
        />
      )}
    </div>
  )
}

export default BracketPage
