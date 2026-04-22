import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';
import {
  RiShieldLine, RiUserLine, RiSearchLine, RiFilterLine,
  RiArrowLeftSLine, RiArrowRightSLine, RiGroupLine,
  RiShieldCheckLine, RiUserFollowLine, RiUserUnfollowLine,
  RiCheckboxCircleLine, RiCloseCircleLine, RiRefreshLine
} from 'react-icons/ri';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: pagination.limit
      });
      setUsers(data.users);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, pagination.limit]);

  useEffect(() => { fetchUsers(); }, [roleFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const toggleRole = async (userId, currentRole) => {
    // Prevent self-demotion
    if (userId === currentUser._id && currentRole === 'admin') {
      return toast.error('You cannot demote your own account');
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionLoading(userId + 'role');
    try {
      const { data } = await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    // Prevent self-deactivation
    if (userId === currentUser._id && currentStatus) {
      return toast.error('You cannot deactivate your own account');
    }
    const newStatus = !currentStatus;
    setActionLoading(userId + 'status');
    try {
      const { data } = await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/50`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RiShieldCheckLine className="w-6 h-6 text-brand-500" />
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Manage users, roles, and access control
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 transition-colors"
          title="Refresh"
        >
          <RiRefreshLine className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={RiGroupLine} label="Total Users" value={summary.totalUsers} color="bg-brand-500" />
        <StatCard icon={RiShieldLine} label="Admins" value={summary.totalAdmins} color="bg-amber-500" />
        <StatCard icon={RiUserFollowLine} label="Active" value={summary.totalActive} color="bg-emerald-500" />
        <StatCard icon={RiUserUnfollowLine} label="Inactive" value={summary.totalInactive} color="bg-red-500" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-full"
            placeholder="Search by name or email..."
          />
        </form>
        <div className="flex gap-2">
          <div className="relative">
            <RiFilterLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input pl-9 pr-8 appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input appearance-none cursor-pointer min-w-[130px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Points</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u._id === currentUser._id;
                  return (
                    <tr key={u._id} className={`border-b last:border-0 border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar
                            ? <img src={u.avatar} className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
                            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name[0]}</div>
                          }
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {u.name}
                              {isSelf && <span className="text-xs text-brand-500 ml-1.5">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {u.role === 'admin' ? <RiShieldLine className="w-3 h-3" /> : <RiUserLine className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 hidden sm:table-cell text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.isActive
                            ? <><RiCheckboxCircleLine className="w-3 h-3" /> Active</>
                            : <><RiCloseCircleLine className="w-3 h-3" /> Inactive</>
                          }
                        </span>
                      </td>

                      {/* Points */}
                      <td className="px-5 py-4 hidden sm:table-cell text-right">
                        <span className="font-bold text-gray-900 dark:text-white">{u.totalPoints}</span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRole(u._id, u.role)}
                            disabled={actionLoading === u._id + 'role' || isSelf}
                            title={isSelf ? 'Cannot change own role' : (u.role === 'admin' ? 'Demote to User' : 'Promote to Admin')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.role === 'admin'
                                ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {actionLoading === u._id + 'role'
                              ? <Spinner size="sm" />
                              : (u.role === 'admin' ? 'Make User' : 'Make Admin')
                            }
                          </button>
                          <button
                            onClick={() => toggleStatus(u._id, u.isActive)}
                            disabled={actionLoading === u._id + 'status' || isSelf}
                            title={isSelf ? 'Cannot change own status' : (u.isActive ? 'Deactivate User' : 'Activate User')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {actionLoading === u._id + 'status'
                              ? <Spinner size="sm" />
                              : (u.isActive ? 'Deactivate' : 'Activate')
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-16 text-center text-gray-400">No users found</div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RiArrowLeftSLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                      <button
                        onClick={() => fetchUsers(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? 'bg-brand-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))
                }
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RiArrowRightSLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
