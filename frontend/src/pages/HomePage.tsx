import { useState } from 'react'
import BracketTypeSelector from '../components/BracketTypeSelector'
import ParticipantInput from '../components/ParticipantInput'
import { BracketType, Participant } from '../types'
import { useNavigate } from 'react-router-dom'
import { createBracket } from '../services/api'

function HomePage() {
  const [selectedType, setSelectedType] = useState<BracketType | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bracketName, setBracketName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleTypeSelect = (type: BracketType) => {
    setSelectedType(type)
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
      const bracket = await createBracket({
        name: bracketName,
        type: selectedType,
        participants,
        matches: [],
      })

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
          {/* Step 1: Bracket Type Selection */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Step 1: Select Bracket Type
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
