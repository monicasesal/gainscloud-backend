const request = require('supertest')
const express = require('express')
const exerciseRoutes = require('../routes/exerciseRoutes')
const db = require('../config/db')

//Mock del middleware de seguridad
jest.mock('../middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1 }
        next()
    }
}))
const app = express()
app.use(express.json())
app.use('/api/exercises', exerciseRoutes)

//Mockear la bd para no meter basura en mysql
jest.mock('../config/db', () => ({
    query: jest.fn()
}))


describe('Tests del controlador de ejercicios', () => {
    
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/exercises', () => {
        it('Debería crear un ejercicio con éxito y devolver 201', async () => {
            //Simular que la bd ejecuta el INSERT correctamente
            db.query.mockResolvedValue([{affectedRows: 1}])

            const response = await request(app)
                .post('/api/exercises')
                .send({name: 'Press Militar'})

            expect(response.statusCode).toBe(201)
            expect(response.body).toHaveProperty('message', 'Ejercicio personalizado creado con éxito')
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO exercises'),
                ['Press Militar', 1]
            )
        })

        it('Debería devolver 400 si el nombre viene vacío', async () => {
            const response = await request(app)
                .post('/api/exercises')
                .send({ name: '' })

            expect(response.statusCode).toBe(400)
            expect(response.body).toHaveProperty('error', 'El nombre y el grupo muscular son obligatorios')
        })
    })

    describe('GET /api/exercises', () => {
        it('Debería obtener el catálogo de ejercicios en un array', async () => {
            const listaFalsa = [
                {id: 1, name: 'Sentadillas'},
                {id: 2, name: 'Dominadas'}
            ]
            db.query.mockResolvedValue([listaFalsa])

            const response = await request(app).get('/api/exercises')

            expect(response.statusCode).toBe(200)
            expect(Array.isArray(response.body)).toBe(true)
            expect(response.body.length).toBe(2)
            expect(response.body[0].name).toBe('Sentadillas')
        })
    })
})