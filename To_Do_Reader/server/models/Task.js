const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ['Todo', 'in-progress', 'done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  assignedUser: String,
  createdBy: String,
  dueDate: String,

  comments: [
    {
      text: String,
      user: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


module.exports = mongoose.model('Task', taskSchema);
