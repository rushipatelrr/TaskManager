import { useState } from 'react';
import { RiSearchLine, RiFilterLine, RiRefreshLine } from 'react-icons/ri';

export default function TaskFilters({ filters, onChange, onReset }) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e) => {
    e.preventDefault();
    onChange({ search, page: 1 });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10 pr-4"
          placeholder="Search tasks..."
        />
      </form>

      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={e => onChange({ status: e.target.value || undefined, page: 1 })}
        className="input w-full sm:w-36"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority || ''}
        onChange={e => onChange({ priority: e.target.value || undefined, page: 1 })}
        className="input w-full sm:w-36"
      >
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      {/* Recurring filter */}
      <select
        value={filters.isRecurring !== undefined ? String(filters.isRecurring) : ''}
        onChange={e => onChange({ isRecurring: e.target.value === '' ? undefined : e.target.value, page: 1 })}
        className="input w-full sm:w-36"
      >
        <option value="">All Types</option>
        <option value="true">Recurring</option>
        <option value="false">One-time</option>
      </select>

      {/* Reset */}
      <button onClick={onReset} className="btn-secondary flex-shrink-0">
        <RiRefreshLine className="w-4 h-4" />
        Reset
      </button>
    </div>
  );
}
