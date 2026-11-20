import { useState, useEffect, useRef } from "react";
import { usersService } from "../../services/users.service";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Key, User, Trash2, Check, RefreshCw, X } from "lucide-react";

dayjs.extend(relativeTime);

// `dark` only restyles the trigger button for the dark admin theme; behaviour is unchanged.
// `light` is a presentation-only flag for the warm light theme (Product Management).
export const PasswordRequestsCenter = ({ dark = false, light = false }) => {
    const [requests, setRequests] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const dropdownRef = useRef(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await usersService.getPasswordRequests();
            setRequests(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch password requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await usersService.deletePasswordRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            toast.success("Request dismissed");
        } catch (err) {
            toast.error("Failed to delete request");
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;

        setIsUpdating(true);
        try {
            await usersService.updatePassword(selectedUser.userId, newPassword);
            await usersService.deletePasswordRequest(selectedUser.id);
            toast.success(`Password updated for ${selectedUser.user?.name}`);
            setRequests(prev => prev.filter(r => r.id !== selectedUser.id));
            setSelectedUser(null);
            setNewPassword("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all border group ${light ? "bg-white hover:bg-[#F1ECE5] text-[#171717] border-[#E4DED6] shadow-sm" : dark ? "bg-[#1b1b1b] hover:bg-[#242424] text-white border-white/[0.1]" : "bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 hover:text-white border-white/[0.06] shadow-sm"}`}
            >
                <Key className={`w-4 h-4 ${light ? "text-[#292929]" : dark ? "text-neutral-300 group-hover:text-white" : ""}`} />
                <span className={`${light || dark ? "text-[13px] font-semibold tracking-tight" : "text-xs font-bold uppercase tracking-widest"} hidden lg:block`}>Requests</span>
                {requests.length > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute top-14 -right-24 sm:right-0 w-[min(340px,calc(100vw-2rem))] sm:w-[400px] max-h-[calc(100vh-110px)] flex flex-col rounded-2xl shadow-[0_20px_50px_rgba(23,23,23,0.12)] overflow-hidden z-50 animate-fade-in origin-top-right border ${light ? "bg-white text-[#171717] border-[#E4DED6]" : "bg-[#141414] text-white backdrop-blur-xl border-white/[0.08]"}`}>
                    <div className={`p-5 border-b shrink-0 ${light ? "border-[#E4DED6] bg-[#FAF8F5]" : "border-white/[0.06] bg-white/[0.03]"}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-headline font-bold uppercase tracking-widest">Password Resets</h3>
                            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-tighter ${light ? "bg-[#F1ECE5] text-[#5f5a53] border border-[#E4DED6]" : "bg-white/10 text-neutral-300"}`}>
                                {requests.length} Pending
                            </span>
                        </div>
                    </div>

                    <div className="max-h-[450px] flex-1 overflow-y-auto no-scrollbar">
                        {selectedUser ? (
                            <div className="p-6 animate-fade-in">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className={`flex items-center gap-1.5 text-[10px] font-black transition-colors uppercase mb-4 ${light ? "text-[#77736E] hover:text-[#171717]" : "text-neutral-500 hover:text-white"}`}
                                >
                                    <X className="w-3 h-3" /> Back to list
                                </button>
                                
                                <div className="mb-6">
                                    <h4 className={`text-xs font-bold uppercase ${light ? "text-[#171717]" : "text-white"}`}>Setting new password for</h4>
                                    <p className={`text-sm font-medium mt-1 ${light ? "text-[#5f5a53]" : "text-neutral-400"}`}>{selectedUser.user?.name}</p>
                                    <p className={`text-[11px] ${light ? "text-[#8a857d]" : "text-neutral-500"}`}>{selectedUser.user?.email}</p>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase mb-2 ${light ? "text-[#77736E]" : "text-neutral-500"}`}>New Secure Password</label>
                                        <input
                                            type="text"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${light ? "bg-white border-[#E4DED6] text-[#171717] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15" : "bg-white/[0.03] border-white/10 focus:ring-2 focus:ring-white/10"}`}
                                            autoFocus
                                            minLength={6}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUpdating || newPassword.length < 6}
                                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${light ? "bg-[#171717] text-white hover:bg-[#292929]" : "bg-white text-black hover:bg-neutral-200"}`}
                                    >
                                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Override Password
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className={`divide-y ${light ? "divide-[#EFEAE2]" : "divide-white/[0.04]"}`}>
                                {requests.length > 0 ? (
                                    requests.map((r) => (
                                        <div
                                            key={r.id}
                                            className={`p-4 transition-colors group cursor-pointer ${light ? "hover:bg-[#FAF8F5]" : "hover:bg-white/[0.05]"}`}
                                            onClick={() => setSelectedUser(r)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${light ? "bg-[#F1ECE5] border border-[#E4DED6]" : "bg-white/[0.06]"}`}>
                                                    <User className={`w-5 h-5 ${light ? "text-[#5f5a53]" : "text-neutral-500"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className={`text-sm font-bold truncate ${light ? "text-[#171717]" : "text-white"}`}>{r.user?.name}</p>
                                                        <span className={`text-[10px] ${light ? "text-[#8a857d]" : "text-neutral-500"}`}>{dayjs(r.createdAt).fromNow()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter ${light ? "bg-[#F1ECE5] text-[#5f5a53] border border-[#E4DED6]" : "bg-white/[0.06] text-neutral-400"}`}>
                                                            {r.user?.role?.name || 'Staff'}
                                                        </span>
                                                        <p className={`text-[11px] truncate ${light ? "text-[#77736E]" : "text-neutral-500"}`}>{r.user?.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(r.id, e)}
                                                    className={`p-2 opacity-0 group-hover:opacity-100 rounded-lg transition-all ${light ? "hover:bg-red-50 hover:text-red-600 text-[#8a857d]" : "hover:bg-red-500/10 hover:text-red-400 text-neutral-500"}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-16 text-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${light ? "bg-[#F1ECE5]" : "bg-white/[0.06]"}`}>
                                            <Key className={`w-6 h-6 ${light ? "text-[#8a857d]" : "text-neutral-600"}`} />
                                        </div>
                                        <p className={`text-sm font-bold ${light ? "text-[#171717]" : "text-white"}`}>Security Vault Clear</p>
                                        <p className={`text-xs mt-1 ${light ? "text-[#77736E]" : "text-neutral-500"}`}>No pending password change requests.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
