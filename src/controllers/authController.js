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

    //Contraseña robusta
    const validPassword = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/ //mínimo 8 caracteres, al menos una letra y un número, permite símbolos
    if (!validPassword.test(password)) {
        return res.status(400).json({
            error: "La contraseña es demasiado débil. Debe tener al menos 8 caracteres, incluir al menos una letra y un número"
        })
    }

    try {
        //Verificar si el email ya existe en la base de datos
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        if (existingUser.length > 0) {
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

//3.ACTUALIZAR EL PESO CORPORAL DEL USUARIO
exports.updateWeight = async (req, res) => {
    const userId = req.user.id
    const {weight} = req.body

    if (!weight || isNaN(weight) || weight <= 0) {
        return res.status(400).json({error: "Por favor, introduce un peso válido mayor que 0"})
    }

    try {
        await db.query('UPDATE users SET weight = ? WHERE id = ?', [weight, userId])
        res.json({message: 'Peso actualizado correctamente:', weight})
    } catch (error) {
        console.error("Error al actualizar el peso:", error)
        res.status(500).json({error: "Error interno del servidor"})
    }
}

//4.OBTENER LOS DATOS DEL PERFIL DEL USUARIO
exports.getProfileData = async (req, res) => {
    const userId = req.user.id

    try {
        const [rows] = await db.query(`SELECT username, email, weight, created_at FROM users WHERE id = ?`, [userId])
        if (rows.length === 0) {
            return res.status(404).json({error: "Usuario no encontrado"})
        }

        res.json(rows[0])
    } catch (error) {
        console.error("Error al obtener datos del perfil:", error)
        res.status(500).json({error: "Error interno del servidor"})
    }
}

//5.PLAN PREMIUM VS FREE
exports.updatePlan = async (req, res) => {
    const userId = req.user.id
    const {newPlan, promoCode} = req.body

    if (!['free', 'premium'].includes(newPlan)) {
        return res.status(400).json({error: 'Plan no válido'});
    }

    //Si intenta ser premium, obligar a que use el código secreto
    if (newPlan === 'premium' && promoCode === 'GAINSCLOUD2026') {
        return res.status(403).json({error: 'Acceso denegado. Para activar el plan Premium de demostración, introduce el código promocional válido.'})
    }

    try {
        await db.query('UPDATE users SET plan_type = ? WHERE id = ?', [newPlan, userId])

        //Buscar los datos actualizados del usuario para devolvérselos al Front
        const [rows] = await db.query('SELECT id, username, email, plan_type FROM users WHERE id = ?', [userId])
        
        res.json({
            mensaje: `Plan actualizado a ${newPlan}`,
            user: rows[0]
        })
    } catch (error) {
        console.error('Error al actualizar el plan:', error)
        res.status(500).json({error: 'Error en el servidor al cambiar de plan'})
    }
};