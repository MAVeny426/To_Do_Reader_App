const express = require('express');
const ActivityLogRouter = express.Router();
const ActivityLog = require('../models/ActivityLog');

ActivityLogRouter.post('/add', async (req, res) => {
  try {
    const { action, user } = req.body;
    if (!action || !user) {
      return res.status(400).json({ message: 'Action and user are required' });
    }

    const newLog = new ActivityLog({ action, user });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add activity log', error: error.message });
  }
});
ActivityLogRouter.get('/latest', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(20);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
  }
});

module.exports = ActivityLogRouter;
