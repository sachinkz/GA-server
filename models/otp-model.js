const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const otpSchema = new Schema({
  otp:{type: String,required:true ,length:6},
  artistId:{type:mongoose.Types.ObjectId,required:true, ref:"Artist"},
  expireAt: { type: Date, default: Date.now, index: { expires: '3m' } }
}, {
  timestamps:true
})

module.exports = mongoose.model("Otp", otpSchema)
