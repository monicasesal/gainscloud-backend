const express = require('express')
const router = express.Router()
const exerciseController = require('../controllers/exerciseController')
const {protect} = require('../middlewares/authMiddleware')

//Proteger la ruta: hay que estar logueado para ver los ejercicios
router.get('/', protect, exerciseController.getAllExercises)
router.post('/', protect, exerciseController.createExercise)

module.exports = router