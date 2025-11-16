import express from 'express'
import cors from 'cors'
import bracketRoutes from './routes/brackets.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/brackets', bracketRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tournament Brackets API is running' })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})
