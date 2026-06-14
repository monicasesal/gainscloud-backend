const express = require('express')
const router = express.Router()
const workoutController = require('../controllers/workoutController')
const {protect} = require('../middlewares/authMiddleware')

router.post('/start', protect, workoutController.startWorkout)
router.post('/set', protect, workoutController.logSet)
router.post('/finish', protect, workoutController.finishWorkout)

router.get('/history', protect, workoutController.getWorkoutHistory)
router.get ('/stats', protect, workoutController.getWorkoutStats)
router.get('/volume-progression', protect, workoutController.getVolumeProgression)

router.delete('/set/:id', protect, workoutController.deleteSet)
router.delete('/:id', protect, workoutController.deleteWorkoutLog)

module.exports = router