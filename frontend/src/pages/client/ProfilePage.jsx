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
    <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1240px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2.5 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-black">My Account</span>
        </nav>

        {/* ──── Page Header ──── */}
        <div className="flex items-start gap-4 pb-8 mb-10 border-b border-neutral-200/70">
          <div className="w-1.5 h-10 md:h-12 bg-black rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-black leading-none mb-2">
              My Account
            </h1>
            <p className="text-xs sm:text-[13px] font-medium text-neutral-500">
              Manage your personal information, security and account preferences.
            </p>
          </div>
        </div>

        {/* ──── Main Account Layout ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Customer Profile Summary Card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Warm Beige Top Summary Band */}
              <div className="bg-[#f5efe6] border-b border-[#e8dfd1] px-6 py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mb-4 shadow-md">
                  <User size={26} strokeWidth={2} />
                </div>

                <h2 className="text-lg font-bold uppercase tracking-tight text-black leading-snug break-words w-full">
                  {user?.name}
                </h2>
                <p
                  className="text-xs font-medium text-neutral-600 mt-1.5 break-all w-full"
                  title={user?.email}
                >
                  {user?.email}
                </p>

                <div className="mt-4">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white border border-[#dfd4c3] text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c4d3c] shadow-2xs">
                    {user?.role || "Customer"}
                  </span>
                </div>
              </div>

              {/* Supporting Metadata */}
              <div className="px-6 py-5 bg-white flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-neutral-400" /> Member Since
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-black">
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
