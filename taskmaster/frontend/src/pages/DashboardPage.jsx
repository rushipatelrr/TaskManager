import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { StatCard, Spinner, SkeletonCard } from '../components/common';
import { format } from 'date-fns';
import { RiTrophyLine, RiStarLine } from 'react-icons/ri';

const priorityColors = { low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          taskService.getStats(),
          taskService.getTasks({ limit: 5, page: 1 })
        ]);
        setStats(statsRes.data);
        setRecentTasks(tasksRes.data.tasks);
      } catch (e) {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isAdmin ? (
        <AdminDashboard stats={stats} />
      ) : (
        <UserDashboard stats={stats} user={user} recentTasks={recentTasks} />
      )}
    </div>
  );
}

function UserDashboard({ stats, user, recentTasks }) {
  const completionRate = stats?.stats?.total > 0
    ? Math.round((stats?.stats?.completed / stats?.stats?.total) * 100)
    : 0;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats?.stats?.total} icon="📋" color="blue" />
        <StatCard title="Completed" value={stats?.stats?.completed} icon="✅" color="green" />
        <StatCard title="Pending" value={stats?.stats?.pending} icon="⏳" color="amber" />
        <StatCard title="Points Earned" value={user?.totalPoints || 0} icon="⭐" color="purple" subtitle="Keep completing tasks!" />
      </div>

      {/* Progress bar */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Completion Rate</h3>
          <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{completionRate}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{stats?.stats?.completed} of {stats?.stats?.total} tasks completed</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No tasks yet. Create your first one!</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{task.status}</p>
                  </div>
                  {task.status === 'completed' && (
                    <RiStarLine className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Point History */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Points History</h3>
          {!stats?.stats?.pointHistory?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">Complete tasks to earn points!</p>
          ) : (
            <div className="space-y-3">
              {stats.stats.pointHistory.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.taskTitle}</p>
                    <p className="text-xs text-gray-400">{format(new Date(entry.earnedAt), 'MMM d, h:mm a')}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 ml-3">+{entry.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AdminDashboard({ stats }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats?.stats?.totalTasks} icon="📋" color="blue" />
        <StatCard title="Completed" value={stats?.stats?.completedTasks} icon="✅" color="green" />
        <StatCard title="Pending" value={stats?.stats?.pendingTasks} icon="⏳" color="amber" />
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RiTrophyLine className="w-5 h-5 text-amber-500" />
          User Leaderboard
        </h3>
        <div className="space-y-3">
          {stats?.leaderboard?.slice(0, 10).map((u, i) => (
            <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
              }`}>{i + 1}</span>
              {u.avatar
                ? <img src={u.avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name[0]}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                <RiStarLine className="w-3.5 h-3.5 text-amber-400" />
                {u.totalPoints}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
