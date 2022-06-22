const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Attendance = require('../models/Attendance');

// @route   GET api/attendance
// @desc    Get a user's all attendance
// @access  Private
router.get('/:user', auth, async (req, res) => {
  try {
    const user = req.params.user;
    const startDateString = req.query.startDate;
    const endDateString = req.query.endDate;

    const startDate = new Date(startDateString);
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    const endDate = new Date(endDateString);
    endDate.setHours(0);
    endDate.setMinutes(0);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);

    if (startDateString === endDateString) {
      endDate.setDate(startDate.getDate() + 1);
    }

    const attendance = await Attendance.find({
      user,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .populate({
        path: 'user',
        select: 'name email role department',
        populate: { path: 'department', select: 'name' },
      });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
