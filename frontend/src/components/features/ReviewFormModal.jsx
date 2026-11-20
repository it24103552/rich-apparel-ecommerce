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
      <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Product & Rating */}
          <div className="space-y-6">
            <div className="px-1">
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">Your Rating</p>
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-all duration-300 transform hover:scale-125 active:scale-95 group"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                          : "text-neutral-200 group-hover:text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-4 leading-none">
                {rating} out of 5 stars
              </p>
            </div>
          </div>

          {/* Right Column: Feedback & Photo */}
          <div className="space-y-5">
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3 px-1">Feedback</p>
              <textarea
                {...register("comment", {
                  required: "Please share your thoughts",
                  minLength: { value: 5, message: "Comment must be at least 5 characters" },
                  maxLength: { value: 1000, message: "Comment must be less than 1000 characters" },
                })}
                placeholder="Share your experience..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-black text-[13px] font-medium outline-none transition-all resize-none shadow-sm"
                rows="3"
              />
              {errors.comment && (
                <p className="text-red-500 text-[10px] font-bold uppercase mt-2 tracking-wide px-1">{errors.comment.message}</p>
              )}
            </div>

            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3 px-1">Photo (Optional)</p>
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
        <div className="flex gap-3 justify-end mt-8 pt-5 border-t border-neutral-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-6 h-10 text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={saving}
            className="rounded-xl px-8 h-10 bg-black text-white hover:bg-neutral-800 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all active:scale-95"
          >
            {existingReview ? "Update Review" : "Post Review"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
