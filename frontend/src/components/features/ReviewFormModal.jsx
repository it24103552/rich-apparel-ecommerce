import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FileUpload } from "../common/FileUpload";
import { resolveImageUrl } from "../../utils/imageHelpers";
import { Star } from "lucide-react";


export const ReviewFormModal = ({ isOpen, onClose, onSave, productName, existingReview, saving = false }) => {
  const [rating, setRating] = useState(5);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      comment: existingReview?.comment || "",
    },
  });

  useEffect(() => {
    if (isOpen && existingReview) {
      setRating(existingReview.rating || 5);
      setImagePreview(resolveImageUrl(existingReview.imageUrl, null));
      reset({
        comment: existingReview.comment || "",
      });
    } else if (isOpen) {
      setRating(5);
      setImagePreview(null);
      setImageFile(null);
      reset({
        comment: "",
      });
    }
  }, [isOpen, existingReview, reset]);

  const handleImageChange = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("comment", data.comment);
    if (existingReview?.productId) {
      formData.append("productId", existingReview.productId);
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }

    await onSave(formData);
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingReview ? "Edit Review" : "Write a Review"} size="2xl">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="animate-fade-in"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {productName && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#ebe3d8] flex items-center justify-between gap-3">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8d8276] shrink-0">
              Item
            </span>
            <span className="text-[13px] font-bold text-[#151413] truncate">
              {productName}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
          {/* Left Column: Product & Rating */}
          <div className="p-5 rounded-2xl bg-[#faf7f2] border border-[#ebe3d8] space-y-4">
            <p className="text-[11px] font-bold text-[#5c544b] uppercase tracking-[0.16em]">
              Your Rating
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} out of 5`}
                  className="focus:outline-none transition-transform duration-200 hover:scale-115 active:scale-95 cursor-pointer group"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= rating
                        ? "fill-[#e4a63a] text-[#e4a63a]"
                        : "text-[#d5cabd] group-hover:text-[#bfa88a]"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-[#e5dacb] text-[11px] font-bold text-[#8a6d43] tracking-[0.06em]">
              {rating} out of 5 stars
            </span>
          </div>

          {/* Right Column: Feedback & Photo */}
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-[#5c544b] uppercase tracking-[0.16em] mb-2.5">
                Feedback
              </p>
              <textarea
                {...register("comment", {
                  required: "Please share your thoughts",
                  minLength: { value: 5, message: "Comment must be at least 5 characters" },
                  maxLength: { value: 1000, message: "Comment must be less than 1000 characters" },
                })}
                placeholder="Share your experience with the fit, fabric, and quality..."
                className="w-full px-4 py-3.5 bg-[#faf8f5] border border-[#e4dcd0] rounded-xl focus:bg-white focus:border-[#161514] focus:ring-2 focus:ring-[#c9a77a]/20 text-[13.5px] font-medium text-[#151413] placeholder:text-[#9a8e80] outline-none transition-all resize-none"
                rows="4"
              />
              {errors.comment && (
                <p className="text-[#b43232] text-[11px] font-semibold mt-1.5">
                  {errors.comment.message}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold text-[#5c544b] uppercase tracking-[0.16em] mb-2.5">
                Photo (Optional)
              </p>
              <div className="max-w-full">
                <FileUpload
                  accept="image/*"
                  onChange={handleImageChange}
                  preview={imagePreview}
                  minimal={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap gap-3 justify-end mt-7 pt-5 border-t border-[#efe8de]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-6 h-11 text-[11.5px] font-bold uppercase tracking-[0.14em]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
            className="rounded-full px-8 h-11 bg-[#161514] text-white hover:bg-[#2c2926] text-[11.5px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_22px_rgba(22,21,20,0.16)]"
          >
            {existingReview ? "Update Review" : "Post Review"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
