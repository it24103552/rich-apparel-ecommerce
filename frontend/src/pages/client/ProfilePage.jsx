import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ProfileForm } from "./components/ProfileForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { DangerZone } from "./components/DangerZone";
import { User, Calendar, ChevronRight } from "lucide-react";

export const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen bg-[#faf8f5] selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]"
        >
          <Link to="/" className="hover:text-[#151413] transition-colors">Home</Link>
          <ChevronRight size={11} className="text-[#b5a99b]" />
          <span className="text-[#151413] font-bold">My Account</span>
        </nav>

        {/* ──── Page Header ──── */}
        <div className="flex items-start gap-3.5 pb-7 mb-9 border-b border-[#e8e0d5]">
          <div className="w-1 h-9 sm:h-11 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-extrabold uppercase tracking-[-0.03em] text-[#151413] leading-none mb-2">
              My Account
            </h1>
            <p className="text-[12.5px] sm:text-[13.5px] font-medium text-[#7a7064]">
              Manage your personal information, security and account preferences.
            </p>
          </div>
        </div>

        {/* ──── Main Account Layout ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* Left: Customer Profile Summary Card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-[124px]">
            <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
              {/* Warm Beige Top Summary Band */}
              <div className="bg-[#faf6f0] border-b border-[#ece3d6] px-6 py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#161514] text-white flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(22,21,20,0.16)]">
                  <User size={26} strokeWidth={1.9} />
                </div>

                <h2 className="text-[18px] font-extrabold uppercase tracking-[-0.01em] text-[#151413] leading-snug break-words w-full">
                  {user?.name}
                </h2>
                <p
                  className="text-[12.5px] font-medium text-[#6c6257] mt-1.5 break-all w-full"
                  title={user?.email}
                >
                  {user?.email}
                </p>

                <div className="mt-4">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white border border-[#dfd4c3] text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#7c664e]">
                    {user?.role || "Customer"}
                  </span>
                </div>
              </div>

              {/* Supporting Metadata */}
              <div className="px-6 py-4 bg-white flex items-center justify-between gap-4">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8d8276] flex items-center gap-1.5">
                  <Calendar size={12.5} className="text-[#9a7b56]" /> Member Since
                </span>
                <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#151413]">
                  APRIL 2024
                </span>
              </div>
            </div>
          </aside>

          {/* Right: Settings Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Primary Information */}
            <ProfileForm user={user} />

            {/* Security */}
            <ResetPasswordForm user={user} />

            {/* Restricted / Dangerous Actions */}
            <DangerZone user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};
