const mongoose = require('mongoose');
const User = require('./User');

const AttendanceSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  status: {
    type: String,
    enum: ['in', 'out'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('attendance', AttendanceSchema);
