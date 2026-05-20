const db = require('../config/db')

//1. CREAR UNA NUEVA RUTINA (CON SUS EJERCICIOS)
exports.createRoutine = async (req, res) => {
    const {name, description, day_of_week, exercises} = req.body
    const userId = req.user.id

    if (!name || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({error: 'El nombre y al menos un ejercicio son obligatorios'})
    }

    try {
        //Insertar la cabecera de la rutina
        const [routineResult] = await db.query(
            'INSERT INTO routines (user_id, name, description, day_of_week) VALUES (?, ?, ?, ?)',
            [userId, name, description, day_of_week]
        )

        const routineId = routineResult.insertId

        //Insertar los ejercicios asociados en la tabla intermedia
        //Mapeamos el array para preparar una inserción múltiple en SQL
        //Insertamops todas las filas de golpe - bulk insert
        const routineExercisesData = exercises.map((ex, index) => [
            routineId,
            ex.exercise_id,
            ex.series_target || 3,
            ex.reps_target || 10,
            index + 1
        ])

        await db.query(
            'INSERT INTO routine_exercises(routine_id, exercise_id, series_target, reps_target, exercise_order) VALUES ?',
            [routineExercisesData]
        )

        res.status(201).json({mensaje: 'Rutina creada con éxito', routineId})

    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error en el servidor al crear la rutina'})
    }
}

//2. OBTENER TODAS LAS RUTINAS DE UN USUARIO (Para el calendario/dashboard)
exports.getUserRoutines = async (req, res) => {
    const userId = req.user_id

    try {
        //Traer todas las rutinas del usuario logueado
        const [routines] = await db.query('SELECT * FROM routines WHERE user_id = ?', [userId])
        res.json(routines)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error al obtener las rutinas'})
    }
}