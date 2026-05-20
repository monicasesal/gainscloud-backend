const express = require('express')
const router = express.Router()
const workoutController = require('../controllers/workoutController')
const {protect} = require('../middlewares/authMiddleware')

router.post('/start', protect, workoutController.startWorkout)
router.post('/set', protect, workoutController.logSet)
router.post('/finish', protect, workoutController.finishWorkout)

module.exports = router