const mongoose = require('mongoose');
const { Schema } = require('mongoose')

const repliesSchema = new Schema({
    artistId:{type:mongoose.Types.ObjectId, required:true},
    artistName: {type:String, required:true},
    imgUrl:{type:String, required:true},
    comment: {type:String, required:true}
})

const Replies=mongoose.model("Replies",repliesSchema)

module.exports =Replies;