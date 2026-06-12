const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const {protect} = require('../middlewares/authMiddleware')

router.post('/register', authController.register)
router.post('/login', authController.login)

router.put('/update-weight', protect, authController.updateWeight)

router.get('/profile', protect, authController.getProfileData)

module.exports = router