const db = require('../config/db')

//Obtener todos los ejercicios del catálogo para mostrarlos en un desplegable
exports.getAllExercises = async (req, res) => {
    try {
        const [exercises] = await db.query('SELECT * FROM exercises ORDER BY muscle_group, name')
        res.json(exercises)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: 'Error al obtener el catálogo de ejercicios'})
    }
}