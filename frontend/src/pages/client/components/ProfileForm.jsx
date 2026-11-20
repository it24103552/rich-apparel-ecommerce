import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usersService } from "../../../services";
import { Input } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import { registerRules } from "../../../validations/auth.validation";
import { Check, AlertCircle, User, Mail, Phone } from "lucide-react";

export const ProfileForm = ({ user, onUpdate }) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Fetch fresh user profile data on mount to populate form
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await usersService.getById(user.id);
        const profileData = res.data.data;
        reset({
          name: profileData.name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
        });
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await usersService.update(user.id, data);
      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-8 min-h-[320px] flex flex-col justify-center items-center">
        <div className="w-7 h-7 border-2 border-neutral-200 border-t-black rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Loading Profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 p-6 sm:p-8 flex flex-col">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-neutral-100">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#f5efe6] border border-[#e8dfd1] flex items-center justify-center shrink-0">
            <User size={17} className="text-black" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-black uppercase tracking-[0.18em]">Personal Information</h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Update your name and mobile contact details</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 animate-slide-down text-xs font-semibold">
          <Check size={15} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 animate-slide-down text-xs font-semibold">
          <AlertCircle size={15} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Input
              label={
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700">
                  <User size={11} className="text-neutral-400" /> Full Name
                </span>
              }
              placeholder="Identity Label"
              {...register("name", registerRules.name)}
              error={errors.name?.message}
              className="!rounded-xl !py-3.5 !px-4 !text-sm !font-medium !border-neutral-200 focus:!border-black focus:!ring-black/5 !bg-white !shadow-none"
            />
          </div>

          <div>
            <Input
              label={
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700">
                  <Mail size={11} className="text-neutral-400" /> Digital Mail
                </span>
              }
              type="email"
              placeholder="email@example.com"
              {...register("email", registerRules.email)}
              error={errors.email?.message}
              disabled
              className="!rounded-xl !py-3.5 !px-4 !text-sm !font-medium !bg-[#f7f7f7] !text-neutral-500 !border-neutral-200/80 !shadow-none cursor-not-allowed"
            />
          </div>

          <div>
            <Input
              label={
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700">
                  <Phone size={11} className="text-neutral-400" /> Mobile Contact
                </span>
              }
              type="tel"
              placeholder="07XXXXXXXX"
              {...register("phone", registerRules.phone)}
              error={errors.phone?.message}
              className="!rounded-xl !py-3.5 !px-4 !text-sm !font-medium !border-neutral-200 focus:!border-black focus:!ring-black/5 !bg-white !shadow-none"
              maxLength={10}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
              }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto sm:min-w-[220px] h-12 px-8 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-neutral-800 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Confirm Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};
