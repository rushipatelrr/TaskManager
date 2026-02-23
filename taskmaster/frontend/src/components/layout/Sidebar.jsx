import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  RiDashboardLine, RiTaskLine, RiTrophyLine, RiTeamLine,
  RiLogoutBoxLine, RiMoonLine, RiSunLine, RiUserLine,
  RiShieldLine, RiHistoryLine
} from 'react-icons/ri';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <RiTaskLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-none">TaskMaster</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Level up daily</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 px-2">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${user?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {user?.role === 'admin' ? (
                <RiShieldLine className="w-3 h-3 text-amber-500" />
              ) : (
                <RiUserLine className="w-3 h-3 text-brand-500" />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Points badge */}
        <div className="mt-3 mx-2 px-3 py-2 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-xl border border-brand-100 dark:border-brand-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Points</span>
            <div className="flex items-center gap-1">
              <RiTrophyLine className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{user?.totalPoints || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Main</p>
        <NavItem to="/dashboard" icon={RiDashboardLine} label="Dashboard" />
        <NavItem to="/tasks" icon={RiTaskLine} label="My Tasks" />
        <NavItem to="/leaderboard" icon={RiTrophyLine} label="Leaderboard" />
        <NavItem to="/activity" icon={RiHistoryLine} label="Activity" />

        {user?.role === 'admin' && (
          <>
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-4 mb-2">Admin</p>
            <NavItem to="/admin/users" icon={RiTeamLine} label="Users" />
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
        <button
          onClick={toggle}
          className="sidebar-link w-full"
        >
          {isDark ? <RiSunLine className="w-5 h-5" /> : <RiMoonLine className="w-5 h-5" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
          <RiLogoutBoxLine className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
