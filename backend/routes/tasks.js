const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const sendMail = require('../helper/mailer');

const Task = require('../models/Task');
const upload = require('../middleware/upload');

// @route   GET api/tasks
// @desc    Get a user's all task
// @access  Private
router.get('/:role', auth, async (req, res) => {
  try {
    let task = {};
    if (!req.params.role) {
      task = await Task.find({})
        .populate('assignee', '-password')
        .populate('reporter', '-password')
        .populate('project', '_id name')
        .sort({
          date: -1,
        });
    } else if (req.params.role === 'Lead') {
      task = await Task.find({ reporter: req.user.id })
        .populate('assignee', '-password')
        .populate('reporter', '-password')
        .populate('project', '_id name')
        .sort({
          date: -1,
        });
    } else {
      task = await Task.find({ assignee: req.user.id })
        .populate('assignee', '-password')
        .populate('reporter', '-password')
        .populate('project', '_id name')
        .sort({
          date: -1,
        });
    }
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Add new task
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.single('attachment'),
    check('name', 'Name is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, assignee, startDate, endDate, project } =
      req.body;

    let attachment;
    if (req.file)
      attachment = {
        path: `${req.headers['origin']}${req.file.filename}`,
        name: req.file.originalname,
      };

    try {
      const newTask = new Task({
        name,
        description,
        assignee,
        startDate,
        endDate,
        project,
        attachment,
        reporter: req.user.id,
      });
      let task = await newTask.save();
      task = await Task.populate(task, {
        path: 'reporter',
        select: '-password',
      });
      task = await Task.populate(task, {
        path: 'assignee',
        select: '-password',
      });
      task = await Task.populate(task, {
        path: 'project',
        select: '_id name',
      });

      const mailData = {
        from: 'Cont-org',
        to: task?.assignee?.email,
        subject: 'Task Assigned',
        text: `Hi, ${task?.assignee?.name}`,
        html: `<b>Task Name: ${task?.name} </b><br>Description: ${task?.description}
                 <br/>`,
        attachments: req.file
          ? [
              {
                filename: task?.attachment?.name,
                path: task?.attachment?.path,
              },
            ]
          : undefined,
      };
      await sendMail(mailData);
      res.json({ data: task, message: 'Task added' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', [auth, upload.single('attachment')], async (req, res) => {
  const { name, assignee, status, description, startDate, endDate, project } =
    req.body;
  // Build task object
  const taskFields = {};

  try {
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Make sure user owns task
    if (req.user.id?.toString() === task.toObject().reporter?.toString()) {
      if (name) taskFields.name = name;
      if (assignee) taskFields.assignee = assignee;
      if (description) taskFields.description = description;
      if (startDate) taskFields.startDate = startDate;
      if (endDate) taskFields.endDate = endDate;
      if (project) taskFields.project = project;
      if (req.file)
        taskFields.attachment = {
          path: `${req.headers['origin']}${req.file.filename}`,
          name: req.file.originalname,
        };
    } else if (
      req.user.id?.toString() === task.toObject().assignee?.toString()
    ) {
      if (status) taskFields.status = status;
      if (status === 'Completed') {
        taskFields.completedAt = Date.now();
        if (req.file)
          taskFields.deliveryAttachment = {
            path: `${req.headers['origin']}${req.file.filename}`,
            name: req.file.originalname,
          };
      } else {
        taskFields.completedAt = null;
        taskFields.deliveryAttachment = undefined;
      }
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: taskFields },
      { new: true }
    )
      .populate('reporter', '-password')
      .populate('assignee', '-password')
      .populate('project', '_id name');

    // task = await Task.populate(task, {
    //   path: 'reporter',
    //   select: '-password',
    // });
    // task = await Task.populate(task, {
    //   path: 'assignee',
    //   select: '-password',
    // });

    res.json({ data: task, message: 'Task updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Make sure user owns task
    if (task.reporter.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Task.findByIdAndRemove(req.params.id);

    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
