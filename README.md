# Tournament Brackets Application

A full-stack bracket simulation application similar to BracketHQ.

## Features

- **Multiple Bracket Types:**
  - Single Elimination
  - Double Elimination
  - Round Robin (with leaderboard)
  - Group Stage

- **Dynamic Participant Management:** Add participants and brackets scale automatically
- **Real-time Score Updates:** Update match scores and see results instantly
- **Persistent Storage:** Save and load brackets (JSON file-based storage)
- **Beautiful UI:** Clean, modern interface with Tailwind CSS

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** JSON file-based storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

Or install manually:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Development

Run both frontend and backend together:
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Frontend (http://localhost:5173)
npm run dev:frontend

# Terminal 2 - Backend (http://localhost:3000)
npm run dev:backend
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:3000/api

## Usage

1. **Select Bracket Type:** Choose from Single Elimination, Double Elimination, Round Robin, or Group Stage
2. **Enter Tournament Name:** Give your bracket a name
3. **Add Participants:** Add at least 2 participants (names can be teams or players)
4. **Create Bracket:** Click "Create Bracket" to generate your tournament
5. **Update Scores:** Enter scores for each match as the tournament progresses
6. **Save Changes:** Click "Save Changes" to persist your bracket

## Project Structure

```
tournament-brackets/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions (bracket generation)
│   └── ...
├── backend/              # Express backend API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   └── db.ts         # File-based database
│   └── ...
└── package.json          # Root package.json (monorepo)
```

## API Endpoints

- `POST /api/brackets` - Create a new bracket
- `GET /api/brackets` - Get all brackets
- `GET /api/brackets/:id` - Get a specific bracket
- `PUT /api/brackets/:id` - Update a bracket
- `DELETE /api/brackets/:id` - Delete a bracket

## Bracket Types Explained

### Single Elimination
Classic tournament format where losing once eliminates a participant. The bracket size is automatically adjusted to the nearest power of 2, with "BYE" slots added if needed.

### Double Elimination
Participants get a second chance. There's a winners bracket and a losers bracket. Losing in the winners bracket sends you to the losers bracket. The tournament ends with a grand finals.

### Round Robin
Everyone plays everyone else. Points are awarded: 3 for a win, 1 for a draw, 0 for a loss. Final standings are shown in a leaderboard.

### Group Stage
Participants are divided into groups. Within each group, a round-robin format is used. The top performers from each group can advance to playoffs.

## License

MIT
