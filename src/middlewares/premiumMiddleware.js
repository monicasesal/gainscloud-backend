const db = require('../config/db')

exports.checkPremium = async (req, res, next) => {
    try {
        const userId = req.user.id

        const [rows] = await db.query(`SELECT plan_type FROM users WHERE id = ?`, [userId])

        if (rows.length === 0) {
            return res.status(404).json({error: 'Usuario no encontrado'})
        }

        const userPlan = rows[0].plan_type

        if (userPlan !== 'premium') {
            return res.status(403).json({error: 'Acceso denegado, esta funcionalidad requiere suscripción Premium'})
        }

        next()
    } catch (error) {
        console.error('Error en premiumMiddleware:', error)
        return res.status(500).json({error: 'Error interno al verificar el plan del usuario.'})
    }
}