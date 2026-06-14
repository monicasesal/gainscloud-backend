const db = require('../config/db')

//Obtener todos los ejercicios del catálogo para mostrarlos en un desplegable
exports.getAllExercises = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null

        const query = 'SELECT id, name FROM exercises WHERE user_id IS NULL OR user_id = ?'
        const [rows] = await db.query(query, [userId]);

        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// Añadir un nuevo ejercicio personalizado al catálogo del usuario
exports.createExercise = async (req, res) => {
    const {name} = req.body
    const userId = req.user.id

    if (!name) {
        return res.status(400).json({error: 'El nombre y el grupo muscular son obligatorios'})
    }

    try {
        const query = 'INSERT INTO exercises (name, user_id) VALUES (?, ?)'
        await db.query(query, [name, userId])

        res.status(201).json({ message: 'Ejercicio personalizado creado con éxito' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear el ejercicio personalizado' })
    }
}