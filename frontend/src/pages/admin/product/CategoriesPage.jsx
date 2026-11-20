import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { categoriesService, productsService, aiService } from "../../../services";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Input } from "../../../components/common/Input";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { categoryRules } from "../../../validations/category.validation";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const PAGE_SIZE = 11;

// Utility mappers for premium presentation
const getCategoryAppearance = (name) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('women') || n.includes('female') || n.includes('lady')) {
    return { img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600', sub: "WOMEN'S COLLECTION" };
  }
  if (n.includes('men') || n.includes('male') || n.includes('gentleman')) {
    return { img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', sub: "MEN'S COLLECTION" };
  }
  if (n.includes('sport') || n.includes('active') || n.includes('athletic') || n.includes('gym')) {
    return { img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600', sub: 'SPORTY & ACTIVEWEAR' };
  }
  if (n.includes('outer') || n.includes('jacket') || n.includes('coat')) {
    return { img: 'https://images.unsplash.com/photo-1551028719-001dd5c32988?auto=format&fit=crop&q=80&w=600', sub: 'ESSENTIAL LAYERING' };
  }
  if (n.includes('denim') || n.includes('jean')) {
    return { img: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&q=80&w=600', sub: 'RAW & FINISHED' };
  }
  if (n.includes('basic') || n.includes('tee')) {
    return { img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', sub: 'EVERYDAY UNIFORM' };
  }
  if (n.includes('footwear') || n.includes('shoe') || n.includes('sneaker')) {
    return { img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=600', sub: 'ARCHITECTURAL SILHOUETTES' };
  }
  if (n.includes('access') || n.includes('bag')) {
    return { img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600', sub: 'THE FINAL DETAIL' };
  }
  return { img: 'https://images.unsplash.com/photo-1600161541312-326922df4f36?auto=format&fit=crop&q=80&w=600', sub: 'CURATED COLLECTION' };
};

export const CategoriesPage = () => {
  // Data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal & Form State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  // Advanced Category State
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [variantConfig, setVariantConfig] = useState([]); // [{ name: "Size", options: ["S", "M"] }]
  const fileInputRef = useRef(null);
  const aiImageLoaded = useRef(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isAiImage, setIsAiImage] = useState(false); // true = Pollinations URL, suppress onError
  const [isActive, setIsActive] = useState(true);
  const [attrToDelete, setAttrToDelete] = useState(null);
  const [optToDelete, setOptToDelete] = useState(null); // { attrIndex, optIndex }

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  // Computed data
  const filtered = useMemo(() => {
    return filterBySearch(categories, searchTerm, ["name", "description"]);
  }, [categories, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [catRes, prodRes] = await Promise.all([
          categoriesService.getAll(0, 1000),
          productsService.getAll(0, 5000), // Fetch to calculate exact product counts matching the mockup
        ]);
        setCategories(catRes.data.data.categories || []);
        setProducts(prodRes.data.data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Modal handlers
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedCategory(null);
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setVariantConfig([]);
    reset({ name: "" });
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setDescription(category.description || "");
    setImageFile(null);
    setImagePreview(category.imageUrl || null);
    setVariantConfig(category.variantConfig || []);
    setIsActive(category.isActive !== false);
    reset({ name: category.name });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCategory(null);
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setVariantConfig([]);
    setIsActive(true);
    reset();
  };

  // Variant Mapping Helpers
  const addAttribute = () => {
    setVariantConfig([...variantConfig, { name: "", options: [] }]);
  };

  const removeAttribute = (index) => {
    setAttrToDelete(index);
  };

  const confirmRemoveAttribute = () => {
    if (attrToDelete !== null) {
      setVariantConfig(variantConfig.filter((_, i) => i !== attrToDelete));
      setAttrToDelete(null);
      toast.success("Attribute removed from collection structure");
    }
  };

  const updateAttributeName = (index, name) => {
    const newConfig = [...variantConfig];
    newConfig[index].name = name;

    // Intelligent Scaffold: Auto-populate standard options based on attribute name
    const normalizedName = name.toLowerCase().trim();
    if ((normalizedName === "size" || normalizedName === "sizes") && newConfig[index].options.length === 0) {
      newConfig[index].options = ["S", "M", "L", "XL", "XXL"];
    } else if ((normalizedName === "sex" || normalizedName === "gender") && newConfig[index].options.length === 0) {
      newConfig[index].options = ["Men", "Women", "Unisex"];
    }

    setVariantConfig(newConfig);
  };

  const addOption = (index, option) => {
    if (!option.trim()) return;
    const newConfig = [...variantConfig];
    if (newConfig[index].options.includes(option.trim())) return;
    newConfig[index].options.push(option.trim());
    setVariantConfig(newConfig);
  };

  const removeOption = (attrIndex, optIndex) => {
    setOptToDelete({ attrIndex, optIndex });
  };

  const confirmRemoveOption = () => {
    if (optToDelete) {
      const { attrIndex, optIndex } = optToDelete;
      const newConfig = [...variantConfig];
      newConfig[attrIndex].options = newConfig[attrIndex].options.filter((_, i) => i !== optIndex);
      setVariantConfig(newConfig);
      setOptToDelete(null);
      toast.success("Option removed");
    }
  };

  // Image Helper
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", description);
      formData.append("isActive", isActive);
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("variantConfig", JSON.stringify(variantConfig));

      if (modalMode === "create") {
        await categoriesService.create(formData);
        toast.success("Category created successfully");
      } else {
        await categoriesService.update(selectedCategory.id, formData);
        toast.success("Category updated successfully");
      }

      // Re-fetch categories
      const res = await categoriesService.getAll(0, 1000);
      setCategories(res.data.data.categories || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save category";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const openDeleteDialog = (category) => {
    setDeleteTarget(category);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoriesService.delete(deleteTarget.id);
      setCategories(categories.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Category deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete category";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in overflow-x-hidden">
      {/* Header Actions */}
      <div className="flex justify-end pt-1">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            disabled
            className="h-11 px-6 rounded-2xl bg-white text-[#8a857d] font-semibold font-headline text-[13px] border border-[#E4DED6] cursor-not-allowed opacity-60"
            title="Coming Soon"
          >
            Export PDF
          </button>
          <button
            onClick={openCreateModal}
            className="h-11 px-6 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/30 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] font-semibold">add</span>
            <span>Add Collection</span>
          </button>
        </div>
      </div>

      {/* Premium Multi-Filter Console */}
      <div className="admin-card rounded-[24px] p-3.5 flex flex-col lg:flex-row gap-2.5 items-center justify-between">
        {/* Search Engine */}
        <div className="flex-1 w-full relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a857d] text-[20px] group-focus-within:text-[#171717] transition-colors">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search collections..."
            className="w-full bg-[#FAF8F5] hover:bg-white focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl py-2.5 pl-11 pr-4 text-[13.5px] font-medium transition-all outline-none text-[#171717] placeholder-[#8a857d] h-12"
          />
        </div>

        {/* Dynamic Filter Group */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth justify-end">
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPage(1);
              }}
              title="Clear Filters"
              className="h-12 px-4 shrink-0 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-semibold text-[13px] gap-1.5 animate-fade-in"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <button className="h-12 w-12 shrink-0 rounded-2xl bg-[#FAF8F5] hover:bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#5f5a53] hover:text-[#171717] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/30" title="Advanced Filters">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Main List Container (Detached Rows) */}
      <div>
        {/* Floating Header Row */}
        <div className="hidden md:flex py-3 px-5 mb-2.5 rounded-2xl admin-table-header text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em]">
          <div className="w-1/3">Collection</div>
          <div className="w-[10%] text-left">Products</div>
          <div className="w-[18%] text-left">Created Date</div>
          <div className="w-[18%] text-left">Last Update</div>
          <div className="w-[10%] text-center">Status</div>
          <div className="w-16 text-center">Actions</div>
        </div>

        {/* Category Items */}
        <div className="space-y-3">
          {paginated.data.length === 0 ? (
            <div className="py-20 bg-white rounded-[24px] text-center text-[#77736E] font-medium border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
              No collections found matching your criteria.
            </div>
          ) : (
            paginated.data.map((category) => {
              const count = products.filter(p => p.categoryId === category.id).length;
              const look = getCategoryAppearance(category.name);

              return (
                <div key={category.id} className="flex flex-col md:flex-row md:items-center py-4 px-5 admin-card rounded-[20px] transition-all duration-300 gap-4 md:gap-0 group">

                  {/* Category Column */}
                  <div className="w-full md:w-1/3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-[#F1ECE5] shrink-0 border border-[#E4DED6]">
                      <img
                        src={category.imageUrl || look.img}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="font-headline font-bold text-[15px] leading-tight text-[#171717] truncate">{category.name}</h4>
                      <p className="text-[11px] text-[#77736E] font-medium mt-1 line-clamp-1">{category.description || look.sub}</p>
                    </div>
                  </div>

                  {/* Products Column */}
                  <div className="w-full md:w-[10%] font-headline font-bold text-[14px] text-[#171717] flex justify-between md:block">
                    <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Products</span>
                    {count}
                  </div>

                  {/* Created Date Column */}
                  <div className="w-full md:w-[18%] text-[13px] text-[#5f5a53] font-medium flex justify-between md:block">
                    <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Created Date</span>
                    {category.createdAt ? dayjs(category.createdAt).format("MMM D, YYYY") : "Initial Set"}
                  </div>

                  {/* Last Update Column */}
                  <div className="w-full md:w-[18%] text-[13px] text-[#5f5a53] font-medium flex justify-between md:block">
                    <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Last Update</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {category.updatedAt ? dayjs(category.updatedAt).fromNow() : "Initial Setup"}
                    </span>
                  </div>

                  {/* Status Column */}
                  <div className="w-full md:w-[10%] flex justify-between md:justify-center items-center">
                    <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Status</span>
                    {category.isActive !== false ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1ECE5] text-[#5f5a53] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#E4DED6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8a857d]" />Inactive
                      </span>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="w-full md:w-16 flex justify-end md:justify-center items-center gap-1.5 relative mt-2 md:mt-0">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(category); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-colors rounded-xl" title="Edit">
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openDeleteDialog(category); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#5f5a53] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors rounded-xl" title="Delete">
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Stats & Pagination */}
      <div className="admin-card rounded-[24px] p-6 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 md:gap-12 w-full lg:w-auto">
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1">Active Categories</p>
            <p className="text-[22px] font-headline font-extrabold text-[#171717] leading-none">{categories.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1">Global SKU Count</p>
            <p className="text-[22px] font-headline font-extrabold text-[#171717] leading-none">{products.length.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1">Growth (MoM)</p>
            <p className="text-[22px] font-headline font-extrabold text-emerald-600 leading-none">+12.4%</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#77736E] font-medium">Showing all registered collections</span>
          {paginated.pages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl border border-[#E4DED6] flex items-center justify-center text-[#292929] hover:border-[#171717] hover:bg-[#F1ECE5] transition-all disabled:opacity-40 bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(paginated.pages, p + 1))}
                disabled={page === paginated.pages}
                className="w-10 h-10 rounded-xl border border-[#E4DED6] flex items-center justify-center text-[#292929] hover:border-[#171717] hover:bg-[#F1ECE5] transition-all disabled:opacity-40 bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collection Architect Modal */}
      <Modal
        dark={false}
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === "create" ? "Category Architect" : "Refine Collection"}
        size="6xl"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="px-5 py-2 rounded-[14px] border border-[#E4DED6] bg-white text-[#5f5a53] text-[10px] font-black uppercase tracking-widest hover:bg-[#F1ECE5] hover:text-[#171717] transition-all disabled:opacity-50 h-[38px]"
            >
              Discard
            </button>
            <button
              type="submit"
              form="category-architect-form"
              disabled={saving}
              className="px-6 py-2 rounded-[14px] bg-[#171717] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-70 h-[38px]"
            >
              {saving ? <Spinner size="xs" color="white" dark={false} /> : <span className="material-symbols-outlined text-[14px]">verified</span>}
              {modalMode === "create" ? "Create Category" : "Commit Changes"}
            </button>
          </div>
        }
      >
        {modalMode === "edit" && selectedCategory && (
          <div className="flex items-center gap-4 mb-8 -mt-2 px-6 py-3 bg-[#FAF8F5] border border-[#E4DED6] rounded-2xl animate-fade-in w-fit mx-auto shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#77736E] font-black uppercase tracking-[0.2em]">Established</span>
              <span className="text-[12px] font-black text-[#171717] tracking-tight">
                {selectedCategory.createdAt ? dayjs(selectedCategory.createdAt).format("MMM D, YYYY") : "Initial Set"}
              </span>
            </div>
            <div className="w-px h-3 bg-[#E4DED6]" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#77736E] font-black uppercase tracking-[0.2em]">Pulse</span>
              <span className="flex items-center gap-1 text-[12px] font-black text-emerald-700 tracking-tight">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                {selectedCategory.updatedAt ? dayjs(selectedCategory.updatedAt).fromNow() : "Just Now"}
              </span>
            </div>
          </div>
        )}

        <form
          id="category-architect-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 animate-fade-in-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Creative Identity */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                  <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Category Details</label>
                </div>


                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                    <Input
                      dark={false}
                      label="Collection Name"
                      placeholder="e.g. Avant-Garde Essentials"
                      {...register("name", categoryRules.name)}
                      error={errors.name?.message}
                      className="placeholder:font-normal"
                    />
                    <div className="flex items-center bg-[#FAF8F5] border border-[#E4DED6] rounded-[16px] px-5 py-3.5 self-end mt-0.5 h-[56px] min-w-[200px]">
                      <div className="flex items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-emerald-600' : 'text-[#8a857d]'}`}>
                            {isActive ? 'visibility' : 'visibility_off'}
                          </span>
                          <span className="text-[12px] font-black text-[#171717] uppercase tracking-tight">Visibility</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsActive(!isActive)}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 outline-none ${isActive ? 'bg-[#171717]' : 'bg-[#D6CDBF]'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[13px] font-black text-[#171717] tracking-tight">Short Description</label>
                      <button
                        type="button"
                        disabled={generatingAI}
                        onClick={async () => {
                          const name = watch("name");
                          if (!name) {
                            return toast.error("Please name your category first to generate a narrative.");
                          }

                          setGeneratingAI(true);
                          const loadingToast = toast.loading("Neural Architect is thinking...");
                          try {
                            const res = await aiService.generateCategoryDescription(name);
                            if (res.data.success) {
                              setDescription(res.data.data.description);
                              toast.success("Narrative articulated successfully", { id: loadingToast });
                            } else {
                              toast.error(res.data.message || "Narrative generation failed", { id: loadingToast });
                            }
                          } catch (err) {
                            console.error("AI Generation Failed:", err);
                            const errMsg = err.response?.data?.message || "AI bridge failed. Ensure the backend is running and GROQ_API_KEY is saved.";
                            toast.error(errMsg, { id: loadingToast });
                          } finally {
                            setGeneratingAI(false);
                          }
                        }}
                        className={`flex items-center gap-1.5 bg-[#171717] hover:bg-[#292929] px-3.5 py-1.5 rounded-[12px] transition-all active:scale-95 shadow-sm text-white ${generatingAI ? 'opacity-60 cursor-wait' : ''}`}
                      >
                        <span className={`material-symbols-outlined text-[13px] text-white ${generatingAI ? 'animate-spin' : ''} transition-all`}>
                          {generatingAI ? 'progress_activity' : 'auto_awesome'}
                        </span>
                        <span className="text-[11px] font-bold text-white tracking-wide">
                          {generatingAI ? 'Generating...' : 'Generate Description'}
                        </span>
                      </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Articulate the essence of this collection..."
                      rows={3}
                      className="w-full bg-[#FAF8F5] hover:bg-white focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] rounded-[20px] p-5 text-[13px] font-medium text-[#171717] outline-none focus:ring-4 focus:ring-[#C9A77A]/15 transition-all resize-none shadow-sm placeholder:text-[#8a857d]"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                  <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Visual Identity</label>
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video w-full rounded-[24px] border-2 border-dashed border-[#D6CDBF] bg-[#FAF8F5] hover:bg-[#F1ECE5] hover:border-[#C9A77A] transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden shadow-sm"
                >
                  {generatingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1ECE5] animate-pulse">
                      <span className="material-symbols-outlined text-[#5f5a53] text-[32px] animate-spin" style={{ animationDuration: '2s' }}>progress_activity</span>
                      <p className="text-[10px] text-[#77736E] font-bold mt-3 uppercase tracking-wider">Neural Synthesis...</p>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover grayscale-[0.2] contrast-[1.05] hover:grayscale-0 transition-all duration-700"
                        onError={() => {
                          if (!isAiImage) {
                            setImagePreview(null);
                            toast.error("Image failed to load.");
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-[#171717]/55 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center z-30">
                        <span className="material-symbols-outlined text-white text-[24px] mb-2 animate-bounce">sync</span>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Update Identity</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white border border-[#E4DED6] shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-[#5f5a53] text-[24px]">landscape</span>
                      </div>
                      <p className="text-[12px] font-black text-[#171717] tracking-tight">Upload Creative Asset</p>
                      <p className="text-[10px] text-[#77736E] mt-1 font-medium tracking-tighter">Capture the collection's aesthetic (Max 5MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {/* AI Image Generation */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={generatingImage}
                    onClick={async () => {
                      const name = watch("name");
                      if (!name) return toast.error("Enter a category name first.");
                      setGeneratingImage(true);
                      const loadingToast = toast.loading("Generating AI image with Puter.js...");
                      try {
                        if (!window.puter?.ai?.txt2img) {
                          throw new Error("Puter.js not loaded. Please refresh the page.");
                        }
                        const prompt = `professional e-commerce product category banner for ${name}, clean white studio background, commercial photography, minimalist, high quality`;
                        // Puter.js returns an HTMLImageElement with a blob URL as .src
                        const imgElement = await window.puter.ai.txt2img(prompt);
                        const blobUrl = imgElement.src;

                        // Fetch the blob and convert to a File so Supabase upload works
                        const fetchRes = await fetch(blobUrl);
                        const blob = await fetchRes.blob();
                        const safeName = name.toLowerCase().replace(/\s+/g, "-");
                        const file = new File([blob], `ai-${safeName}-image.png`, { type: blob.type || "image/png" });
                        const previewUrl = URL.createObjectURL(blob);

                        setIsAiImage(true);
                        setImageFile(file);       // ← uploaded to Supabase on save
                        setImagePreview(previewUrl); // ← shown in preview box
                        toast.success("AI image generated!", { id: loadingToast });
                      } catch (err) {
                        console.error("Puter.js Image Error:", err);
                        toast.error(err.message || "Image generation failed. Try again.", { id: loadingToast });
                      } finally {
                        setGeneratingImage(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 bg-[#171717] hover:bg-[#292929] px-3.5 py-1.5 rounded-[12px] transition-all active:scale-95 shadow-sm text-white ${generatingImage ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    <span className={`material-symbols-outlined text-[13px] text-white ${generatingImage ? 'animate-spin' : ''}`}>
                      {generatingImage ? 'progress_activity' : 'auto_fix_high'}
                    </span>
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      {generatingImage ? 'Generating...' : 'Generate Image'}
                    </span>
                  </button>
                  <span className="text-[10px] text-[#77736E]">or click above to upload manually</span>
                </div>
              </section>
            </div>

            {/* Right Column: Architectural Variants */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                    <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Product Variant</label>
                  </div>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="px-5 py-2 rounded-[12px] bg-[#171717] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all flex items-center gap-2 shadow-sm h-[34px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> Add Attribute
                  </button>
                </div>

                <div className="bg-[#FAF8F5] rounded-[28px] p-6 border border-[#E4DED6] min-h-[300px] max-h-[480px] overflow-y-auto hide-scrollbar shadow-inner">
                  {variantConfig.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-[#E4DED6]">
                        <span className="material-symbols-outlined text-[#8a857d] text-[32px] animate-pulse">schema</span>
                      </div>
                      <p className="text-[12px] text-[#77736E] font-bold max-w-[200px] leading-relaxed uppercase tracking-tighter">No structural variants defined. Establish attributes like "Size" or "Tone".</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {variantConfig.map((attr, attrIndex) => (
                        <div key={attrIndex} className="bg-white rounded-[22px] p-5 border border-[#E4DED6] shadow-sm animate-fade-in-up">
                          <div className="flex items-center gap-2 mb-4">
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                              placeholder="Attribute Name (e.g. Size)"
                              className="flex-1 bg-transparent text-[14px] font-black text-[#171717] outline-none border-b-2 border-[#E4DED6] focus:border-[#C9A77A] transition-all pb-1 placeholder:font-medium placeholder:text-[#8a857d]"
                            />
                            <button
                              type="button"
                              onClick={() => removeAttribute(attrIndex)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#77736E] hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {attr.options.map((opt, optIndex) => (
                              <span
                                key={optIndex}
                                className="pl-3 pr-1.5 py-1 bg-[#F1ECE5] border border-[#E4DED6] text-[#171717] rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 group/opt animate-scale-in"
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => removeOption(attrIndex, optIndex)}
                                  className="w-4 h-4 rounded-full bg-[#171717]/10 hover:bg-[#171717]/20 flex items-center justify-center text-[#171717] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="relative group/input">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a857d] text-[16px] group-focus-within/input:text-[#171717] transition-colors">add_circle</span>
                            <input
                              type="text"
                              placeholder="Add option (press Enter)"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addOption(attrIndex, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              className="w-full bg-[#FAF8F5] rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-bold text-[#171717] placeholder:text-[#8a857d] outline-none focus:bg-white focus:ring-2 focus:ring-[#C9A77A]/20 transition-all border border-[#E4DED6] focus:border-[#C9A77A]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </form>
      </Modal>

      {/* Attribute Deletion Confirm Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={attrToDelete !== null}
        onClose={() => setAttrToDelete(null)}
        onConfirm={confirmRemoveAttribute}
        title="Remove Attribute"
        message="Are you sure you want to remove this attribute (e.g., Size, Color) from the category configuration? This will clear all defined options for this attribute."
        isDanger={true}
        confirmText="Remove Attribute"
      />

      {/* Option Deletion Confirm Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={optToDelete !== null}
        onClose={() => setOptToDelete(null)}
        onConfirm={confirmRemoveOption}
        title="Remove Option"
        message="Are you sure you want to remove this option? This will disconnect it from the attribute configuration."
        isDanger={true}
        confirmText="Remove Option"
      />

      {/* Main Delete Confirmation */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All products in this category will become uncategorized. This action is irreversible.`}
        loading={deleteLoading}
        isDanger={true}
      />
    </div>
  );
};
