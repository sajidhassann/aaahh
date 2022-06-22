const mongoose = require('mongoose');
const User = require('./User');

const DailyAttendanceSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  duration: {
    type: Number,
    required: true,
  },
  onDate: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DailyAttendance', DailyAttendanceSchema);
