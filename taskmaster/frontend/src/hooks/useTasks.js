import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';

export const useTasks = (initialFilters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ page: 1, limit: 10, ...initialFilters });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await taskService.getTasks(filters);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (id) => {
    try {
      const { data } = await taskService.toggleTask(id);
      setTasks(prev => prev.map(t => t._id === id ? data.task : t));
      toast.success(data.message);
      return data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const createTask = async (taskData) => {
    try {
      const { data } = await taskService.createTask(taskData);
      setTasks(prev => [data.task, ...prev]);
      toast.success('Task created!');
      return data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const { data } = await taskService.updateTask(id, taskData);
      setTasks(prev => prev.map(t => t._id === id ? data.task : t));
      toast.success('Task updated!');
      return data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  return {
    tasks, loading, pagination, filters,
    setFilters, fetchTasks,
    toggleTask, deleteTask, createTask, updateTask
  };
};
