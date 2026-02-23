import { useState, useEffect } from 'react';
import { userService } from '../services/taskService';
import { Spinner, PriorityBadge, StatusBadge } from '../components/common';
import { format } from 'date-fns';
import { RiHistoryLine, RiStarLine } from 'react-icons/ri';

export default function ActivityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getActivity('me')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <RiHistoryLine className="w-6 h-6 text-brand-600" />
          Activity History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your recent tasks and points earned</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Points History */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <RiStarLine className="w-5 h-5 text-amber-400" />
              Points Earned
              <span className="ml-auto text-xl font-bold text-brand-600 dark:text-brand-400">{data?.user?.totalPoints || 0}</span>
            </h3>

            {!data?.user?.pointHistory?.length ? (
              <p className="text-gray-400 text-sm text-center py-8">No points yet. Complete tasks to earn!</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...data.user.pointHistory].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.taskTitle}</p>
                      <p className="text-xs text-gray-400">{format(new Date(entry.earnedAt), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    <span className="ml-3 text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 flex-shrink-0">
                      <RiStarLine className="w-3.5 h-3.5" />+{entry.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Tasks</h3>

            {!data?.recentActivity?.length ? (
              <p className="text-gray-400 text-sm text-center py-8">No tasks yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.recentActivity.map(task => (
                  <div key={task._id} className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {task.completedAt && (
                        <span className="text-xs text-gray-400">· {format(new Date(task.completedAt), 'MMM d')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
