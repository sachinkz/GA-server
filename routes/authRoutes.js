const express = require("express")
const authController = require('../controllers/auth-controller')

const router = express.Router()


router.post('/newuser',authController.createUser)

router.get('/getuser/:userId',authController.getUser)



module.exports = router;