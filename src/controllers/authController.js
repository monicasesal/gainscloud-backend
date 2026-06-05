const db = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//1. REGISTRO DE USUARIOS
exports.register = async (req, res) => {
    const {username, email, password} = req.body

    //Validación básica
    if (!username || !email || !password) {
        return res.status(400).json({error: "Todos los campos son obligatorios"})
    }

    try {
        //Verificar si el email ya existe en la base de datos
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        if (existingUser > 0) {
            return res.status(400).json([{error: 'El correo electrónico ya está registrado'}])
        }

        //Encriptar la contraseña (para que no sea visible en la bbdd)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //Insertar el nuevo usuario en la bbdd (plan_type por defecto es free)
        const [result] = await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]
        )

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            userId: result.insertId
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error en el servicio al registrar el usuario'})
    }
}

//2. INICIO DE SESIÓN (LOGIN)
exports.login = async (req, res) => {
    const {email, password} = req.body

    if (!email || !password) {
        res.status(400).json({error: 'Email y contraseña requeridos'})
    }

    try {                             
        //Buscar al usuario por su email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        const user = users[0]

        //Si el usuario no existe...
        if (!user) {
            return res.status(400).json({error: 'Usuario o contraseña incorrectos'})
        }

        //Comprobar si la contraseña coincide con la encriptada
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({error: 'Usuario o contraseña incorrectos'})
        }

        //Generar el Token JWT (Expira en 24h)
        const token = jwt.sign(
            {id: user.id, plan_type: user.plan_type},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        //Devolver los datos del usuario (excepto la contraseña junto al token)
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                plan_type: user.plan_type
            }
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Error en el servidor al iniciar sesión'})
    }
}