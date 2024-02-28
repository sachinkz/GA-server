const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const orderSchema = new Schema({
  orderedBy: { type: String, required: true ,ref:'User'},
  orderedTo: { type: String, required: true, ref:'User' },
  paper: { type: String, required: true },
  faces: { type: String, required: true },
  address: { type: mongoose.Types.ObjectId,ref:"Address"},
  suggestion: { type: String, required: false },
  status: { type: String,enum:["UNPAYED","PAYED","PENDING","REJECTED","ACCEPTED","COMPLETED","SHIPPED","DELIVERED"],default:"PAYED", required: true },
  style: { type: String, required: true },
  amount: { type: Number},
  imgUrl: { type: String, required: true },
}, {
  timestamps:true
})

module.exports = mongoose.model("Order", orderSchema)
