require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const exerciseRoutes = require('./routes/exerciseRoutes')
const routineRoutes = require('./routes/routineRoutes')
const workoutRoutes = require('./routes/workoutRoutes')
const aiRoutes = require('./routes/aiRoutes')
const app = express()

//Middlewares básicos
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/routines', routineRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/ai', aiRoutes)


//Función para arrancar el servidor comprobando primero la conexión a la base de datos
async function startServer() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS resultado')
        console.log('Conexión exitosa a MySQL Workbench')
        
        const PORT = process.env.PORT || 3000
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`)
        })
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message)
        process.exit(1) // Salir del proceso con un código de error
    }
}

startServer()