const express = require('express')
const router = express.Router()
const aiController = require('../controllers/aiController')
const {protect} = require('../middlewares/authMiddleware')
const {checkPremium} = require('../middlewares/premiumMiddleware')

router.get('/coach-feedback', protect, checkPremium, aiController.getCoachFeedback)

module.exports = router