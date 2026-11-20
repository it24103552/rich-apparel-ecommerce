import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usersService } from "../../services/users.service";
import toast from "react-hot-toast";

export const SettingsPage = () => {
    const { user, dispatch } = useAuth();

    // Profile State
    const [name, setName] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Security State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Populate state once user loads
    useEffect(() => {
        if (user) {
            setName(user.name || "");
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!user?.id) return;

        setIsSavingProfile(true);
        try {
            await usersService.update(user.id, { name });
            toast.success("Profile updated successfully. Changes will fully apply on next login.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await usersService.updatePassword(user.id, newPassword);
            toast.success("Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const [requestSent, setRequestSent] = useState(false);

    const handleRequestReset = async () => {
        try {
            await usersService.requestPasswordChange();
            toast.success("Password reset request sent to administrators");
            setRequestSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] pt-2 pb-10 text-[#171717] animate-fade-in">
            <div className="max-w-4xl space-y-6">
                {/* Profile Section */}
                <section className="admin-card rounded-[24px] overflow-hidden">
                    <div className="px-6 md:px-8 py-5 border-b border-[#E4DED6] admin-table-header relative overflow-hidden">
                        <h2 className="text-[17px] font-headline font-bold text-[#171717]">Profile Details</h2>
                        <p className="text-[13px] text-[#77736E] mt-0.5">Update your contact information.</p>
                    </div>
                    <div className="p-6 md:p-8">
                        <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-lg">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#77736E] mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full bg-[#FAF8F5] border border-[#E4DED6] text-[#8a857d] rounded-2xl px-4 py-3 text-sm font-medium cursor-not-allowed"
                                />
                                <p className="text-[11px] text-[#8a857d] mt-1.5 ml-1">Email cannot be changed.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#77736E] mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-white border border-[#E4DED6] text-[#171717] rounded-2xl px-4 py-3 text-sm font-medium focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 outline-none transition-all"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="h-11 px-6 bg-[#171717] text-white text-[13px] font-headline font-bold rounded-2xl hover:bg-[#292929] transition-all shadow-[0_8px_20px_rgba(23,23,23,0.18)] disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isSavingProfile ? (
                                        <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]">save</span>
                                    )}
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Security Section */}
                <section className="admin-card rounded-[24px] overflow-hidden">
                    <div className="px-6 md:px-8 py-5 border-b border-[#E4DED6] admin-table-header">
                        <h2 className="text-[17px] font-headline font-bold text-[#171717]">Account Security</h2>
                        <p className="text-[13px] text-[#77736E] mt-0.5">Manage your password and authentication access.</p>
                    </div>
                    <div className="p-6 md:p-8">
                        {isAdmin ? (
                            <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-lg">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#77736E] mb-2 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-white border border-[#E4DED6] text-[#171717] rounded-2xl px-4 py-3 text-sm font-medium focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#77736E] mb-2 ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-white border border-[#E4DED6] text-[#171717] rounded-2xl px-4 py-3 text-sm font-medium focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isUpdatingPassword}
                                        className="h-11 px-6 bg-[#171717] text-white text-[13px] font-headline font-bold rounded-2xl hover:bg-[#292929] transition-all shadow-[0_8px_20px_rgba(23,23,23,0.18)] disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {isUpdatingPassword ? (
                                            <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                                        )}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="max-w-xl">
                                <div className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-[#FAF8F5] rounded-[20px] border border-[#E4DED6]">
                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#F1ECE5] rounded-2xl border border-[#E4DED6] mt-0.5">
                                        <span className="material-symbols-outlined text-[#8A6D3F] text-[18px]">lock</span>
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-headline font-bold text-[#171717] mb-1">Restricted Authorization</h3>
                                        <p className="text-sm text-[#5f5a53] leading-relaxed mb-4">
                                            As a <span className="font-semibold text-[#171717]">{user?.role || 'staff member'}</span>, you do not have permission to change your password directly. Please submit a secure request to the system administrators to initiate a password reset.
                                        </p>
                                        <button
                                            onClick={handleRequestReset}
                                            disabled={requestSent}
                                            className={`h-10 px-5 text-[13px] font-headline font-bold rounded-xl border transition-all flex items-center gap-2 ${
                                                requestSent 
                                                ? "bg-[#F1ECE5] text-[#8a857d] border-[#E4DED6] cursor-not-allowed" 
                                                : "bg-[#171717] text-white border-[#171717] hover:bg-[#292929]"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {requestSent ? "verified" : "send"}
                                            </span>
                                            {requestSent ? "Request Sent" : "Request Password Reset"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
