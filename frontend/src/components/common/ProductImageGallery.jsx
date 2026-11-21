import { SectionCard } from "./SectionCard";

/**
 * Reusable Product Imagery panel following the Rich Apparel Warm Light Atelier design system.
 * Preserves primary image selection, multi-image upload, thumbnail preview, and deletion.
 */
export const ProductImageGallery = ({
  images = [],
  maxImages = 5,
  inputId = "image-upload",
  onFilesSelected,
  onSetMainImage,
  onRemoveImage,
}) => {
  return (
    <SectionCard title="Product Imagery" icon="image" className="h-full">
      <div className="space-y-5">
        {/* Main Image Preview / Dropzone */}
        <div
          className={`relative aspect-[4/5] rounded-[20px] border-2 border-dashed bg-white flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group/upload ${
            images.length > 0
              ? "border-[#E4DED6] border-solid shadow-2xs"
              : "border-[#D6CDBF] hover:border-[#C9A77A] hover:bg-[#FAF8F5]/60"
          }`}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {images.length > 0 ? (
            <>
              <img
                src={images[0].url}
                alt="Primary product preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/upload:scale-105"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 border border-[#E4DED6] text-[#171717] text-[10px] font-black uppercase tracking-widest shadow-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-[#9A7B4A]">star</span>
                Primary
              </div>
            </>
          ) : (
            <div className="px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] shadow-2xs flex items-center justify-center mx-auto mb-4 transition-transform group-hover/upload:scale-105">
                <span className="material-symbols-outlined text-[#9A7B4A] text-[26px]">cloud_upload</span>
              </div>
              <p className="text-[14px] font-headline font-bold text-[#171717] leading-tight">Drop images here</p>
              <p className="text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em] mt-2">
                Click to browse gallery (max {maxImages})
              </p>
            </div>
          )}

          <input
            id={inputId}
            type="file"
            multiple
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onFilesSelected(files);
              }
            }}
          />
        </div>

        {/* Thumbnail Strip */}
        {images.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto py-1 hide-scrollbar">
            {images.map((img, index) => (
              <div
                key={img.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetMainImage(img.id);
                }}
                className={`w-16 h-16 rounded-[14px] overflow-hidden shrink-0 relative group/thumb cursor-pointer transition-all duration-200 bg-white ${
                  index === 0
                    ? "border-2 border-[#C9A77A] ring-2 ring-[#C9A77A]/25 shadow-sm"
                    : "border border-[#E4DED6] hover:border-[#9A7B4A]"
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-md bg-[#C9A77A] flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-white text-[11px]">star</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[#171717]/55 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(img.id);
                    }}
                    className="w-7 h-7 rounded-full bg-white/90 text-[#171717] hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Remove image"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              </div>
            ))}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => document.getElementById(inputId)?.click()}
                className="w-16 h-16 rounded-[14px] bg-white hover:bg-[#F1ECE5] border border-[#D6CDBF] hover:border-[#171717] border-dashed flex items-center justify-center transition-all shrink-0 active:scale-95 text-[#77736E] hover:text-[#171717]"
                aria-label="Add product image"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            )}
          </div>
        )}

        {/* Guidelines Callout */}
        <div className="bg-white rounded-[18px] p-4 flex gap-3 items-start border border-[#E4DED6]">
          <span className="material-symbols-outlined text-[18px] text-[#9A7B4A] mt-0.5 shrink-0">info</span>
          <div>
            <h4 className="text-[10px] font-black text-[#171717] uppercase tracking-[0.18em] mb-1">
              Upload Guidelines
            </h4>
            <p className="text-[11px] text-[#77736E] font-medium leading-relaxed">
              High-resolution JPG/PNG. 4:5 aspect ratio recommended. Max {maxImages} images per product.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
