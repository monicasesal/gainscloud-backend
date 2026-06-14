const jwt = require('jsonwebtoken')

//1. CONTROLADOR DE AUTENTICACIÓN GENERAL
exports.protect = (req, res, next) => {
    let token 

    //Los tokens se envían en las cabeceras (headers) como Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return res.status(401).json({error: 'No autorizado, no se proporcionó ningún token'})
    }

    try {
        //Verificar que el token es real y no ha expirado
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //Inyectar los datos del usuario descodificados en la petición (req.user)
        //Así, cualquier ruta posterior sabrá el ID y el Plan de este usuario
        req.user = decoded 

        next()
    } catch (error) {
        return res.status(401).json({error: 'Token no válido o expirado'})
    }
}

