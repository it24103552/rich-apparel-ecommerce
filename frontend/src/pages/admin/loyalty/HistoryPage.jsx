import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { activitiesService } from "../../../services/activities.service";
import { Spinner } from "../../../components/common/Spinner";
import { Pagination } from "../../../components/common/Pagination";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const PAGE_SIZE = 12;

const ActivityIcon = ({ type, action }) => {
    if (type === 'ALERT') {
        if (action === 'LOW_STOCK') return <span className="material-symbols-outlined text-[18px]">warning</span>;
        if (action === 'RESTOCK') return <span className="material-symbols-outlined text-[18px]">inventory_2</span>;
        return <span className="material-symbols-outlined text-[18px]">notifications</span>;
    }

    if (action?.includes('CREATE')) return <span className="material-symbols-outlined text-[18px]">add</span>;
    if (action?.includes('UPDATE')) return <span className="material-symbols-outlined text-[18px]">edit</span>;
    if (action?.includes('DELETE')) return <span className="material-symbols-outlined text-[18px]">delete</span>;

    return <span className="material-symbols-outlined text-[18px]">history</span>;
};

const getActionColor = (type, action) => {
    if (type === 'ALERT') {
        if (action === 'LOW_STOCK') return "bg-amber-50 text-amber-800 border-amber-200";
        if (action === 'RESTOCK') return "bg-emerald-50 text-emerald-800 border-emerald-200";
        return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (action?.includes('CREATE')) return "bg-indigo-50 text-indigo-800 border-indigo-200";
    if (action?.includes('UPDATE')) return "bg-[#F1ECE5] text-[#292929] border-[#E4DED6]";
    if (action?.includes('DELETE')) return "bg-red-50 text-red-700 border-red-200";
    return "bg-[#FAF8F5] text-[#5f5a53] border-[#E4DED6]";
};

export const HistoryPage = () => {
    const { user } = useAuth();
    const userRole = user?.role?.toLowerCase() || '';
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || "";

    const [activities, setActivities] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Clear history states
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);

    // Reset pagination when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const skip = (page - 1) * PAGE_SIZE;
            const response = await activitiesService.getAll(skip, PAGE_SIZE, searchTerm, userRole);
            setActivities(response.data.data.activities || []);
            setTotal(response.data.data.total || 0);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteActivity = async (id) => {
        try {
            await activitiesService.deleteById(id);
            setActivities(prev => prev.filter(act => act.id !== id));
            setTotal(prev => Math.max(0, prev - 1));
            toast.success("Activity record deleted");
        } catch (error) {
            toast.error("Failed to delete record");
        }
    };

    const handleClearHistory = async () => {
        setClearing(true);
        try {
            await activitiesService.clearAll(userRole);
            toast.success("Activity ledger cleared successfully");
            setActivities([]);
            setTotal(0);
            setPage(1);
            setShowClearConfirm(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to clear history");
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [page, searchTerm]);

    return (
        <div className="min-h-[calc(100vh-120px)] flex flex-col space-y-6 pb-8 animate-fade-in text-[#171717]">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={activities.length === 0}
                    className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-[13px] font-headline font-semibold text-red-700 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                >
                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    Clear History
                </button>
                <button
                    onClick={fetchActivities}
                    className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-white border border-[#E4DED6] text-[13px] font-headline font-semibold text-[#171717] rounded-2xl hover:bg-[#F1ECE5] transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Central List Container */}
            <div className="admin-card rounded-[24px] flex-1 min-h-0 flex flex-col overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-3">
                        <Spinner dark={false} color="black" size="md" />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#77736E]">Loading activity ledger...</span>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 px-6 text-center">
                        <div className="w-16 h-16 bg-[#F1ECE5] rounded-full flex items-center justify-center mb-4 border border-[#E4DED6]">
                            <span className="material-symbols-outlined text-3xl text-[#77736E]">history</span>
                        </div>
                        <h3 className="text-lg font-headline font-bold text-[#171717] mb-1">No activities logged</h3>
                        <p className="text-[#77736E] text-sm max-w-sm">
                            System events and administrative actions will appear here once they occur.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 md:p-6 space-y-2.5 overflow-y-auto custom-scrollbar">
                        {activities.map((activity) => (
                            <div key={activity.id} className="p-4 sm:p-5 rounded-[18px] bg-[#FAF8F5] border border-[#E4DED6] hover:bg-white hover:border-[#D6CDBF] hover:shadow-[0_4px_16px_rgba(23,23,23,0.05)] flex flex-col sm:flex-row gap-4 transition-all group">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${getActionColor(activity.type, activity.action)}`}>
                                        <ActivityIcon type={activity.type} action={activity.action} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Action Message */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="font-headline font-bold text-[#171717] text-sm sm:text-[15px] truncate">
                                                {activity.message}
                                            </span>
                                        </div>

                                        {/* Meta data */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#77736E] font-medium">
                                            {activity.userName && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">person</span>
                                                    {activity.userName} <span className="font-normal text-[#8a857d] ml-0.5">({activity.roleName || 'STAFF'})</span>
                                                </span>
                                            )}
                                            {activity.userName && activity.targetName && (
                                                <div className="w-[3px] h-[3px] rounded-full bg-[#C9A77A]" />
                                            )}
                                            {activity.targetName && (
                                                <span className="flex items-center gap-1.5 truncate max-w-[150px] sm:max-w-xs">
                                                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                                    {activity.targetName}
                                                </span>
                                            )}
                                        </div>

                                        {/* Optional Extra Details */}
                                        {activity.details && Object.keys(activity.details).length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {Object.entries(activity.details).map(([key, value]) => {
                                                    if (key === 'changes') return null;
                                                    const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                                    return (
                                                        <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white text-[#292929] text-[11px] font-mono border border-[#E4DED6]">
                                                            <span className="text-[#8a857d] mr-1">{key}:</span> {displayVal}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamps & Actions */}
                                <div className="sm:text-right flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-3 sm:pt-0 border-t sm:border-0 border-[#E4DED6] mt-1 sm:mt-0 relative w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-none">
                                        <span className="text-xs font-mono font-medium text-[#292929] block">
                                            {dayjs(activity.createdAt).format('MMM D, YYYY · h:mm A')}
                                        </span>
                                        <span className="text-[11px] text-[#8a857d] mt-1 capitalize block">
                                            {dayjs(activity.createdAt).fromNow()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteActivity(activity.id); }}
                                        className="sm:mt-2.5 text-[#77736E] hover:text-red-600 transition-colors p-1.5 rounded-xl hover:bg-red-50"
                                        title="Delete Record"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Pagination Container */}
            {!loading && activities.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-[#E4DED6] rounded-[22px] px-6 py-4 gap-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
                    <span className="text-sm text-[#77736E]">
                        Showing <span className="font-semibold text-[#171717]">{activities.length}</span> of <span className="font-semibold text-[#171717]">{total}</span> records
                    </span>
                    <div>
                        <Pagination
                            dark={false}
                            currentPage={page}
                            totalPages={Math.ceil(total / PAGE_SIZE)}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            )}

            {/* Clear History Confirmation */}
            <ConfirmDialog
                dark={false}
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearHistory}
                title="Wipe Activity Ledger"
                message="Are you sure you want to completely erase the entire activity history? This action is permanent and cannot be undone."
                loading={clearing}
                isDanger={true}
                confirmText="Erase All Data"
            />
        </div>
    );
};
