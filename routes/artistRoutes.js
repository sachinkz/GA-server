const express = require("express")
const artistController = require("../controllers/artist-controller")
const { check } = require("express-validator")

const router = express.Router()

router.post(
  "/signup",
  [
    check("fullname").not().isEmpty().isLength({ min: 3, max: 50 }),
    check("email").normalizeEmail().isEmail().isLength({ min: 5, max: 100 }),
    check("password", "must include 6 characters ,atleast 1 lowercase ,1 uppercase,1number,1 symbol").isStrongPassword({ minLength: 6, minUppercase: 1, minLowercase: 1, minSymbols: 1, minNumbers: 1 }),
  ],
  artistController.artistSignUp
)




router.post("/post", artistController.createPost)

router.get("/feeds", artistController.fetchFeeds)

router.post("/comment", artistController.postComment)

router.post("/reply", artistController.postCommentReply)

router.get("/allcomments/:postId", artistController.fetchComments)

router.post("/likecomment", artistController.likeComment)

router.post("/likepost", artistController.likePost)

router.get('/profile/:artistId', artistController.artistProfile)

router.post('/follow', artistController.followArtist)

router.get('/notifications/:userId', artistController.getNotifications)

router.get('/notifications/update/:userId', artistController.updateNotifications)

router.get("/all-orders/:userId", artistController.getAllOrders)

router.get("/update-order/:orderId",artistController.updateOrder)

router.get("/suggestions/:artistId", artistController.followSuggestions)

router.get("/search/:searchParam", artistController.searchUser)






router.post('/pricing', artistController.createPricing)

router.post("/verification", artistController.verifyArtist)


module.exports = router;