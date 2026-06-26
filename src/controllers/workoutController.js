const db = require('../config/db')

//1. INICIAR UN ENTRENAMIENTO
exports.startWorkout = async (req, res) => {
    const {routine_id} = req.body //puede ser null si entrena sin rutina predefinida
    const userId = req.user.id

    try {
        const [result] = await db.query(
            'INSERT INTO workout_logs (user_id, routine_id, status, start_time) VALUES (?, ?, "in progress", CURRENT_TIMESTAMP)',
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
    const { workout_log_id, exercise_name, weight, reps, is_completed } = req.body;

    //validación de seguridad para evitar peticiones vacías
    if (!workout_log_id || !exercise_name) {
        return res.status(400).json({error: 'Faltan datos obligatorios: workout_log_id o exercise_name'})
    }

    //limpiar espacios al inicio o final del texto
    const cleanExerciseName = exercise_name.trim()

    try {
        // 1. Buscamos si el ejercicio ya existe en la tabla 'exercises' por su nombre
        const [existingExercises] = await db.query(
            'SELECT id FROM exercises WHERE name = ?', 
            [cleanExerciseName]
        );

        let finalExerciseId;

        if (existingExercises.length > 0) {
            // Si existe, nos quedamos con su ID
            finalExerciseId = existingExercises[0].id;
        } else {
            // Si NO existe (ej: el usuario ha escrito un ejercicio nuevo), lo insertamos primero
            const [newExercise] = await db.query(
                'INSERT INTO exercises (name) VALUES (?)', 
                [cleanExerciseName]
            );
            // Nos quedamos con el ID que le acaba de asignar MySQL
            finalExerciseId = newExercise.insertId;
        }

        // 2. Ahora que ya tenemos un ID 100% real y seguro, hacemos el INSERT en 'set_logs'
        const [result] = await db.query(
            'INSERT INTO set_logs (workout_log_id, exercise_id, weight, reps, is_completed) VALUES (?, ?, ?, ?, ?)',
            [workout_log_id, finalExerciseId, weight || 0, reps || 0, is_completed ?  1 : 0]
        )

        res.status(201).json({ success: true, message: "Serie guardada con éxito", setId: result.insertId });

    } catch (error) {
        res.status(500).json({ error: error.message });
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

//4. TRAER LOS ENTRENAMIENTOS DEL USUARIO CON SUS EJERCICIOS Y SERIES
exports.getWorkoutHistory = async (req, res) => {
    const userId = req.user.id

    try {
        //consulta combinando logs, ejercicios y series
        const [rows] = await db.query(`
            SELECT
                wl.id AS workout_log_id,
                wl.start_time,
                wl.end_time,
                wl.status,
                sl.id AS set_id,
                sl.weight,
                sl.reps,
                sl.is_completed,
                e.name AS exercise_name
            FROM workout_logs wl
            LEFT JOIN set_logs sl ON wl.id = sl.workout_log_id
            LEFT JOIN exercises e ON sl.exercise_id = e.id
            WHERE wl.user_id = ?
            ORDER BY 
                CASE WHEN wl.status = 'in progress' THEN 0 ELSE 1 END,
                wl.start_time DESC,
                e.name ASC, 
                sl.id ASC
        `, [userId])

        //como SQL devuelve una fila por cada serie, lo agrupo en formato JSON estructurad
        const history = []

        rows.forEach(row => {
            //1.buscar si ya he metido este entrenamiento en nuestro array
            let workout = history.find(w => w.id === row.workout_log_id)
            if (!workout) {
                workout = {
                    id: row.workout_log_id,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    status: row.status,
                    exercises: []
                }
                history.push(workout)
            }

            //si la fila tiene un ejerciccio (no está vacío el entrenamiento)
            if (row.exercise_name) {
                //2.buscar si el ejercicio ya existe dentro de este entrenamiento
                let exercise = workout.exercises.find(e => e.name === row.exercise_name)

                if (!exercise) {
                    exercise = {
                        name: row.exercise_name,
                        sets: []
                    }
                    workout.exercises.push(exercise)
                }

                //3.meter la serie dentro del ejercicio
                exercise.sets.push({
                    id: row.set_id,
                    weight: row.weight,
                    reps: row.reps,
                    is_completed: row.is_completed
                })
            }
        })
        res.json(history)
    } catch (error) {
        console.error("Error al obtener el historial:", error)
        res.status(500).json({error: "Error al obtener el historial de entrenamientos"})
    }
}

//5. BORRAR
exports.deleteSet = async (req, res) => {
    const {id} = req.params

    try {
        //ejecutar el borrado en la bbdd
        const [result] = await db.query(
            'DELETE FROM set_logs WHERE id = ?', [id]
        )

        //si no se borró nada es porque ese ID no existía
        if (result.affectedRows === 0) {
            return res.status(404).json({error: "No se encontró la serie que intentas borrar"})
        }

        res.json({success: true, mensaje: "Serie eliminada con éxito de la base de datos"})
    } catch (error) {
        console.error('Error al borrar la serie', error)
        res.status(500).json({error: "Error interno del servidor al borrar la serie"})
    }
}

//6. ELIMINAR ENTRENAMIENTO COMPLETO
exports.deleteWorkoutLog = async (req, res) => {
    const {id} = req.params
    try {
        const [result] = await db.query(
            'DELETE FROM workout_logs WHERE id = ?', [id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'No se encontró el entrenamiento'})
        }

        res.json({success: true, message: 'Entrenamiento y todas sus series eliminados con éxito'})
    } catch (error) {
        console.error('Error al eliminar el entrenamiento completo', error)
        res.status(500).json({error: 'Error interno al eliminar el entrenamiento'})
    }
}

//7.ESTADISTICAS
exports.getWorkoutStats = async (req, res) => {
    const userId = req.user.id

    try {
        //CONSULTA 1: contar cuántos entrenamientos ha completado el usuario SOLO EN EL MES ACTUAL
        const [workoutCount] = await db.query(`
            SELECT COUNT(*) as totalWorkouts
            FROM workout_logs
            WHERE user_id = ?
                AND status = 'completed'
                AND MONTH(end_time) = MONTH(CURRENT_DATE())
                AND YEAR(end_time) = YEAR(CURRENT_DATE())
            `, [userId])

        //CONSULTA 2: calcular el volumen total levantado (peso * reps) en todas sus series completadas SOLO EN EL MES ACTUAL
        const [volumeResult] = await db.query(`
            SELECT SUM(sl.weight * sl.reps) as totalVolume
            FROM set_logs sl
            JOIN workout_logs wl ON sl.workout_log_id = wl.id
            WHERE wl.user_id = ? 
                AND wl.status = 'completed'
                AND MONTH(wl.end_time) = MONTH(CURRENT_DATE())
                AND YEAR(wl.end_time) = YEAR(CURRENT_DATE())
            `, [userId])

            //CONSULTA 3: buscar si el usuario tiene una sesión activa en segundo plano
            //traer el id de la más reciente si por error tiene mas de una
            const [activeSession] = await db.query(
                `SELECT id FROM workout_logs WHERE user_id = ? AND status = 'in progress' ORDER BY start_time DESC LIMIT 1`,
                [userId]
            )

            //extraer los valores
            const totalWorkouts = workoutCount[0].totalWorkouts || 0
            const totalVolume = volumeResult[0].totalVolume || 0
            const activeWorkoutId = activeSession.length > 0 ? activeSession[0].id : null

            res.json({totalWorkouts, totalVolume, activeWorkoutId})
    } catch (error) {
        console.error("Error al obtener las estadísticas:", error)
        res.status(500).json({error: "Error interno al calcular las estadísticas"})
    }
}

//8.obtener volumen para el gráfico
exports.getVolumeProgression = async (req, res) => {
    const userId = req.user.id;

    try {
        //volumen total agrupado por cada día de entrenamiento de los últimos meses
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(wl.end_time, '%d/%m') as fecha,
                SUM(sl.weight * sl.reps) as volumenTotal
            FROM set_logs sl
            JOIN workout_logs wl ON sl.workout_log_id = wl.id
            WHERE wl.user_id = ? AND wl.status = 'completed'
            GROUP BY DATE(wl.end_time), wl.end_time
            ORDER BY wl.end_time ASC
            LIMIT 15
        `, [userId])

        res.json(rows)
    } catch (error) {
        console.error("Error al obtener la progresión de volumen:", error)
        res.status(500).json({error: "Error interno al procesar los datos del gráfico"})
    }
}

//9. Obtener workout por su ID
exports.getWorkoutById = async (req, res) => {
    const { id } = req.params
    const userId = req.user.id

    try {
        const [rows] = await db.query(
            `SELECT id, start_time, status 
             FROM workout_logs 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        )

        if (rows.length === 0) {
            return res.status(404).json({ error: "Workout no encontrado" })
        }

        res.json(rows[0])
    } catch (error) {
        res.status(500).json({ error: "Error al obtener workout" })
    }
}