import { useState, useEffect } from 'react'
import BracketTypeSelector from '../components/BracketTypeSelector'
import ParticipantInput from '../components/ParticipantInput'
import SavedBracketsList from '../components/SavedBracketsList'
import { BracketType, Participant, Bracket } from '../types'
import { useNavigate } from 'react-router-dom'
import { createBracket, getAllBrackets } from '../services/api'

function HomePage() {
  const [selectedType, setSelectedType] = useState<BracketType | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bracketName, setBracketName] = useState('')
  const [groupSize, setGroupSize] = useState(4)
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [savedBrackets, setSavedBrackets] = useState<Bracket[]>([])
  const [showSavedBrackets, setShowSavedBrackets] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadSavedBrackets()
  }, [])

  const loadSavedBrackets = async () => {
    try {
      const brackets = await getAllBrackets()
      setSavedBrackets(brackets)
    } catch (error) {
      console.error('Error loading saved brackets:', error)
    }
  }

  const handleTypeSelect = (type: BracketType) => {
    setSelectedType(type)
    setShowSavedBrackets(false)
  }

  const handleParticipantsChange = (newParticipants: Participant[]) => {
    setParticipants(newParticipants)
  }

  const handleSaveBracket = async () => {
    if (!selectedType || participants.length < 2 || !bracketName) {
      alert('Please select a bracket type, enter a name, and add at least 2 participants')
      return
    }

    setIsLoading(true)
    try {
      const bracketData: any = {
        name: bracketName,
        type: selectedType,
        participants,
        matches: [],
      }

      // Add group stage specific settings
      if (selectedType === 'group-stage') {
        bracketData.groupSize = groupSize
        bracketData.qualifiersPerGroup = qualifiersPerGroup
      }

      const bracket = await createBracket(bracketData)

      if (bracket.id) {
        navigate(`/bracket/${bracket.id}`)
      }
    } catch (error) {
      console.error('Error creating bracket:', error)
      alert('Failed to create bracket. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedType(null)
    setParticipants([])
    setBracketName('')
    setGroupSize(4)
    setQualifiersPerGroup(2)
    setShowSavedBrackets(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Tournament Brackets
          </h1>
          <p className="text-xl text-gray-600">
            Create and manage professional tournament brackets
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Saved Brackets List */}
          {showSavedBrackets && savedBrackets.length > 0 && (
            <div className="mb-6">
              <SavedBracketsList brackets={savedBrackets} onRefresh={loadSavedBrackets} />
            </div>
          )}

          {/* Step 1: Bracket Type Selection */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {showSavedBrackets ? 'Create New Bracket' : 'Step 1: Select Bracket Type'}
            </h2>
            <BracketTypeSelector
              selectedType={selectedType}
              onSelectType={handleTypeSelect}
            />
          </div>

          {/* Step 2: Bracket Name and Participants */}
          {selectedType && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fade-in">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Step 2: Configure Bracket
              </h2>

              {/* Bracket Name */}
              <div className="mb-6">
                <label htmlFor="bracketName" className="block text-sm font-medium text-gray-700 mb-2">
                  Bracket Name
                </label>
                <input
                  id="bracketName"
                  type="text"
                  value={bracketName}
                  onChange={(e) => setBracketName(e.target.value)}
                  placeholder="Enter tournament name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Group Stage Settings */}
              {selectedType === 'group-stage' && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Stage Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-2">
                        Players per Group
                      </label>
                      <select
                        id="groupSize"
                        value={groupSize}
                        onChange={(e) => setGroupSize(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map(size => (
                          <option key={size} value={size}>{size} players</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="qualifiers" className="block text-sm font-medium text-gray-700 mb-2">
                        Qualifiers per Group
                      </label>
                      <select
                        id="qualifiers"
                        value={qualifiersPerGroup}
                        onChange={(e) => setQualifiersPerGroup(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4].map(num => (
                          <option key={num} value={num} disabled={num > groupSize - 1}>
                            Top {num} advance{num > groupSize - 1 ? ' (invalid)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    With {participants.length} participants, there will be{' '}
                    <span className="font-semibold">{Math.ceil(participants.length / groupSize)} groups</span>.
                    {' '}{Math.ceil(participants.length / groupSize) * qualifiersPerGroup} players will advance to the knockout stage.
                  </p>
                </div>
              )}

              {/* Participants Input */}
              <ParticipantInput
                participants={participants}
                onParticipantsChange={handleParticipantsChange}
                bracketType={selectedType}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveBracket}
                  disabled={isLoading || participants.length < 2 || !bracketName}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Bracket'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Getting Started
            </h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Choose your bracket type from the options above</li>
              <li>• Enter a name for your tournament</li>
              <li>• Add participants (minimum 2 required)</li>
              <li>• Click "Create Bracket" to generate and save your bracket</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
