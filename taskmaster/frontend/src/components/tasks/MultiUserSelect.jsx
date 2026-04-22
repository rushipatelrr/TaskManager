import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiAddLine, RiCloseLine, RiArrowDownSLine } from 'react-icons/ri';

const CustomUserDropdown = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const [dropdownRect, setDropdownRect] = useState(null);

    const selectedUser = options.find(o => o._id === value);

    const toggleDropdown = () => {
        if (!isOpen && triggerRef.current) {
            setDropdownRect(triggerRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleScroll = (e) => {
            // Close dropdown if scrolling outside of it
            if (isOpen && e.target && !e.target.closest('.portal-dropdown')) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    return (
        <div className="relative flex-1">
            <div
                ref={triggerRef}
                className="input w-full flex items-center justify-between cursor-pointer bg-white dark:bg-gray-800 min-h-[42px]"
                onClick={toggleDropdown}
            >
                <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                    {selectedUser ? (
                        <>
                            {selectedUser.avatar ? (
                                <img src={selectedUser.avatar} className="w-5 h-5 rounded-full shrink-0" alt="" />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                    {selectedUser.name?.[0]}
                                </div>
                            )}
                            <span className="truncate text-gray-900 dark:text-gray-100 text-sm font-medium">
                                {selectedUser.name} {selectedUser.email ? `(${selectedUser.email})` : ''}
                            </span>
                        </>
                    ) : (
                        <span className="text-gray-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <RiArrowDownSLine className={`w-4 h-4 text-gray-500 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && dropdownRect && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-[200px] overflow-y-auto custom-scrollbar portal-dropdown"
                        style={{
                            top: dropdownRect.bottom + 4,
                            left: dropdownRect.left,
                            width: dropdownRect.width
                        }}
                    >
                        {options.map(opt => (
                            <div
                                key={opt._id}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                                onClick={() => {
                                    onChange(opt._id);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.avatar ? (
                                    <img src={opt.avatar} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {opt.name?.[0]}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                    {opt.name} {opt.email ? `(${opt.email})` : ''}
                                </span>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="p-3 text-sm text-gray-500 text-center">No users available</div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default function MultiUserSelect({ users = [], selectedIds = [], onChange }) {
    // Add an empty slot
    const handleAddSlot = () => {
        if (!selectedIds.includes('')) {
            onChange([...selectedIds, '']);
        }
    };

    // Remove a slot at index
    const handleRemoveSlot = (index) => {
        const nextIds = [...selectedIds];
        nextIds.splice(index, 1);
        onChange(nextIds);
    };

    // Change a slot
    const handleChangeSlot = (index, value) => {
        const nextIds = [...selectedIds];
        nextIds[index] = value;
        onChange(nextIds);
    };

    // derived state
    const availableUsers = users.filter(u => !selectedIds.includes(u._id));
    const canAddMore = availableUsers.length > 0 && !selectedIds.includes('');

    return (
        <div className="space-y-3 animate-fade-in">
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {selectedIds.map((id, index) => {
                    const options = users.filter(u => u._id === id || !selectedIds.includes(u._id));

                    return (
                        <div key={index} className="flex items-center gap-2 transition-all">
                            <CustomUserDropdown
                                value={id}
                                onChange={(val) => handleChangeSlot(index, val)}
                                options={options}
                                placeholder="Select User..."
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveSlot(index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                title="Remove Assignee"
                            >
                                <RiCloseLine className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                disabled={!canAddMore}
                onClick={handleAddSlot}
                className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <RiAddLine className="w-4 h-4" />
                Add Assignee
            </button>
        </div>
    );
}
