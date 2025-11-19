import { useState } from 'react'
import { Bracket } from '../types'
import { useNavigate } from 'react-router-dom'
import { deleteBracket } from '../services/api'

interface SavedBracketsListProps {
  brackets: Bracket[]
  onRefresh: () => void
}

function SavedBracketsList({ brackets, onRefresh }: SavedBracketsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const navigate = useNavigate()

  const filteredBrackets = brackets.filter(bracket => {
    const matchesSearch = bracket.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || bracket.type === filterType
    return matchesSearch && matchesType
  })

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteBracket(id)
        onRefresh()
      } catch (error) {
        console.error('Error deleting bracket:', error)
        alert('Failed to delete bracket')
      }
    }
  }

  const getBracketTypeDisplay = (type: string) => {
    switch (type) {
      case 'single-elimination': return 'Single Elimination'
      case 'double-elimination': return 'Double Elimination'
      case 'round-robin': return 'Round Robin'
      case 'group-stage': return 'Group Stage'
      default: return type
    }
  }

  const getBracketTypeColor = (type: string) => {
    switch (type) {
      case 'single-elimination': return 'bg-green-100 text-green-800'
      case 'double-elimination': return 'bg-orange-100 text-orange-800'
      case 'round-robin': return 'bg-blue-100 text-blue-800'
      case 'group-stage': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Saved Brackets</h2>
        <p className="text-primary-100 text-sm mt-1">
          {filteredBrackets.length} bracket{filteredBrackets.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search brackets by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="single-elimination">Single Elimination</option>
              <option value="double-elimination">Double Elimination</option>
              <option value="round-robin">Round Robin</option>
              <option value="group-stage">Group Stage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brackets List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredBrackets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterType !== 'all' ? (
              <p>No brackets found matching your filters.</p>
            ) : (
              <p>No saved brackets yet. Create your first bracket above!</p>
            )}
          </div>
        ) : (
          filteredBrackets.map(bracket => (
            <div
              key={bracket.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/bracket/${bracket.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {bracket.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBracketTypeColor(bracket.type)}`}>
                      {getBracketTypeDisplay(bracket.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👥 {bracket.participants.length} participants</span>
                    <span>📅 {formatDate(bracket.createdAt)}</span>
                    {bracket.type === 'group-stage' && bracket.groupSize && (
                      <span>🏆 Groups of {bracket.groupSize}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(bracket.id!, bracket.name)
                  }}
                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SavedBracketsList
