const HttpError = require("../models/http-errors");
const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const token = req.headers.authorization
        if (!token) {
            throw new HttpError("Authentication failed no token", 401)
        }
        const decodedToken = jwt.verify(token, process.env.JWT_KEY)

        
        next();
    } catch (err) {
        return next(new HttpError("Authentication failed", 401))
    }
}