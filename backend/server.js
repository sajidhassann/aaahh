const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
const http = require('http');
const dayjs = require('dayjs');
const cron = require('node-cron');
const duration = require('dayjs/plugin/duration');
const { Server } = require('socket.io');
const Room = require('./models/Room');
const Chat = require('./models/Chat');
const Attendance = require('./models/Attendance');
const DailyAttendance = require('./models/DailyAttendance');

const app = express();
const server = http.createServer(app);
dayjs.extend(duration);

// Connect DB
connectDB();

const io = new Server(server, {
  path: '/socket',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let activeUsers = {};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);
  app.set('socket', socket);

  socket.on('active_user', async (user) => {
    activeUsers[socket.id] = user;
    try {
      const newAttendance = new Attendance({
        user,
        status: 'in',
      });
      newAttendance.save();
    } catch (err) {
      console.log({ err });
    }
    io.emit('active_users', activeUsers);
  });

  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on('send_message', async (data) => {
    console.log({ data });
    try {
      const newMessage = new Chat({
        ...data,
      });
      let message = await newMessage.save();
      message = await Chat.populate(message, {
        path: 'author',
        select: 'name email role department',
        populate: { path: 'department', select: 'name' },
      });
      message = await Chat.populate(message, {
        path: 'room',
        select: 'members',
        populate: { path: 'members', select: 'name role email' },
      });
      console.log({ message });
      socket.to(data.room).emit('receive_message', message);
    } catch (err) {
      console.log({ err });
    }
  });

  socket.on('set_room', async (members) => {
    try {
      let room = await Room.findOne({
        members: { $all: members },
      }).populate({
        path: 'members',
        select: 'name email role department',
        populate: { path: 'department', select: 'name' },
      });
      if (!room) {
        const newRoom = new Room({
          members,
        });
        room = await newRoom.save();
        room = await Room.populate(room, {
          path: 'members',
          select: 'name email role department',
          populate: { path: 'department', select: 'name' },
        });
      }

      console.log({ room, members });

      // socket.join(room._id);
      io.emit(members[0], room);
      io.emit(members[1], room);
    } catch (err) {
      console.error(err.message);
    }
  });

  socket.emit('me', socket.id);
  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from, name });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('video', (data) => {
    io.to(data.to).emit('video', data.video);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
    try {
      const newAttendance = new Attendance({
        user: activeUsers[socket.id],
        status: 'out',
      });
      newAttendance.save();
    } catch (err) {
      console.log({ err });
    }
    delete activeUsers[socket.id];
    io.emit('active_users', activeUsers);
    socket.broadcast.emit('callEnded');
  });
});

// Init Middleware

app.use(express.json({ extended: false }));
app.use(cors());

//Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/room', require('./routes/room'));
app.use('/api/attendance', require('./routes/attendance'));
app.get('/api/sample', async (req, res) => {
  const now = dayjs();
  const yesterday = now.subtract(1, 'day');
  const groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  try {
    const list = await Attendance.find()
      .where({
        date: {
          $gte: new Date(yesterday.format('YYYY-MM-DD')),
          $lt: new Date(now.format('YYYY-MM-DD')),
        },
      })
      .sort({ date: -1 });

    const attendance = groupBy(list, 'user');
    for (const key of Object.keys(attendance)) {
      let duration = 0;
      for (let i = 0; i < attendance[key].length - 1; i++) {
        console.log(attendance[key][i]);
        duration += dayjs
          .duration(
            dayjs(attendance[key][i].date).diff(
              dayjs(attendance[key][i + 1].date)
            ),
            'hour',
            true
          )
          .hours();
        console.log(duration);
      }
      await DailyAttendance.create({
        user: key,
        duration,
        onDate: yesterday.format('DD-MM-YYYY'),
      });
    }

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.use(express.static(path.join(__dirname, './attachments/')));

// cron job
cron.schedule('0 0 0 * * *', async () => {
  const now = dayjs();
  const yesterday = now.subtract(1, 'day');
  const groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  try {
    const list = await Attendance.find()
      .where({
        date: {
          $gte: new Date(yesterday.format('YYYY-MM-DD')),
          $lt: new Date(now.format('YYYY-MM-DD')),
        },
      })
      .sort({ date: -1 });

    const attendance = groupBy(list, 'user');
    for (const key of Object.keys(attendance)) {
      let duration = 0;
      for (let i = 0; i < attendance[key].length - 1; i++) {
        console.log(attendance[key][i]);
        duration += dayjs
          .duration(
            dayjs(attendance[key][i].date).diff(
              dayjs(attendance[key][i + 1].date)
            ),
            'hour',
            true
          )
          .hours();
        console.log(duration);
      }
      await DailyAttendance.create({
        user: key,
        duration,
        onDate: yesterday.format('DD-MM-YYYY'),
      });
    }

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Serve static assets in production

if (process.env.NODE_ENV === 'production') {
  // Set static folder

  app.use(express.static('client/build'));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
