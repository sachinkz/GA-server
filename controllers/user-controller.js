const HttpError = require("../models/http-errors")
require('dotenv').config()
const Artist = require("../models/artist-model")
const Order = require("../models/order-model")
const Address = require("../models/address-model")
const User = require("../models/user-model")

const vision = require('@google-cloud/vision');
const keyfile = '../ace-vial-415905-442857522178.json';
const stripe = require("stripe")(process.env.STRIPE_KEY)


const getTopArtists = async (req, res, next) => {

  let artists;
  try {
    artists = await User.find({ _id: { $ne: "65e0b22446af5a996c849dfb" } }).populate({ path: 'posts', options: { sort: { createdAt: -1 } } }).lean().exec()

  } catch {
    return next(new HttpError('something went wrong', 500))
  }
  res.json({ status: true, artists })
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

const getArtistProfile = async (req, res, next) => {
  const artistId = req.params.artistId
  let artistDetails
  let artistPricing
  try {
    artistDetails = await Artist.findById(artistId)
      .populate("posts")
      .populate("reviews")
      .lean()
      .exec()
    artistPricing = await Pricing.findOne({ artistId: artistId })
  } catch {
    return next(
      new HttpError("something went wrong couldnt fetch artist details", 500)
    )
  }
  res.json({ artistDetails, artistPricing })
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

const orderWork = async (req, res, next) => {

  const { imgUrl, paper, faces, style, suggestion, orderedBy, orderedTo } = req.body

  const newOrder = new Order({
    imgUrl, paper, faces, style, suggestion, orderedBy, orderedTo
  })

  let createdOrder;
  try {
    createdOrder = await newOrder.save()
  } catch (err) {
    return next(new HttpError('something went wrong ', 500))
  }

  res.json({ status: true, createdOrder })

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////


const createCheckoutSession = async (req, res, next) => {

  const { orderId, fullName, email, mobile, pin, address } = req.body


  const newAddress = new Address({
    fullName, email, mobile, pin, address
  })

  // let order
  // let createdAddress
  let session

  const pricing = [
    {
      faces: "1",
      a5: 1600,
      a4: 1800,
      a3: 2000,
    },
    {
      faces: "2",
      a5: 1800,
      a4: 2000,
      a3: 2200,
    },
    {
      faces: "3",
      a5: 2000,
      a4: 2200,
      a3: 2400,
    },
    {
      faces: "4",
      a5: 2200,
      a4: 2400,
      a3: 2600,
    },
  ]

  try {

    await newAddress.save()
    const order = await Order.findById(orderId)
    order.address = newAddress._id

    const price = pricing.find((item) => item.faces === order.faces)
    let amount;
    if (order.paper === "A4") {
      amount = price.a4
    } else if (order.paper === "A5") {
      amount = price.a5
    } else if (order.paper === "A3") {
      amount = price.a3
    }

    order.amount = amount

    await order.save()

    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: {
            name: "custom portrait"
          },
          unit_amount: amount * 100,

        },
        quantity: 1
      }],
      mode: "payment",
      success_url: "http://localhost:3000/",
      cancel_url: "http://localhost:3000/"
    })

  } catch (err) {
    return next(new HttpError(err.message, 500))
  }

  res.json({ status: true, id: session.id })
}




///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////



const getPricing = async (req, res, next) => {
  const artistId = req.params.artistId
  let pricing
  try {
    pricing = await Pricing.findOne({ artistId: artistId }).lean().exec()
  } catch {
    return next(
      new HttpError("something went wrong could not find Pricing"),
      500
    )
  }
  res.json(pricing)
}



const getAllOrders = async (req, res, next) => {
  const userId = req.params.userId

  let allOrders
  try {
    allOrders = await Order.find({ orderedBy: userId }).populate("orderedTo", "-email -password -mobile").populate("address").lean().exec()

    allOrders = allOrders.sort((a, b) => b.createdAt - a.createdAt)

  } catch {
    return next(
      new HttpError("something went wrong could not find order history"),
      500
    )
  }
  res.json(allOrders)
}


const detectFaces = async (req, res, next) => {

  const client = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });


  try {
    const fileName = req.body.imgUrl;

    const [result] = await client.faceDetection(fileName);
    const faces = result.faceAnnotations;
    res.json({ status: true, data: faces.length })

  } catch (err) {
    return next(
      new HttpError(err),
      500
    )
  }

}

exports.getTopArtists = getTopArtists;
exports.orderWork = orderWork;
exports.getArtistProfile = getArtistProfile;
exports.getPricing = getPricing;
exports.getAllOrders = getAllOrders
exports.createCheckoutSession = createCheckoutSession
exports.detectFaces = detectFaces