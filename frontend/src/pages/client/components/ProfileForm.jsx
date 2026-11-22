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
      <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] p-8 min-h-[300px] flex flex-col justify-center items-center">
        <div className="w-7 h-7 border-2 border-[#e6ddd0] border-t-[#161514] rounded-full animate-spin mb-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8d8276]">Loading Profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden flex flex-col">
      {/* Section Header */}
      <div className="px-6 sm:px-7 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#e6ddd0] flex items-center justify-center shrink-0">
            <User size={17} className="text-[#9a7b56]" />
          </div>
          <div>
            <h2 className="text-[13.5px] font-extrabold text-[#151413] uppercase tracking-[0.14em]">Personal Information</h2>
            <p className="text-[12px] text-[#7a7064] font-medium mt-0.5">Update your name and mobile contact details</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 flex-1 flex flex-col">
        {successMessage && (
          <div className="mb-5 bg-[#edf7f1] border border-[#bee2cc] text-[#1c6642] px-4 py-3 rounded-xl flex items-center gap-2.5 animate-slide-down text-[12.5px] font-semibold">
            <Check size={15} className="text-[#258a58] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 bg-[#fdf0f0] border border-[#f0c7c7] text-[#9e2a2b] px-4 py-3 rounded-xl flex items-center gap-2.5 animate-slide-down text-[12.5px] font-semibold">
            <AlertCircle size={15} className="text-[#c93838] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input
                label={
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b]">
                    <User size={11} className="text-[#9a7b56]" /> Full Name
                  </span>
                }
                placeholder="Identity Label"
                {...register("name", registerRules.name)}
                error={errors.name?.message}
                className="!rounded-[14px] !py-3.5 !px-4 !text-[13.5px] !font-medium !border-[#E4DED6] focus:!border-[#C9A77A] focus:!ring-[#C9A77A]/15 !bg-white !shadow-none"
              />
            </div>

            <div>
              <Input
                label={
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b]">
                    <Mail size={11} className="text-[#9a7b56]" /> Digital Mail
                  </span>
                }
                type="email"
                placeholder="email@example.com"
                {...register("email", registerRules.email)}
                error={errors.email?.message}
                disabled
                className="!rounded-[14px] !py-3.5 !px-4 !text-[13.5px] !font-medium !bg-[#f6f1ea] !text-[#7a7064] !border-[#e6ddd0] !shadow-none cursor-not-allowed"
              />
            </div>

            <div>
              <Input
                label={
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b]">
                    <Phone size={11} className="text-[#9a7b56]" /> Mobile Contact
                  </span>
                }
                type="tel"
                placeholder="07XXXXXXXX"
                {...register("phone", registerRules.phone)}
                error={errors.phone?.message}
                className="!rounded-[14px] !py-3.5 !px-4 !text-[13.5px] !font-medium !border-[#E4DED6] focus:!border-[#C9A77A] focus:!ring-[#C9A77A]/15 !bg-white !shadow-none"
                maxLength={10}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#f0e9df] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto sm:min-w-[210px] h-11 px-8 bg-[#161514] hover:bg-[#2c2926] text-white text-[11.5px] font-bold uppercase tracking-[0.14em] rounded-full transition-all duration-200 shadow-[0_8px_22px_rgba(22,21,20,0.14)] hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Confirm Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
