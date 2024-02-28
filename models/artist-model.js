const mongoose = require('mongoose');
const { Schema } = require('mongoose');


const artistSchema = new Schema({
  
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
})


module.exports = mongoose.model('Artist', artistSchema);
