const {GoogleGenAI} = require('@google/genai')
const db = require('../config/db')

exports.getCoachFeedback = async (req, res) => {
    const userId = req.user.id
    
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('La variable GEMINI_API_KEY no está cargada en el servidor')
            return res.status(500).json({error: 'Error de configuración en el servidor de IA'})
        }
        const ai = new GoogleGenAI({apiKey: apiKey})
        //Traer los entrenamientos completados del último mes con sus ejercicios y series
        //Consulta limpia para extraer el historial que la IA necesita leer
        const [workouts] = await db.query(`
            SELECT
                wl.id as workout_id,
                wl.end_time as fecha,
                e.name as ejercicio,
                sl.weight as peso,
                sl.reps as repeticiones
            FROM set_logs sl
            JOIN workout_logs wl ON sl.workout_log_id = wl.id
            JOIN exercises e ON sl.exercise_id = e.id
            WHERE wl.user_id = ? AND wl.status = 'completed'
            ORDER BY wl.end_time DESC
            LIMIT 40
        `, [userId])

        if (workouts.length === 0) {
            return res.status(400).json({error: 'No tienes suficientes entrenamientos completados para realizar un análisis de rendimiento'})
        }

        //dar formato de texto a los datos para que gemini los entienda
        let dataTrainingText = workouts.map(w => `- Fecha: ${new Date(w.fecha).toLocaleDateString()}, Ejercicio: ${w.ejercicio}, Carga: ${w.peso}kg x ${w.repeticiones} reps`).join('\n') //une los elementos usando un salto de linea entre ellos

        //crear el prompt
        const promptInstructions = `
            Eres "GainsCloud Ciber-Coach", un entrenador personal experto en hipertrofia, powerlifting, optimización del rendimiento físico y hábitos saludables.
            Analiza el historial de entrenamientos recientes de este usuario y redacta un informe de progreso motivador, conciso y técnico.
            
            Historial de series del usuario:
            ${dataTrainingText}

            Tu respuesta debe estructurarse estrictamente en estos 3 puntos:
            **Análisis de Carga y Volumen**: Identifica si ha subido de peso en algún ejercicio o si mantiene un buen volumen de trabajo.
            **Puntos Fuertes o Estancamientos**: Felicítale por sus ejercicios más fuertes o adviértele amablemente si algún ejercicio se ve estancado en peso/reps.
            **Consejo del Ciber-Coach**: Dale un consejo táctico para la próxima semana (ej. aplicar sobrecarga progresiva, variar repeticiones, o pautas de descanso).

            Sé directo, habla en segunda persona, mantén un tono profesional, enérgico y fitness. No uses introducciones largas. Máximo 3 párrafos cortos en total.
        `

        //llamar a la API de gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptInstructions
        })

        res.json({feedback: response.text})
    } catch (error) {
        console.error("Error en el Ciber-Coach de Gemini:", error)
        res.status(500).json({error: "Se ha producido un error con el Cyber coach. Inténtalo de nuevo más tarde."})
    }
}