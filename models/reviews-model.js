const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const reviewSchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  artistId: { type: mongoose.Types.ObjectId, required: true, ref: "Artist" },
  review: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})


module.exports = mongoose.model("Review", reviewSchema)
