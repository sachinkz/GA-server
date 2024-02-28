const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const notificationSchema = new Schema({
  from:{type:mongoose.Types.ObjectId,required:true},
  to:{type:mongoose.Types.ObjectId,required:true},
  message:{type:String,required:true},
  postId:{type:mongoose.Types.ObjectId,required:true},
  artistImg:{type:String,required:true},
  status:{type:String,required:true,enum:["NOTSEEN","SEEN"],default:"NOTSEEN"}
}, {
  timestamps:true
})

module.exports = mongoose.model("Notification", notificationSchema)
