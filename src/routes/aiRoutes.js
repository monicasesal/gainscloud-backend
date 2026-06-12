const express = require('express')
const router = express.Router()
const aiController = require('../controllers/aiController')
const {protect} = require('../middlewares/authMiddleware')

router.get('/coach-feedback', protect, aiController.getCoachFeedback)

module.exports = router