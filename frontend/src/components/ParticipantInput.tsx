import { useState } from 'react'
import { BracketType, Participant } from '../types'

interface ParticipantInputProps {
  participants: Participant[]
  onParticipantsChange: (participants: Participant[]) => void
  bracketType: BracketType
}

function ParticipantInput({ participants, onParticipantsChange, bracketType }: ParticipantInputProps) {
  const [newParticipantName, setNewParticipantName] = useState('')

  const addParticipant = () => {
    if (newParticipantName.trim()) {
      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random()}`,
        name: newParticipantName.trim(),
        seed: participants.length + 1,
      }
      onParticipantsChange([...participants, newParticipant])
      setNewParticipantName('')
    }
  }

  const removeParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id)
    // Re-seed participants
    const reseeded = updated.map((p, index) => ({ ...p, seed: index + 1 }))
    onParticipantsChange(reseeded)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addParticipant()
    }
  }

  const getRecommendedParticipantCount = () => {
    switch (bracketType) {
      case 'single-elimination':
      case 'double-elimination':
        return 'Power of 2 (4, 8, 16, 32, etc.) recommended'
      case 'round-robin':
        return '2-16 participants recommended'
      case 'group-stage':
        return 'Multiple of 4 (8, 12, 16, etc.) recommended'
      default:
        return ''
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Participants ({participants.length})
          </label>
          <span className="text-xs text-gray-500">
            {getRecommendedParticipantCount()}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter participant name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={addParticipant}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-1">Seed</div>
              <div className="col-span-9">Name</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="col-span-1 text-gray-600 font-medium">
                  #{participant.seed}
                </div>
                <div className="col-span-9 text-gray-800">
                  {participant.name}
                </div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
          No participants added yet. Add at least 2 participants to continue.
        </div>
      )}
    </div>
  )
}

export default ParticipantInput
