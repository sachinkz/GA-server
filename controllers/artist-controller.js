const HttpError = require("../models/http-errors")
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { validationResult } = require("express-validator")
require('dotenv').config()
const sendMail = require("../middlewares/sendMail")

const Artist = require("../models/artist-model")
const User = require("../models/user-model")
const Post = require("../models/post-model")
const Order = require("../models/order-model")
const Otp = require("../models/otp-model")
const Comment = require("../models/comment-model")
const Notification = require("../models/notification-model")
const Replies = require("../models/replies-model")


const FEEDS_BATCH = 5;

const fetchFeeds = async (req, res, next) => {

  const { searchParams } = new URL(req.originalUrl, `http://${req.headers.host}`);
  const cursor = searchParams.get("cursor");


  try {

    const query = {};

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const feeds = await Post.find(query)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(FEEDS_BATCH + 1) // Fetch one extra to check for the nextCursor
      .populate('userId', "imageUrl name isVerified isTopten")
      .exec();

    let nextCursor = null;
    if (feeds.length === FEEDS_BATCH + 1) {
      nextCursor = feeds[FEEDS_BATCH].id;
      feeds.pop(); // Remove the extra element used for cursor check
    }

    res.json({
      items: feeds,
      nextCursor,
    });
  } catch (error) {
    return next(new HttpError("Something went wrong, couldn't load artists", 500))
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const postComment = async (req, res, next) => {
  const { artistId, artistName, imgUrl, comment, postId } = req.body;

  const newComment = new Comment({
    artistId, artistName, imgUrl, comment, postId
  })

  let postToComment
  try {
    postToComment = await Post.findById(postId)
  } catch (err) {
    return next(new HttpError("something went wrong, couldnt find the post"))
  }


  let savedComment
  let artistData
  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    savedComment = await newComment.save({ session: session })
    postToComment.comments.push(savedComment)
    await postToComment.save({ session: session })
    await session.commitTransaction()
    artistData = await User.findById(postToComment.userId)

    const newNotification = new Notification({
      from: artistId,
      to: postToComment.userId,
      message: `${artistName} commented on your post`,
      postId: postId,
      artistImg: artistData.imageUrl
    })

    await newNotification.save()
  }
  catch (err) {
    return next(new HttpError("something went wrong, saving comment failed"))
  }

  const mailData = {
    message: `${artistName} commented on your post`,
    mailId: `${artistData.email}`
  }

  sendMail(mailData)

  res.json(savedComment)
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const postCommentReply = async (req, res, next) => {
  const { artistId, artistName, imgUrl, comment, commentId } = req.body;

  const newReply = new Replies({
    artistId, artistName, imgUrl, comment
  })

  let CommentToReply
  try {
    CommentToReply = await Comment.findById(commentId)
  } catch (err) {
    return next(new HttpError("something went wrong, couldnt find the post"))
  }


  let savedReply
  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    savedReply = await newReply.save({ session: session })
    CommentToReply.replies.push(savedReply)
    await CommentToReply.save({ session: session })
    await session.commitTransaction()
  }
  catch (err) {
    return next(new HttpError("something went wrong, saving comment failed"))
  }

  res.json(savedReply)
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const fetchComments = async (req, res, next) => {

  const postId = req.params.postId

  let comments
  try {
    comments = await Comment.find({ postId: postId }).populate("replies")
    comments.sort((a, b) => b.createdAt - a.createdAt)
  } catch (err) {
    return next(new HttpError("something went wrong, fetchin comments failed"))
  }
  res.json(comments)

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const likeComment = async (req, res, next) => {

  const { commentId, userId } = req.body

  let comment
  try {
    comment = await Comment.findById(commentId)
    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId)
    } else {
      comment = await Comment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: userId } },
        { new: true }
      );
    }
    comment.save()
  } catch (err) {
    return next(new HttpError("something went wrong, linking comments failed"))
  }

  res.json({ status: true, likes: comment.likes })

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const likePost = async (req, res, next) => {

  const { postId, userId } = req.body

  if (!userId && !postId) {
    return next(new HttpError("please provide userid and postid"))

  }

  let post
  let likeTo
  try {
    post = await Post.findById(postId)
    likeTo = await User.findById(post.userId)
    const likeFrom = await User.findById(userId)

    const newNotification = new Notification({
      from: userId,
      to: post.userId,
      message: `${likeFrom.name} liked your post`,
      postId: postId,
      artistImg: likeFrom.imageUrl
    })

    await newNotification.save()

    if (!post.likes.includes(userId)) {
      post.likes.push(userId)
      const mailData = {
        message: `${likeFrom.name} liked your post`,
        mailId: `${likeTo.email}`
      }

      sendMail(mailData)
    } else {
      post = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
    }
    post.save()

  } catch (err) {
    return next(new HttpError("something went wrong, linking post failed"))
  }



  res.json({ status: true, post })

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const artistProfile = async (req, res, next) => {
  const artistId = req.params.artistId
  let artistDetails
  try {
    artistDetails = await User.findById(artistId).populate('posts').lean().exec()
  } catch {
    return next(new HttpError('something went wrong couldnt fetch artist details', 500))
  }
  res.json({ status: true, artistDetails })
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const artistSignUp = async (req, res, next) => {
  const validation = validationResult(req).array()

  if (validation.length !== 0) {
    return next(new HttpError(validation[0].msg, 422))
  }

  const { fullname, email, password, confirm } = req.body

  if (password !== confirm) {
    return next(new HttpError("passwords do not match", 422));
  }


  let alreadyExist
  try {
    alreadyExist = await Artist.findOne({ email: email })
  } catch {
    return next(new HttpError("something went wrong ", 500))
  }

  if (alreadyExist) {
    return next(new HttpError("Artist already exist,try loging in", 500))
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch {
    return next(new HttpError("something went wrong while hashing the password ", 500))
  }
  const createdArtist = new Artist({
    fullname,
    email,
    mobile: null,
    image: "https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1",
    password: hashedPassword,
    isVerified: false,
    isTopten: false,
    posts: [],
    reviews: [],
    followers: [],
    following: [],
  })

  try {
    await createdArtist.save()
  } catch {
    return next(new HttpError("something went wrong while saving the artist details ", 500))
  }

  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

  if (otp) {
    sendMail(otp)
    const createdOtp = new Otp({ otp, artistId: createdArtist._id })

    try {
      await createdOtp.save()
    } catch (err) {
      return next(new HttpError("otp verification failed"), 422)
    }
  }

  res.json({ artistId: createdArtist._id, email: createdArtist.email, isVerified: createdArtist.isVerified })
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const artistLogin = async (req, res, next) => {

  const { email, password } = req.body

  let emailExist;
  try {
    emailExist = await Artist.findOne({ email: email })
  } catch {
    return next(new HttpError("something went wrong please try again", 500))
  }

  if (!emailExist) {
    return next(new HttpError('wrong email or password'), 422)
  }

  let isValidPassword = false
  try {
    isValidPassword = bcrypt.compare(password, emailExist.password)
  } catch (err) {
    return next(new HttpError("something went wrong please try again"), 422)
  }

  if (!isValidPassword) {
    return next(new HttpError("wrong email or password"), 422)
  }

  let token
  try {
    token = jwt.sign(
      { isArtist: true, artistId: emailExist._id, email: emailExist.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    )
  } catch {
    return next(new HttpError("something went wrong", 500))
  }
  res.json({ token })
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getNotifications = async (req, res, next) => {
  const userId = req.params.userId

  try {

    const nots = await Notification.find({ to: userId }).sort({ createdAt: -1 })

    res.json(nots)
  } catch (err) {

  }
}

const updateNotifications = async (req, res, next) => {
  const userId = req.params.userId

  try {
    await Notification.updateMany({ to: userId }, { $set: { status: 'SEEN' } })
    const nots = await Notification.find({ to: userId }).sort({ createdAt: -1 })
    res.json(nots)

  } catch (err) {
    return next(HttpError('something went wrong fetching notifications', 422))
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const verifyEmail = async (req, res, next) => {

  const { otp, artistId } = req.body;

  let validOtp
  try {
    validOtp = await Otp.findOne({ otp: otp, artistId: artistId });
  } catch (err) {
    return next(HttpError('something went wrong while verifying otp', 422))
  }

  let artist
  try {
    artist = await Artist.findByIdAndUpdate(artistId, {
      isVerified: true
    })
  } catch (err) {
    return next(HttpError('something went wrong while finding artist data', 422))
  }
  if (!artist) {
    return next(HttpError('this artist account does not axists', 422))
  }

  let token;
  try {
    token = jwt.sign(
      {
        isArtist: true,
        artistId: artist._id,
        email: artist.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    )
  } catch {
    return next(new HttpError("something went wrong while generating jwt token", 500))
  }

  res.json({ token, artistId: artist._id, isArtist: true, isVerified: true })

}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const resendOtp = async (req, res, next) => {

  const { artistId, email } = req.body

  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

  if (otp) {
    sendMail(otp, email)
    const createdOtp = new Otp({ otp, artistId: artistId })

    try {
      await createdOtp.save()
    } catch (err) {
      return next(new HttpError("otp verification failed"), 422)
    }
  }

  res.json(200, { status: "success" })
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createPost = async (req, res, next) => {

  const { caption, postUrl, userId, name } = req.body


  let artist;
  try {
    artist = await User.findOne({ userId: userId })
  } catch {
    return next(new HttpError('oops someting went wrong,try again later', 500))
  }

  const fileExt = postUrl.split(".").pop()

  let isVideo = false
  if (fileExt === "mp4") {
    isVideo = true
  }

  const createdPost = new Post({
    userId: artist._id,
    name,
    caption,
    isVideo,
    postUrl,
    comments: [],
    likes: [],
  })

  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    await createdPost.save({ session: session })
    artist.posts.push(createdPost)
    await artist.save({ session: session })
    await session.commitTransaction()
  }
  catch {
    return next(new HttpError("something went wrong, posting image failed"))
  }
  res.json({ message: "post created", createdPost })
}



const followArtist = async (req, res, next) => {
  const { artistToFollow, loggedArtist } = req.body

  let toFollow;
  let follower;
  let alreadyFollowing;

  try {
    toFollow = await User.findById(artistToFollow)
    alreadyFollowing = toFollow.followers.find(id => id.equals(loggedArtist))
    if (!alreadyFollowing) {
      toFollow.followers.push(loggedArtist)
      await toFollow.save()
      follower = await User.findById(loggedArtist)
      follower.following.push(artistToFollow)
      await follower.save()
    } else {
      toFollow.followers.pull(loggedArtist)
      await toFollow.save()
      follower = await User.findById(loggedArtist)
      follower.following.pull(artistToFollow)
      await follower.save()
    }
  } catch {
    return next(new HttpError('something went wrong could not follow the artist'), 500)
  }
  alreadyFollowing ? res.json({ follow: false }) : res.json({ follow: true })
}


const createPricing = async (req, res, next) => {
  let styles = req.body.styles;
  let artistId = req.artistData.artistId;

  const createdPricing = new Pricing({
    artistId,
    styles
  })
  try {
    createdPricing.save();

  } catch (err) {
    return next(new HttpError('something went wrong could not load Profile'), 500)
  }
  res.json(createdPricing)
}



const verifyArtist = async (req, res, next) => {

  const { pricing, artistAddress } = req.body
  const artistId = req.artistData.artistId

  const createdPricing = new Pricing({
    artistId,
    styles: pricing
  })
  try {
    let updated = await Artist.findByIdAndUpdate(artistId, { isVerified: true })
    createdPricing.save();


  } catch {
    return next(new HttpError('something went wrong ', 500))
  }
  res.json({ message: 'done' })
}




const getAllOrders = async (req, res, next) => {
  const userId = req.params.userId

  let allOrderRequests
  let allAcceptedOrders
  try {
    const allOrders = await Order.find({ orderedTo: userId }).populate("orderedTo", "-email -password -mobile").populate("address").lean().exec()

    allOrderRequests = allOrders.filter((order) => order.status === "PAYED")
    allOrderRequests = allOrderRequests.sort((a, b) => b.createdAt - a.createdAt)

    allAcceptedOrders = allOrders.filter((order) => order.status !== "UNPAYED" || "PAYED")
    allAcceptedOrders = allAcceptedOrders.sort((a, b) => b.createdAt - a.createdAt)

  } catch {
    return next(
      new HttpError("something went wrong could not find order history"),
      500
    )
  }
  res.json({ allOrderRequests: allOrderRequests, allAcceptedOrders: allAcceptedOrders })
}


const updateOrder = async (req, res, next) => {
  const orderId = req.params.orderId
  let order
  try {
    order = await Order.findById(orderId).populate("address")

    if (order.status === "PAYED") {
      order.status = "ACCEPTED"
      const mailData = {
        message: `Your Order has been accepted by the artist`,
        mailId: `${order.address.email}`
      }
      sendMail(mailData)
    } else if (order.status === "ACCEPTED") {
      order.status = "COMPLETED"
      const mailData = {
        message: `The artist have completed the work of the custom portrait you have ordered on GrabArts and will soon be shipped to your address`,
        mailId: `${order.address.email}`
      }
      sendMail(mailData)
    } else if (order.status === "COMPLETED") {
      order.status = "SHIPPED"
      const mailData = {
        message: `The custom portrait you have ordered on GrabArts has been shipped to your address`,
        mailId: `${order.address.email}`
      }
      sendMail(mailData)
    }

    order.save()

  } catch (err) {
    return next(
      new HttpError("something went wrong could not update order"),
      500
    )
  }

  res.json({ message: "orderUpdated" })
}



const followSuggestions = async (req, res, next) => {
  const artistId = req.params.artistId

  const query = {
    _id: { $ne: artistId },
    isAdmin: { $ne: true },
    followers: { $nin: [artistId] }
  }

  let suggestions

  try {
    suggestions = await User.find(query).limit(6);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not fetch suggestions"),
      500
    )
  }

  res.json({ success: true, suggestions: suggestions })
}



const searchUser=async (req, res,next) => {
  try {
    const usernameQuery = req.params.searchParam;

    if (!usernameQuery) {
      return res.status(400).json({ error: 'Username query parameter is required.' });
    }

    const users = await User.find({ name: { $regex: new RegExp(usernameQuery, 'i') } }).limit(8);

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.artistSignUp = artistSignUp;
exports.artistLogin = artistLogin;
exports.createPost = createPost;
exports.fetchFeeds = fetchFeeds
exports.artistProfile = artistProfile
exports.followArtist = followArtist
exports.createPricing = createPricing
exports.verifyArtist = verifyArtist
exports.verifyEmail = verifyEmail
exports.resendOtp = resendOtp
exports.postComment = postComment
exports.fetchComments = fetchComments
exports.postCommentReply = postCommentReply
exports.likeComment = likeComment
exports.likePost = likePost
exports.getNotifications = getNotifications
exports.updateNotifications = updateNotifications
exports.getAllOrders = getAllOrders
exports.updateOrder = updateOrder
exports.followSuggestions = followSuggestions
exports.searchUser = searchUser

