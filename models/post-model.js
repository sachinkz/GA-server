const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const postSchema = new Schema({
  caption: { type: String },
  name: { type: String },
  postUrl: { type: String, required: true },
  isVideo: { type: Boolean, required: true },
  userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  comments: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
  likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})


module.exports = mongoose.model("Post", postSchema)
