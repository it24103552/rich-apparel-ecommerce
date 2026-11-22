import { useState } from "react";
import { UploadCloud, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FileUpload = ({ 
  accept = "image/*", 
  onChange, 
  preview = null,
  title = "Upload File",
  subtitle = "Drag and drop or click to browse",
  itemLabel = "File Received",
  itemStatus = "Verified Proof",
  minimal = false
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onChange(files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  if (minimal) {
    return (
      <div className="relative group">
        <input type="file" accept={accept} onChange={handleChange} className="hidden" id="file-upload" />
        <label
          htmlFor="file-upload"
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          className={`relative block w-full rounded-xl border border-dashed transition-all cursor-pointer ${
            dragActive
              ? "border-[#161514] bg-[#f4efe8]"
              : "border-[#d8cec0] bg-[#faf7f2] hover:border-[#9a7b56] hover:bg-white"
          } p-3.5`}
        >
          {preview ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#e6ddd0] bg-[#f1ebe3] shrink-0">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#151413]">
                  Image Added
                </p>
                <p className="text-[11px] text-[#7a7064] font-medium mt-0.5">
                  Click to change photo
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#e6ddd0] flex items-center justify-center text-[#9a7b56] group-hover:bg-[#161514] group-hover:border-[#161514] group-hover:text-white transition-colors shrink-0">
                <UploadCloud size={16} strokeWidth={1.85} />
              </div>
              <div>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#2c2722] group-hover:text-[#151413] transition-colors">
                  Add Photo
                </p>
                <p className="text-[11px] text-[#8d8276] font-medium">
                  JPG or PNG
                </p>
              </div>
            </div>
          )}
        </label>
      </div>
    );
  }

  return (
    <div className="relative group">
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />

      <label
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative block w-full overflow-hidden rounded-2xl border border-dashed transition-all duration-300 cursor-pointer ${
          dragActive
            ? "border-[#161514] bg-[#f4efe8] ring-4 ring-[#c9a77a]/20"
            : "border-[#d8cec0] bg-[#faf7f2]/80 hover:border-[#9a7b56] hover:bg-[#faf7f2]"
        } ${preview ? "p-4" : "p-8 md:p-10"}`}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center gap-5"
            >
              <div className="relative w-24 h-28 shrink-0 bg-[#f1ebe3] rounded-xl overflow-hidden border border-[#e3d9cc] p-1">
                <img src={preview} alt="Upload Preview" className="w-full h-full object-cover rounded-lg" />
                <div className="absolute top-1.5 right-1.5 bg-[#161514] text-white rounded-full p-1 shadow-sm">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 bg-[#161514] text-white text-[9.5px] font-bold uppercase tracking-[0.14em] rounded-full">
                  {itemStatus}
                </span>
                <h4 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#151413]">
                  {itemLabel}
                </h4>
                <p className="text-[11.5px] text-[#7a7064] font-medium">
                  Click anywhere in this area to replace image
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  dragActive
                    ? "bg-[#161514] text-white border-[#161514] scale-105 shadow-md"
                    : "bg-white text-[#9a7b56] border-[#e6ddd0] group-hover:bg-[#161514] group-hover:border-[#161514] group-hover:text-white"
                }`}
              >
                <UploadCloud size={24} strokeWidth={1.7} className={dragActive ? "animate-pulse" : ""} />
              </div>

              <div className="space-y-1">
                <h4 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#151413]">
                  {title}
                </h4>
                <p className="text-[12px] text-[#6c6257] font-medium leading-relaxed">
                  {subtitle} or <span className="text-[#151413] font-semibold underline underline-offset-2">browse files</span>
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8d8276]">
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon size={12} />
                  <span>JPG, PNG</span>
                </span>
                <span className="w-1 h-1 bg-[#cfc5b8] rounded-full" aria-hidden="true" />
                <span>MAX 5MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </div>
  );
};
