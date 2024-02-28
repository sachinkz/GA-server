const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const userSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: [true, "an account with this email already exists"]
  },
  imageUrl: { type: String },
  reviews: [{ type: mongoose.Types.ObjectId, ref: "Review" }],
  isVerified: { type: Boolean, requied: true, default: false },
  isTopten: { type: Boolean, requied: true, default: false },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
  works: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
  followers: [{ type: mongoose.Types.ObjectId, required: true, ref: "Artists" }],
  following: [{ type: mongoose.Types.ObjectId, required: true, ref: "Artists" }],
  addresses: [{ type: mongoose.Types.ObjectId}],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
})


module.exports = mongoose.model("User", userSchema)
