const mongoose = require('mongoose');

const recurrenceSchema = new mongoose.Schema({
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  interval: { type: Number, default: 1, min: 1 },
  autoReassign: { type: Boolean, default: true },
  lastCompletedAt: { type: Date }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRecurring: { type: Boolean, default: false },
  recurrence: { type: recurrenceSchema },
  pointsAwarded: { type: Boolean, default: false },
  pointValue: { type: Number, default: 10 },
  tags: [{ type: String }],
  completedAt: { type: Date }
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ isRecurring: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
