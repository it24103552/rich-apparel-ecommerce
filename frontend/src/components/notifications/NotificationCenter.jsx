import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { notificationsService } from "../../services";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Trash2, CheckCircle2, AlertCircle, ShoppingBag, Info, Store, RefreshCw, PenSquare, Bell } from "lucide-react";

dayjs.extend(relativeTime);

// `dark` only restyles the bell trigger for the dark admin theme; behaviour is unchanged.
// `light` is a presentation-only flag for the warm light theme (Product Management).
export const NotificationCenter = ({ dark = false, light = false }) => {
    const { user } = useAuth();
    const userRole = user?.role?.toLowerCase() || '';
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const processedIds = useRef(new Set()); // Track notification IDs to avoid duplicate toasts

    const fetchNotifications = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const res = await notificationsService.getNotifications(userRole);
            const list = res.data.data.notifications || [];

            // Check for new notifications to trigger alerts
            if (!isInitial && list.length > 0) {
                list.forEach(n => {
                    if (!n.isRead && !processedIds.current.has(n.id)) {
                        // Trigger toast for new unread notification
                        toast.custom((t) => (
                            <div className={`${t.visible ? 'animate-fade-in' : 'opacity-0'} max-w-md w-full bg-[#141414] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-white ring-opacity-5 border border-white/[0.06] transition-all duration-300`}>
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                                                <Bell className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">
                                                {n.title}
                                            </p>
                                            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-l border-white/[0.06]">
                                    <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-black text-neutral-500 hover:text-white focus:outline-none transition-colors uppercase tracking-widest"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ), { duration: 6000 });
                    }
                    processedIds.current.add(n.id);
                });
            } else if (isInitial) {
                // On initial load, mark all existing IDs as processed
                list.forEach(n => processedIds.current.add(n.id));
            }

            setNotifications(list);
            setUnreadCount(list.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(true);

        // Poll for new notifications every 10 seconds for real-time feel
        const interval = setInterval(() => fetchNotifications(false), 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read:", id);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllAsRead(userRole);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationsService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id && !n.isRead)) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to delete notification:", id);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'RESTOCK_REQUEST': return <RefreshCw className="w-5 h-5 text-orange-400" />;
            case 'NEW_SUPPLIER': return <Store className="w-5 h-5 text-emerald-400" />;
            case 'SUPPLIER_UPDATE': return <PenSquare className="w-5 h-5 text-blue-400" />;
            case 'LOW_STOCK': return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'RESTOCK': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'NEW_ORDER': return <ShoppingBag className="w-5 h-5 text-blue-400" />;
            case 'RETURN_REQUEST': return <RefreshCw className="w-5 h-5 text-red-400" />;
            case 'REVIEW': return <PenSquare className="w-5 h-5 text-yellow-400" />;
            case 'LOYALTY': return <CheckCircle2 className="w-5 h-5 text-indigo-400" />;
            default: return <Info className="w-5 h-5 text-neutral-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all group ${light ? "bg-white border border-[#E4DED6] hover:bg-[#F1ECE5]" : dark ? "hover:bg-white/[0.08]" : "hover:bg-white/[0.08]"}`}
            >
                <span className={`material-symbols-outlined transition-colors ${light ? "text-[#292929] group-hover:text-[#171717]" : dark ? "text-neutral-200 group-hover:text-white" : "text-neutral-300 group-hover:text-white"}`}>notifications</span>
                {unreadCount > 0 && (
                    <span className={`absolute ${light ? "top-1 right-1" : dark ? "top-1.5 right-1.5" : "top-2.5 right-2.5"} w-4 h-4 text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 animate-pulse ${light ? "bg-[#171717] text-white ring-white" : dark ? "bg-white text-black ring-[#141414]" : "bg-white text-black ring-white"}`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute top-14 -right-11 sm:right-0 w-[min(20rem,calc(100vw-2rem))] sm:w-96 max-h-[calc(100vh-110px)] flex flex-col rounded-2xl shadow-[0_20px_50px_rgba(23,23,23,0.12)] overflow-hidden z-50 animate-fade-in origin-top-right border ${light ? "bg-white text-[#171717] border-[#E4DED6]" : "bg-[#141414] text-white backdrop-blur-xl border-white/[0.08]"}`}>
                    <div className={`p-4 border-b flex items-center justify-between shrink-0 ${light ? "border-[#E4DED6] bg-[#FAF8F5]" : "border-white/[0.06] bg-[#141414]/50"}`}>
                        <h3 className="text-sm font-headline font-bold uppercase tracking-widest">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className={`text-[10px] font-bold transition-colors uppercase tracking-tight ${light ? "text-[#77736E] hover:text-[#171717]" : "text-neutral-500 hover:text-white"}`}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] flex-1 overflow-y-auto no-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.isRead) handleMarkAsRead(n.id);
                                        setIsOpen(false);
                                    }}
                                    className={`p-4 border-b transition-colors cursor-pointer relative group ${light ? `border-[#EFEAE2] hover:bg-[#FAF8F5] ${!n.isRead ? "bg-[#F8F5F0]" : ""}` : `border-white/[0.04] hover:bg-white/[0.05] ${!n.isRead ? "bg-white/[0.03]" : ""}`}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={`text-sm font-bold truncate ${light ? (!n.isRead ? "text-[#171717]" : "text-[#5f5a53]") : (!n.isRead ? "text-white" : "text-neutral-400")}`}>
                                                    {n.title}
                                                </p>
                                                <span className={`text-[10px] whitespace-nowrap ml-2 ${light ? "text-[#8a857d]" : "text-neutral-500"}`}>
                                                    {dayjs(n.createdAt).fromNow()}
                                                </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed ${light ? (!n.isRead ? "text-[#3d3a36] font-medium" : "text-[#77736E]") : (!n.isRead ? "text-neutral-300 font-medium" : "text-neutral-500")}`}>
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <Link
                                                    to={n.link}
                                                    className={`inline-block mt-2 text-[10px] font-bold border-b transition-all ${light ? "text-[#171717] border-[#C9A77A] hover:border-[#171717]" : "text-white border-white/20 hover:border-white/40"}`}
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(n.id, e)}
                                        className={`absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${light ? "hover:bg-red-50 hover:text-red-600 text-[#8a857d]" : "hover:bg-red-500/10 hover:text-red-400 text-neutral-500"}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {!n.isRead && (
                                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${light ? "bg-[#C9A77A]" : "bg-white"}`}></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 px-6 text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${light ? "bg-[#F1ECE5]" : "bg-white/[0.03]"}`}>
                                    <span className={`material-symbols-outlined ${light ? "text-[#8a857d]" : "text-neutral-600"}`}>notifications_none</span>
                                </div>
                                <p className={`text-sm font-medium ${light ? "text-[#5f5a53]" : "text-neutral-400"}`}>Your showroom is currently quiet.</p>
                                <p className={`text-[11px] mt-1 ${light ? "text-[#8a857d]" : "text-neutral-500"}`}>Incoming alerts will appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className={`p-3 border-t text-center shrink-0 ${light ? "bg-[#FAF8F5] border-[#E4DED6]" : "bg-white/[0.03] border-white/[0.06]"}`}>
                        <button
                            onClick={fetchNotifications}
                            className={`text-[10px] font-bold transition-colors uppercase tracking-widest ${light ? "text-[#77736E] hover:text-[#171717]" : "text-neutral-400 hover:text-white"}`}
                        >
                            Refresh Activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
