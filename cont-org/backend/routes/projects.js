const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Project = require('../models/Project');
const upload = require('../middleware/upload');
const sendMail = require('../helper/mailer');
const Team = require('../models/Team');

// @route   GET api/projects
// @desc    Get a user's all project
// @access  Private
router.get('/:role', auth, async (req, res) => {
  try {
    let project = {};
    if (req.params.role === 'admin') {
      project = await Project.find({ reporter: req.user.id })
        .populate({ path: 'assignee', populate: { path: 'department' } })
        .populate('reporter', '-password')
        .sort({
          date: -1,
        });
    } else {
      project = await Project.find({ assignee: req.params.role })
        .populate({ path: 'assignee', populate: { path: 'department' } })
        .populate('reporter', '-password')
        .sort({
          date: -1,
        });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects
// @desc    Add new project
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.single('attachment'),
    [check('name', 'Name is required').not().isEmpty()],
  ],
  async (req, res) => {
    console.log({ file: req.file });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, assignee, startDate, endDate } = req.body;
    let attachment;
    if (req.file)
      attachment = {
        path: `${req.headers['origin']}${req.file.filename}`,
        name: req.file.originalname,
      };

    try {
      const newProject = new Project({
        name,
        description,
        assignee,
        startDate,
        endDate,
        attachment,
        reporter: req.user.id,
      });
      let project = await newProject.save();
      project = await Project.populate(project, {
        path: 'reporter',
        select: '-password',
      });
      project = await Project.populate(project, {
        path: 'assignee',
        populate: { path: 'department' },
      });

      const team = await Team.findOne({
        detail: project.assignee._id,
      }).populate({
        path: 'lead',
      });

      const mailData = {
        from: 'Cont-org',
        to: team?.lead?.email,
        subject: 'Project Assigned',
        text: `Hi, ${project?.assignee?.name}`,
        html: `<b>Project Name: ${project?.name} </b><br>Description: ${project?.description}
                 <br/>`,
        attachments: req.file
          ? [
              {
                filename: project?.attachment?.name,
                path: project?.attachment?.path,
              },
            ]
          : undefined,
      };

      await sendMail(mailData);
      res.json({ data: project, message: 'Project added' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', [auth, upload.single('attachment')], async (req, res) => {
  const { name, assignee, status, description, startDate, endDate, team } =
    req.body;
  // Build project object
  const projectFields = {};
  try {
    let project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Make sure user owns project
    if (req.user.id?.toString() === project.toObject().reporter?.toString()) {
      if (name) projectFields.name = name;
      if (assignee) projectFields.assignee = assignee;
      if (description) projectFields.description = description;
      if (startDate) projectFields.startDate = startDate;
      if (endDate) projectFields.endDate = endDate;
      if (req.file)
        projectFields.attachment = {
          path: `${req.headers['origin']}${req.file.filename}`,
          name: req.file.originalname,
        };
    } else if (team?.toString() === project.toObject().assignee?.toString()) {
      if (status) projectFields.status = status;
      if (status === 'Completed') {
        projectFields.completedAt = Date.now();
        if (req.file)
          projectFields.deliveryAttachment = {
            path: `${req.headers['origin']}${req.file.filename}`,
            name: req.file.originalname,
          };
      } else {
        projectFields.completedAt = null;
        projectFields.deliveryAttachment = undefined;
      }
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    )
      .populate('reporter', '-password')
      .populate({ path: 'assignee', populate: { path: 'department' } });

    // project = await Project.populate(project, {
    //   path: 'reporter',
    //   select: '-password',
    // });
    // project = await Project.populate(project, {
    //   path: 'assignee',
    //   select: '-password',
    // });

    res.json({ data: project, message: 'Project updated' });
  } catch (err) {
    console.error(err.message, { err });
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Make sure user owns project
    if (project.reporter.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Project.findByIdAndRemove(req.params.id);

    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
