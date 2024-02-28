const mongoose = require('mongoose');
const { Schema } = require('mongoose');


const addressSchema = new Schema({
  fullName:{type: String, required: true},
  email:{type: String, required: true},
  mobile:{type: Number, required: true},
  pin:{type: Number, required: true},
  address:{type: String, required: true}
}, {
  timestamps: true
})


module.exports = mongoose.model('Address', addressSchema);
