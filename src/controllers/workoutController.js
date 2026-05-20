const db = require('../config/db')

//1. INICIAR UN ENTRENAMIENTO
exports.startWorkout = async (req, res) => {
    const {routine_id} = req.body //puede ser null si entrena sin rutina predefinida
    const userId = req.user.id

    try {
        const [result] = await db.query(
            'INSERT INTO workout_logs (user_id, routine_id, status) VALUES (?, ?, "in progress")',
            [userId, routine_id || null]
        )

        res.status(201).json({
            mensaje: 'Entrenamiento inciado',
            workoutLogId: result.insertId
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error al iniciar el entrenamiento'})
    }
}

//2. REGISTRAR O ACTUALIZAR UNA SERIE (cada vez que pulsa el check)
exports.logSet = async (req, res) => {
    const {workout_log_id, exercise_id, weight, reps, is_completed, set_log_id} = req.body

    if (!workout_log_id || !exercise_id) {
        return res.status(400).json({error: 'Faltan datos obligatorios (workout_log_id o exercise_id)'})
    }

    try {
        //Si el frontend nos manda un set_log_id, significa que el usuario está editando una serie que ya existía
        if (set_log_id) {
            await db.query(
                'UPDATE set_logs SET weight = ?, reps = ?, is_completed = ? WHERE id = ?',
                [weight, reps, is_completed, set_log_id]
            )
            return res.json({message: 'Serie actualizada con éxito', setLogId: set_log_id})
        }
        //Si no nos manda set_log_id, es una serie nueva que acaba de terminar
        const [result] = await db.query(
            'INSERT INTO set_logs (workout_log_id, exercise_id, weight, reps, is_completed) VALUES (?, ?, ?, ?, ?)',
            [workout_log_id, exercise_id, weight || 0, reps || 0, is_completed || false]
        )
        res.status(201).json({mensaje: 'Serie registrada', setLogId: result.insertId})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: 'Error al guardar la serie'})
    }
}

//3. FINALIZAR ENTRENAMIENTO
exports.finishWorkout = async (req, res) => {
    const {workout_log_id} = req.body

    if (!workout_log_id) {
        return res.status(400).json({error: 'ID de entrenamiento requerido'})
    }

    try {
        //Marcar el estado como completado y poner la fecha/hora actual en end_time
        await db.query(
            'UPDATE workout_logs SET status = "completed", end_time = CURRENT_TIMESTAMP WHERE id = ?',
             [workout_log_id]
        )
        res.json({mensaje: 'Entrenamiento finalizado con éxito'})
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error al finalizar el entrenamiento'})
    }
}