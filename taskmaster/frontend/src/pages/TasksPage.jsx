import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/tasks/TaskCard';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskForm from '../components/tasks/TaskForm';
import { Modal, EmptyState, SkeletonCard } from '../components/common';
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';

export default function TasksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const { tasks, loading, pagination, filters, setFilters, toggleTask, deleteTask, createTask, updateTask } = useTasks();

  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editingTask) {
        await updateTask(editingTask._id, data);
      } else {
        await createTask(data);
      }
      closeModal();
    } catch (error) {
      console.error('Task form submission failed:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFilterChange = (updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters({ page: 1, limit: 10 });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {pagination.total || 0} tasks total
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <RiAddLine className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Role View Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-2">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!filters.roleView ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleFilterChange({ roleView: undefined, page: 1 })}
        >
          All Relevant
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filters.roleView === 'assigned' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleFilterChange({ roleView: 'assigned', page: 1 })}
        >
          Assigned To Me
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filters.roleView === 'created' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleFilterChange({ roleView: 'created', page: 1 })}
        >
          Created By Me
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TaskFilters filters={filters} onChange={handleFilterChange} onReset={resetFilters} />
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No tasks found"
          description="Create your first task or adjust your filters."
          action={<button onClick={openCreate} className="btn-primary">Create Task</button>}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onToggle={toggleTask}
              onEdit={openEdit}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={pagination.page <= 1}
            onClick={() => handleFilterChange({ page: pagination.page - 1 })}
            className="btn-secondary px-3 py-2 disabled:opacity-40"
          >
            <RiArrowLeftLine className="w-4 h-4" />
          </button>

          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handleFilterChange({ page: i + 1 })}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${pagination.page === i + 1
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handleFilterChange({ page: pagination.page + 1 })}
            className="btn-secondary px-3 py-2 disabled:opacity-40"
          >
            <RiArrowRightLine className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
