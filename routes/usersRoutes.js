const express = require("express")
const userController = require('../controllers/user-controller')
const { check } = require("express-validator")


const router = express.Router()

router.post("/order",userController.orderWork)

router.post("/create-checkout-session",userController.createCheckoutSession)

router.get("/getartists", userController.getTopArtists)

router.get("/pricing/:artistId", userController.getPricing)

router.get("/all-orders/:userId", userController.getAllOrders)

router.post("/detect-faces", userController.detectFaces)

module.exports = router