import { useState } from 'react'
import { Participant } from '../types'

interface ParticipantEditorProps {
  participants: Participant[]
  onSave: (participants: Participant[]) => void
  onCancel: () => void
}

function ParticipantEditor({ participants, onSave, onCancel }: ParticipantEditorProps) {
  const [editedParticipants, setEditedParticipants] = useState<Participant[]>([...participants])
  const [newParticipantName, setNewParticipantName] = useState('')

  const handleNameChange = (id: string, newName: string) => {
    setEditedParticipants(prev =>
      prev.map(p => (p.id === id ? { ...p, name: newName } : p))
    )
  }

  const handleRemove = (id: string) => {
    setEditedParticipants(prev => {
      const filtered = prev.filter(p => p.id !== id)
      // Re-seed participants
      return filtered.map((p, index) => ({ ...p, seed: index + 1 }))
    })
  }

  const handleAdd = () => {
    if (newParticipantName.trim()) {
      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random()}`,
        name: newParticipantName.trim(),
        seed: editedParticipants.length + 1,
      }
      setEditedParticipants([...editedParticipants, newParticipant])
      setNewParticipantName('')
    }
  }

  const handleSave = () => {
    if (editedParticipants.length < 2) {
      alert('At least 2 participants are required')
      return
    }
    onSave(editedParticipants)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Edit Participants</h2>
          <p className="text-primary-100 text-sm mt-1">
            Modify participant names or add/remove participants
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Add New Participant */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Participant
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Enter participant name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Participants List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Participants ({editedParticipants.length})
            </label>
            {editedParticipants.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                No participants. Add at least 2 participants.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-1">Seed</div>
                    <div className="col-span-9">Name</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {editedParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="col-span-1 flex items-center text-gray-600 font-medium">
                        #{participant.seed}
                      </div>
                      <div className="col-span-9">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => handleNameChange(participant.id, e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          onClick={() => handleRemove(participant.id)}
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
          </div>

          {/* Warning */}
          {editedParticipants.length !== participants.length && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Warning: Participant Count Changed
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Changing the number of participants will regenerate the bracket/groups.
                    All match scores will be reset.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editedParticipants.length < 2}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default ParticipantEditor
