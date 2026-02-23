import { useState, useEffect } from 'react';
import { userService } from '../services/taskService';
import { Spinner, ConfirmModal } from '../components/common';
import toast from 'react-hot-toast';
import { RiShieldLine, RiUserLine, RiToggleLine, RiToggleFill, RiSearchLine } from 'react-icons/ri';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await userService.getAll({ search: q, limit: 50 });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionLoading(userId + 'role');
    try {
      const { data } = await userService.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(`Role updated to ${newRole}`);
    } catch { toast.error('Failed to update role'); }
    finally { setActionLoading(null); }
  };

  const toggleStatus = async (userId) => {
    setActionLoading(userId + 'status');
    try {
      const { data } = await userService.toggleStatus(userId);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(data.message);
    } catch { toast.error('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-6 max-w-md">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
          placeholder="Search by name or email..."
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Points</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b last:border-0 border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar
                        ? <img src={u.avatar} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                        : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name[0]}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {!u.isActive && (
                        <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs ml-1">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`badge ${u.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {u.role === 'admin' ? <RiShieldLine className="w-3 h-3 mr-1 inline" /> : <RiUserLine className="w-3 h-3 mr-1 inline" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{u.totalPoints}</span>
                    <span className="text-xs text-gray-400 ml-1">pts</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleRole(u._id, u.role)}
                        disabled={actionLoading === u._id + 'role'}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === u._id + 'role' ? <Spinner size="sm" /> : (u.role === 'admin' ? 'Make User' : 'Make Admin')}
                      </button>
                      <button
                        onClick={() => toggleStatus(u._id)}
                        disabled={actionLoading === u._id + 'status'}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                      >
                        {u.isActive ? <RiToggleFill className="w-5 h-5" /> : <RiToggleLine className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-16 text-center text-gray-400">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
