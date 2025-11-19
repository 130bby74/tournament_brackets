import { Request, Response } from 'express'
import * as db from '../db.js'

export const createBracket = async (req: Request, res: Response) => {
  try {
    const { name, type, participants, matches, groupSize, qualifiersPerGroup, knockoutMatches } = req.body

    if (!name || !type || !participants) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const bracket = db.createBracket({
      name,
      type,
      participants,
      matches: matches || [],
      groupSize,
      qualifiersPerGroup,
      knockoutMatches,
    })

    res.status(201).json(bracket)
  } catch (error) {
    console.error('Error creating bracket:', error)
    res.status(500).json({ error: 'Failed to create bracket' })
  }
}

export const getAllBrackets = async (req: Request, res: Response) => {
  try {
    const brackets = db.getAllBrackets()
    res.json(brackets)
  } catch (error) {
    console.error('Error fetching brackets:', error)
    res.status(500).json({ error: 'Failed to fetch brackets' })
  }
}

export const getBracket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const bracket = db.getBracketById(id)

    if (!bracket) {
      return res.status(404).json({ error: 'Bracket not found' })
    }

    res.json(bracket)
  } catch (error) {
    console.error('Error fetching bracket:', error)
    res.status(500).json({ error: 'Failed to fetch bracket' })
  }
}

export const updateBracket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const bracket = db.updateBracket(id, updates)

    if (!bracket) {
      return res.status(404).json({ error: 'Bracket not found' })
    }

    res.json(bracket)
  } catch (error) {
    console.error('Error updating bracket:', error)
    res.status(500).json({ error: 'Failed to update bracket' })
  }
}

export const deleteBracket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = db.deleteBracket(id)

    if (!success) {
      return res.status(404).json({ error: 'Bracket not found' })
    }

    res.json({ message: 'Bracket deleted successfully' })
  } catch (error) {
    console.error('Error deleting bracket:', error)
    res.status(500).json({ error: 'Failed to delete bracket' })
  }
}
