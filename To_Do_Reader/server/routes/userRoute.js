const express = require("express");
const userRouter = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const auth=require('../middleware/authMiddleware')

userRouter.post('/createtask', async (req, res) => {
  try {
    const task = new Task(req.body);
    const savedTask = await task.save();
    const io = req.app.get('io');
    if (io) {
      io.emit('taskCreated', task);
    }
    res.status(201).json(savedTask);
  } catch (err) {
    console.error(' Error creating task:', err.message, err.errors || '');
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

userRouter.get('/gettasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

userRouter.put('/update/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { originalLastModified, ...updateFields } = req.body;

    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateFields,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or failed to update.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('taskUpdated', updatedTask);
    }

    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});


userRouter.delete('/delete/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    if (io) {
      io.emit('taskDeleted', req.params.id);
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete task' });
  }
});

userRouter.post('/comment/:taskId', async (req, res) => {
  const { text, user } = req.body;
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.comments.push({ text, user });
    const updated = await task.save();

    const io = req.app.get('io'); 
    if (io) {
      io.emit('newComment', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

userRouter.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

userRouter.get('/mycompleted',auth , async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user.id).select('email');
    if (!loggedInUser || !loggedInUser.email) {
      return res.status(400).json({ msg: 'User email not found for authenticated user.' });
    }

    const userEmail = loggedInUser.email;

    const completedTasks = await Task.find({
      assignedUser: { $regex: new RegExp(`^${userEmail}$`, 'i') },
      completed: true
    }).sort({ updatedAt: -1 });

    res.json(completedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = userRouter;