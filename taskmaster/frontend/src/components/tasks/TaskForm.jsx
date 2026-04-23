import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/taskService';
import { Spinner } from '../common';
import MultiUserSelect from './MultiUserSelect';
import toast from 'react-hot-toast';

const defaultForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  assignedTo: [],
  isRecurring: false,
  pointValue: 10,
  tags: '',
  recurrence: {
    type: 'daily',
    interval: 1,
    autoReassign: true
  }
};

export default function TaskForm({ task, onSubmit, onCancel, loading }) {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo ? task.assignedTo.map(u => u._id || u) : [],
        isRecurring: task.isRecurring || false,
        pointValue: task.pointValue || 10,
        tags: task.tags?.join(', ') || '',
        recurrence: task.recurrence || defaultForm.recurrence
      });
    } else {
      setForm({ ...defaultForm, assignedTo: [user._id] });
    }
  }, [task, user._id]);

  useEffect(() => {
    userService.getList().then(({ data }) => {
      let userList = data.users || [];
      // Non-admin users can only see non-admin users in the assignment dropdown
      if (user.role !== 'admin') {
        userList = userList.filter(u => u.role !== 'admin');
      }
      setUsers(userList);
    }).catch((err) => {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load user list');
    });
  }, [user.role]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRecurrence = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      recurrence: { ...prev.recurrence, [name]: type === 'checkbox' ? checked : (name === 'interval' ? parseInt(value) : value) }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');

    // remove empty strings from assignedTo
    const validAssignees = form.assignedTo.filter(id => id.trim() !== '');

    const payload = {
      ...form,
      assignedTo: validAssignees,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      dueDate: form.dueDate || null,
      recurrence: form.isRecurring ? form.recurrence : undefined
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="label">Task Title *</label>
        <input name="title" value={form.title} onChange={handle} className="input" placeholder="What needs to be done?" required />
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handle} rows={3} className="input resize-none" placeholder="Add details..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Due Date */}
        <div>
          <label className="label">Due Date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handle} className="input" />
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority</label>
          <select name="priority" value={form.priority} onChange={handle} className="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Points */}
        <div>
          <label className="label">Point Value</label>
          <input type="number" name="pointValue" value={form.pointValue} onChange={handle} min="1" max="100" className="input" />
        </div>

        {/* Assign To (Dynamic Multi-Select) */}
        <div>
          <label className="label">Assign To</label>
          <MultiUserSelect
            users={users}
            selectedIds={form.assignedTo}
            onChange={(ids) => setForm(prev => ({ ...prev, assignedTo: ids }))}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
        <input name="tags" value={form.tags} onChange={handle} className="input" placeholder="design, dev, marketing..." />
      </div>

      {/* Recurring */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handle} className="w-4 h-4 rounded accent-brand-600" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Recurring Task</p>
            <p className="text-xs text-gray-400">Automatically resets after completion</p>
          </div>
        </label>

        {form.isRecurring && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Frequency</label>
                <select name="type" value={form.recurrence.type} onChange={handleRecurrence} className="input">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="label">Every N {form.recurrence.type === 'daily' ? 'days' : form.recurrence.type === 'weekly' ? 'weeks' : 'months'}</label>
                <input type="number" name="interval" value={form.recurrence.interval} onChange={handleRecurrence} min="1" max="30" className="input" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="autoReassign" checked={form.recurrence.autoReassign} onChange={handleRecurrence} className="w-4 h-4 rounded accent-brand-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-reassign at midnight (cron job)</span>
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 btn-primary">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
        </button>
      </div>
    </form>
  );
}
