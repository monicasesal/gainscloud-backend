const express = require('express')
const router = express.Router()
const routineController = require('../controllers/routineController')
const {protect} = require('../middlewares/authMiddleware')

router.post('/', protect, routineController.createRoutine)
router.post('/', protect, routineController.getUserRoutines)

module.exports = router