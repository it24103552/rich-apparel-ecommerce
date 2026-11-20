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
          className={`relative block w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            dragActive ? "border-black bg-black/5" : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-300 hover:bg-white"
          } p-4`}
        >
          {preview ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-200">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black">Image Added</p>
                <p className="text-[8px] text-neutral-400 font-bold uppercase mt-0.5">Click to change</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-300 group-hover:text-black transition-colors">
                <UploadCloud size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-black transition-colors">Add Photo</p>
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
        className={`relative block w-full overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer ${
          dragActive 
            ? "border-black bg-black/5 ring-4 ring-black/5" 
            : "border-neutral-200 bg-white hover:border-black hover:bg-neutral-50"
        } ${preview ? "p-4" : "p-10 md:p-14"}`}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-6"
            >
              <div className="relative w-24 h-28 shrink-0 bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 p-1 shadow-inner">
                <img src={preview} alt="Upload Preview" className="w-full h-full object-cover rounded-xl" />
                <div className="absolute top-1 right-1 bg-black text-white rounded-full p-1 opacity-100 shadow-lg">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-md">{itemStatus}</span>
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-black">{itemLabel}</h4>
                <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-[0.2em]">Click container to replace image</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center space-y-5"
            >
              <div className="relative">
                <div className={`absolute inset-0 bg-black/5 rounded-full blur-2xl transition-all duration-500 ${dragActive ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`}></div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 ${dragActive ? 'bg-black text-white border-black scale-110 shadow-xl' : 'bg-neutral-50 text-neutral-300 border-neutral-100'}`}>
                  <UploadCloud size={32} strokeWidth={1.5} className={dragActive ? "animate-pulse" : ""} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-black">{title}</h4>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                  {subtitle} or <span className="text-black underline cursor-pointer">browse files</span>
                </p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 opacity-40">
                  <ImageIcon size={10} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em]">JPG, PNG</span>
                </div>
                <div className="w-1 h-1 bg-neutral-200 rounded-full"></div>
                <div className="flex items-center gap-1.5 opacity-40">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em]">MAX 5MB</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </div>
  );
};
