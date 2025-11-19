import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bracket, Match } from '../types'
import { getBracket, updateBracket } from '../services/api'
import { generateBracket } from '../utils/bracketGenerator'
import SingleEliminationBracket from '../components/SingleEliminationBracket'
import DoubleEliminationBracket from '../components/DoubleEliminationBracket'
import RoundRobinBracket from '../components/RoundRobinBracket'
import GroupStageBracket from '../components/GroupStageBracket'

function BracketPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    const updatedMatches = bracket.matches.map(match => {
      if (match.id === matchId) {
        const winner = bracket.participants.find(p => p.id === winnerId)
        return { ...match, score1, score2, winner }
      }
      return match
    })

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
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
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
    </div>
  )
}

export default BracketPage
