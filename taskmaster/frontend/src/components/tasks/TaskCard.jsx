import { useState } from 'react';
import { format, isPast } from 'date-fns';
import {
  RiCheckboxCircleLine, RiCheckboxBlankCircleLine, RiEditLine,
  RiDeleteBinLine, RiCalendarLine, RiRepeatLine, RiStarLine
} from 'react-icons/ri';
import { PriorityBadge, StatusBadge, ConfirmModal } from '../common';

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(task._id);
    setToggling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task._id);
    setDeleting(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className={`card p-5 group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isCompleted ? 'opacity-70' : ''} animate-fade-in`}>
        <div className="flex items-start gap-3">
          {/* Toggle button */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`mt-0.5 flex-shrink-0 transition-colors duration-200 ${
              isCompleted
                ? 'text-emerald-500 hover:text-emerald-600'
                : 'text-gray-300 hover:text-brand-500 dark:text-gray-600'
            } disabled:opacity-50`}
          >
            {isCompleted
              ? <RiCheckboxCircleLine className="w-6 h-6" />
              : <RiCheckboxBlankCircleLine className="w-6 h-6" />
            }
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold text-gray-900 dark:text-white leading-snug ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                {task.title}
              </h3>
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-600 transition-colors"
                >
                  <RiEditLine className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <RiDeleteBinLine className="w-4 h-4" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{task.description}</p>
            )}

            <div className="flex items-center flex-wrap gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />

              {task.dueDate && (
                <span className={`badge ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  <RiCalendarLine className="w-3 h-3 mr-1 inline" />
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {isOverdue && ' · Overdue'}
                </span>
              )}

              {task.isRecurring && (
                <span className="badge bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <RiRepeatLine className="w-3 h-3 mr-1 inline" />
                  {task.recurrence?.type}
                </span>
              )}

              {isCompleted && task.pointsAwarded && (
                <span className="badge bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <RiStarLine className="w-3 h-3 mr-1 inline" />
                  +{task.pointValue} pts
                </span>
              )}
            </div>

            {/* Assigned to */}
            {task.assignedTo && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                {task.assignedTo.avatar ? (
                  <img src={task.assignedTo.avatar} className="w-5 h-5 rounded-full" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {task.assignedTo.name?.[0]}
                  </div>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">{task.assignedTo.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      />
    </>
  );
}
