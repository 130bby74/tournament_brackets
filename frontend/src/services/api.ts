import axios from 'axios'
import { Bracket } from '../types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const createBracket = async (bracket: Bracket): Promise<Bracket> => {
  const response = await api.post('/brackets', bracket)
  return response.data
}

export const getBracket = async (id: string): Promise<Bracket> => {
  const response = await api.get(`/brackets/${id}`)
  return response.data
}

export const updateBracket = async (id: string, bracket: Partial<Bracket>): Promise<Bracket> => {
  const response = await api.put(`/brackets/${id}`, bracket)
  return response.data
}

export const getAllBrackets = async (): Promise<Bracket[]> => {
  const response = await api.get('/brackets')
  return response.data
}

export const deleteBracket = async (id: string): Promise<void> => {
  await api.delete(`/brackets/${id}`)
}
