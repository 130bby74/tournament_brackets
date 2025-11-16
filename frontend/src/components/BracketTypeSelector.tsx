import { BracketType } from '../types'

interface BracketTypeSelectorProps {
  selectedType: BracketType | null
  onSelectType: (type: BracketType) => void
}

interface BracketOption {
  type: BracketType
  name: string
  description: string
  icon: string
}

const bracketOptions: BracketOption[] = [
  {
    type: 'single-elimination',
    name: 'Single Elimination',
    description: 'Classic tournament format. Lose once and you\'re out.',
    icon: '🏆',
  },
  {
    type: 'double-elimination',
    name: 'Double Elimination',
    description: 'Participants get a second chance in the losers bracket.',
    icon: '⚔️',
  },
  {
    type: 'round-robin',
    name: 'Round Robin',
    description: 'Everyone plays everyone. Leaderboard determines winner.',
    icon: '🔄',
  },
  {
    type: 'group-stage',
    name: 'Group Stage',
    description: 'Split into groups, top performers advance.',
    icon: '👥',
  },
]

function BracketTypeSelector({ selectedType, onSelectType }: BracketTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bracketOptions.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelectType(option.type)}
          className={`
            p-6 rounded-lg border-2 text-left transition-all duration-200
            ${
              selectedType === option.type
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">{option.icon}</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {option.name}
              </h3>
              <p className="text-sm text-gray-600">
                {option.description}
              </p>
            </div>
            {selectedType === option.type && (
              <span className="text-primary-600 text-xl">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export default BracketTypeSelector
