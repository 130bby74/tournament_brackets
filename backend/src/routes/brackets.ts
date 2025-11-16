import { Router } from 'express'
import * as bracketController from '../controllers/bracketController.js'

const router = Router()

router.post('/', bracketController.createBracket)
router.get('/', bracketController.getAllBrackets)
router.get('/:id', bracketController.getBracket)
router.put('/:id', bracketController.updateBracket)
router.delete('/:id', bracketController.deleteBracket)

export default router
