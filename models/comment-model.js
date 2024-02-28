const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const commentSchema = new Schema({
    artistId: { type: mongoose.Types.ObjectId, required: true },
    postId:{type: mongoose.Types.ObjectId, required: true,ref:"Post"},
    artistName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    comment: { type: String, required: true },
    likes: [{ type: mongoose.Types.ObjectId, ref: "User", required: true },],
    replies: [{ type: mongoose.Types.ObjectId, ref: "Replies", required: true }],
    replying:{ type:Boolean, required: true,default:false}
}, {
    timestamps: true
})

module.exports = mongoose.model("Comment", commentSchema)


