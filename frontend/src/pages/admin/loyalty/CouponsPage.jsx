import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { couponsService, categoriesService, productsService, usersService } from "../../../services";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Spinner } from "../../../components/common/Spinner";
import { couponRules } from "../../../validations/coupon.validation";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";
import { formatPrice } from "../../../utils/formatters";

const PAGE_SIZE = 10;

export const CouponsPage = () => {
  // Data
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  // Advanced targeting
  const [targetType, setTargetType] = useState("all");
  const [targetCategoryIds, setTargetCategoryIds] = useState([]);
  const [targetProductIds, setTargetProductIds] = useState([]);

  // Catalogs for selection
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsSearch, setProductsSearch] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [selectedProductsData, setSelectedProductsData] = useState([]); // Keep names for rendering
  const [allProductsCache, setAllProductsCache] = useState(null); // Cache for search

  // Crowd targeting
  const [audienceType, setAudienceType] = useState("all");
  const [audienceUserIds, setAudienceUserIds] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [selectedUsersData, setSelectedUsersData] = useState([]);
  const [allUsersCache, setAllUsersCache] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  // Computed data
  const filtered = useMemo(() => {
    return filterBySearch(coupons, searchTerm, ["code"]);
  }, [coupons, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [res, catRes] = await Promise.all([
          couponsService.getAll(0, 1000),
          categoriesService.getAll()
        ]);
        setCoupons(res.data.data.coupons || []);
        setCategoriesList(catRes.data.data?.categories || catRes.data?.data || []);
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
    setSelectedCoupon(null);
    setTargetType("all");
    setTargetCategoryIds([]);
    setTargetProductIds([]);
    setSelectedProductsData([]);
    setAudienceType("all");
    setAudienceUserIds([]);
    setSelectedUsersData([]);
    setUsersSearch("");
    reset({
      code: "",
      discount: "",
      minCartValue: "",
    });
  };

  const openEditModal = async (coupon) => {
    setModalMode("edit");
    setSelectedCoupon(coupon);
    setTargetType(coupon.targetType || "all");
    setTargetCategoryIds(coupon.targetCategoryIds || []);
    setTargetProductIds(coupon.targetProductIds || []);

    setAudienceType(coupon.audienceType || "all");
    setAudienceUserIds(coupon.audienceUserIds || []);

    // Fetch specifically selected products' names for visual display if needed
    if (coupon.targetType === "product" && coupon.targetProductIds?.length > 0) {
      try {
        const pr = await productsService.getAll(0, 1000);
        if (pr.data?.data?.products) {
          setAllProductsCache(pr.data.data.products);
          setSelectedProductsData(pr.data.data.products.filter(p => coupon.targetProductIds.includes(p.id)));
        }
      } catch (e) { }
    } else {
      setSelectedProductsData([]);
    }

    // Fetch specifically selected users' names for visual display
    if (coupon.audienceType === "specific" && coupon.audienceUserIds?.length > 0) {
      try {
        const ur = await usersService.getAll(0, 1000);
        if (ur.data?.data?.users) {
          setAllUsersCache(ur.data.data.users);
          setSelectedUsersData(ur.data.data.users.filter(u => coupon.audienceUserIds.includes(u.id)));
        }
      } catch (e) { }
    } else {
      setSelectedUsersData([]);
    }

    reset({
      code: coupon.code,
      discount: coupon.discount,
      minCartValue: coupon.minCartValue,
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCoupon(null);
    reset();
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const submitData = {
        code: data.code,
        discount: parseFloat(data.discount),
        minCartValue: parseFloat(data.minCartValue),
        targetType,
        targetCategoryIds: targetType === 'category' ? targetCategoryIds : [],
        targetProductIds: targetType === 'product' ? targetProductIds : [],
        audienceType,
        audienceUserIds: audienceType === 'specific' ? audienceUserIds : [],
      };

      if (modalMode === "create") {
        await couponsService.create(submitData);
        toast.success("Coupon created successfully");
      } else {
        await couponsService.update(selectedCoupon.id, submitData);
        toast.success("Coupon updated successfully");
      }

      // Re-fetch coupons
      const res = await couponsService.getAll(0, 1000);
      setCoupons(res.data.data.coupons || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save coupon";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (targetType === "product" && productsSearch.length > 1) {
      const dbounce = setTimeout(async () => {
        try {
          let cache = allProductsCache;
          if (!cache) {
            const res = await productsService.getAll(0, 1000);
            cache = res.data?.data?.products || [];
            setAllProductsCache(cache);
          }

          const lowerQ = productsSearch.toLowerCase();
          const filtered = cache
            .filter(p => p.name.toLowerCase().includes(lowerQ) || (p.sku && p.sku.toLowerCase().includes(lowerQ)))
            .slice(0, 10);

          setProductsList(filtered);
        } catch (e) {
          console.error("Search failed");
        }
      }, 300);
      return () => clearTimeout(dbounce);
    } else {
      setProductsList([]);
    }
  }, [productsSearch, targetType, allProductsCache]);

  const toggleCategory = (catId) => {
    setTargetCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const addProduct = (p) => {
    if (!targetProductIds.includes(p.id)) {
      setTargetProductIds(prev => [...prev, p.id]);
      setSelectedProductsData(prev => [...prev, p]);
    }
    setProductsSearch("");
  };

  const removeProduct = (id) => {
    setTargetProductIds(prev => prev.filter(pid => pid !== id));
    setSelectedProductsData(prev => prev.filter(p => p.id !== id));
  };

  // User search effect
  useEffect(() => {
    if (audienceType === "specific" && usersSearch.length > 1) {
      const dbounce = setTimeout(async () => {
        try {
          let cache = allUsersCache;
          if (!cache) {
            const res = await usersService.getAll(0, 1000);
            cache = res.data?.data?.users || [];
            setAllUsersCache(cache);
          }
          const lowerQ = usersSearch.toLowerCase();
          const filtered = cache
            .filter(u => u.name.toLowerCase().includes(lowerQ) || u.email.toLowerCase().includes(lowerQ))
            .slice(0, 10);
          setUsersList(filtered);
        } catch (e) {
          console.error("User search failed");
        }
      }, 300);
      return () => clearTimeout(dbounce);
    } else {
      setUsersList([]);
    }
  }, [usersSearch, audienceType, allUsersCache]);

  const addUser = (u) => {
    if (!audienceUserIds.includes(u.id)) {
      setAudienceUserIds(prev => [...prev, u.id]);
      setSelectedUsersData(prev => [...prev, u]);
    }
    setUsersSearch("");
  };

  const removeUser = (id) => {
    setAudienceUserIds(prev => prev.filter(uid => uid !== id));
    setSelectedUsersData(prev => prev.filter(u => u.id !== id));
  };

  // Delete handler
  const openDeleteDialog = (coupon) => {
    setDeleteTarget(coupon);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await couponsService.delete(deleteTarget.id);
      setCoupons(coupons.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Coupon deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete coupon";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    try {
      exportTablePDF(
        "Coupons Report",
        [
          { label: "Code", key: "code" },
          { label: "Discount", key: "discount" },
          { label: "Min Cart Value", key: "minCartValue", format: "price" },
        ],
        filtered,
        "coupons-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  const calculateAverageDiscount = () => {
    if (coupons.length === 0) return 0;
    const total = coupons.reduce((acc, curr) => acc + (curr.discount || 0), 0);
    return (total / coupons.length).toFixed(1);
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
            onClick={handleExportPDF}
            className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] active:scale-95 flex items-center gap-2"
            title="Export Report"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Export PDF
          </button>
          <button
            onClick={openCreateModal}
            className="h-11 px-6 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/30 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] font-semibold">add</span> Add Coupon
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
            placeholder="Search coupon codes..."
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-[13px] font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Main List Container (Detached Rows) */}
      <div>
        {/* Floating Header Row */}
        <div className="hidden md:flex py-3 px-5 mb-2.5 rounded-2xl admin-table-header text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em]">
          <div className="w-[30%]">Coupon Code</div>
          <div className="w-[25%] text-left">Discount Amount</div>
          <div className="w-[30%] text-left">Minimum Cart Value</div>
          <div className="w-[15%] text-center">Actions</div>
        </div>

        {/* Transaction Items */}
        <div className="space-y-3">
          {paginated.data.length === 0 ? (
            <div className="py-20 bg-white rounded-[24px] text-center text-[#77736E] font-medium border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
              No active coupons found.
            </div>
          ) : (
            paginated.data.map((row) => (
              <div key={row.id} className="flex flex-col md:flex-row md:items-center py-4 px-5 admin-card rounded-[20px] transition-all duration-300 gap-4 md:gap-0 group">

                {/* Coupon Code Column */}
                <div className="w-full md:w-[30%] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden bg-[#F1ECE5] border border-[#E4DED6] shrink-0 group-hover:bg-[#171717] group-hover:text-white group-hover:border-[#171717] text-[#171717] transition-all">
                    <span className="material-symbols-outlined text-[19px]">local_activity</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-extrabold tracking-wider text-[15px] leading-tight text-[#171717] uppercase truncate">{row.code || "UNKNOWN"}</h4>
                  </div>
                </div>

                {/* Discount Column */}
                <div className="w-full md:w-[25%] font-headline font-bold text-[14px] flex justify-between md:block">
                  <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Discount</span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 text-sky-800 rounded-full border border-sky-200 font-bold tracking-wider text-[12px]">
                      <span className="material-symbols-outlined text-[14px]">sell</span>
                      {row.discount}% OFF
                    </span>
                  </div>
                </div>

                {/* Min Cart Value Column */}
                <div className="w-full md:w-[30%] text-[13px] text-[#171717] font-bold flex justify-between md:block">
                  <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Min Threshold</span>
                  <div className="flex flex-col justify-center">
                    <span className="text-[14px] font-headline text-[#171717]">{formatPrice(row.minCartValue)}</span>
                    <span className="text-[10px] text-[#77736E] uppercase tracking-widest font-medium">LKR Requirement</span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="w-full md:w-[15%] flex justify-end md:justify-center items-center gap-1.5 relative mt-2 md:mt-0">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(row); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-colors rounded-xl" title="Edit">
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openDeleteDialog(row); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#5f5a53] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors rounded-xl" title="Delete">
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats & Pagination */}
      <div className="admin-card rounded-[24px] p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 md:gap-12 w-full lg:w-auto">
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1">Total Active Coupons</p>
            <p className="text-[22px] font-headline font-extrabold text-[#171717] leading-none">{coupons.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1">Average Discount Limit</p>
            <p className="text-[22px] font-headline font-extrabold text-[#171717] leading-none">{calculateAverageDiscount()}%</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#77736E] font-medium">Showing coupons in vault</span>
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

      {/* Architect Modal */}
      <Modal
        dark={false}
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === "create" ? "Add Coupon" : "Revise Coupon"}
        size="lg"
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
              form="coupon-architect-form"
              disabled={saving}
              className="px-6 py-2 rounded-[14px] bg-[#171717] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-70 h-[38px]"
            >
              {saving ? <Spinner size="xs" color="white" dark={false} /> : <span className="material-symbols-outlined text-[14px]">verified</span>}
              {modalMode === "create" ? "Make Coupon" : "Commit Changes"}
            </button>
          </div>
        }
      >
        <form
          id="coupon-architect-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 animate-fade-in-up pb-4"
        >
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Promotion Configuration</label>
              </div>

              <div className="space-y-5">
                <div className="relative text-left">
                  <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Marketing Code</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[18px]">qr_code</span>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME20"
                      {...register("code", couponRules.code)}
                      className={`w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.code ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-black uppercase focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                    />
                  </div>
                  {errors.code && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.code.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative text-left">
                    <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Percentage Cut</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[18px]">price_change</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register("discount", couponRules.discount)}
                        className={`w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.discount ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] pl-11 pr-10 py-3.5 text-[14px] font-black focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[14px] pointer-events-none">%</span>
                    </div>
                    {errors.discount && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.discount.message}</p>}
                  </div>

                  <div className="relative text-left">
                    <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Spend(LKR)</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[18px]">shopping_cart_checkout</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register("minCartValue", couponRules.minCartValue)}
                        className={`w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.minCartValue ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-black focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                      />
                    </div>
                    {errors.minCartValue && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.minCartValue.message}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Context targeting block */}
            <section className="pt-6 border-t border-[#EFEAE2]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Target Products</label>
              </div>

              <div className="flex gap-4 mb-6">
                {['all', 'category', 'product'].map((type) => (
                  <label key={type} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${targetType === type ? 'border-[#171717] bg-[#F1ECE5] shadow-sm' : 'border-[#E4DED6] bg-[#FAF8F5] hover:border-[#D6CDBF] hover:bg-white'}`}>
                    <input type="radio" value={type} checked={targetType === type} onChange={() => setTargetType(type)} className="sr-only" />
                    <span className="material-symbols-outlined mb-1 text-[#171717]">{type === 'all' ? 'all_inclusive' : type === 'category' ? 'category' : 'inventory_2'}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#171717]">{type === 'all' ? 'All Products' : type === 'category' ? 'Categories' : 'Products'}</span>
                  </label>
                ))}
              </div>

              {targetType === 'category' && (
                <div className="animate-fade-in space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#77736E] mb-2">Select Active Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map(cat => {
                      const isSelected = targetCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${isSelected ? 'bg-[#171717] text-white border-[#171717]' : 'bg-white text-[#5f5a53] border-[#E4DED6] hover:border-[#D6CDBF] hover:bg-[#FAF8F5]'}`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetType === 'product' && (
                <div className="animate-fade-in space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#77736E] mb-2">Search & Add Products</p>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[18px]">search</span>
                    <input
                      type="text"
                      value={productsSearch}
                      onChange={(e) => setProductsSearch(e.target.value)}
                      placeholder="Type product name or SKU..."
                      className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] pl-11 pr-4 py-3 text-[13px] font-semibold focus:ring-2 focus:ring-[#C9A77A]/20 focus:border-[#C9A77A] outline-none transition-all"
                    />
                    {productsList.length > 0 && productsSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E4DED6] rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto w-full p-2">
                        {productsList.map(p => (
                          <button type="button" onClick={() => addProduct(p)} key={p.id} className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] rounded-lg flex items-center justify-between group gap-3 border-b border-[#EFEAE2] last:border-0">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded shadow-sm border border-[#E4DED6]" />
                              ) : (
                                <div className="w-10 h-10 bg-[#F1ECE5] rounded flex items-center justify-center border border-[#E4DED6]">
                                  <span className="material-symbols-outlined text-[#77736E] text-[18px]">image</span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#171717] line-clamp-1">{p.name}</span>
                                <span className="text-[10px] flex items-center gap-1 font-black text-indigo-700 uppercase tracking-widest">{p.sku} • {p.price ? `LKR ${p.price.toFixed(2)}` : ''}</span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-[#8a857d] group-hover:text-[#171717] transition-colors">add_circle</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedProductsData.length > 0 && (
                    <div className="mt-4 p-4 bg-[#FAF8F5] rounded-[16px] border border-[#E4DED6]">
                      <p className="text-[10px] text-[#77736E] uppercase tracking-widest font-bold mb-3">Selected Products ({selectedProductsData.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProductsData.map(p => (
                          <div key={p.id} className="px-3 py-1.5 bg-white border border-[#E4DED6] rounded-lg flex items-center gap-2 shadow-sm">
                            <span className="text-[12px] font-bold text-[#171717] max-w-[150px] truncate">{p.name}</span>
                            <button type="button" onClick={() => removeProduct(p.id)} className="text-[#8a857d] hover:text-red-600 transition-colors flex items-center">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </section>

            {/* Audience targeting block */}
            <section className="pt-6 border-t border-[#EFEAE2]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#C9A77A] rounded-full" />
                <label className="text-[12px] font-bold text-[#77736E] uppercase tracking-[0.2em]">Target Crowd</label>
              </div>

              <div className="flex gap-4 mb-6">
                {[
                  { id: 'all', label: 'All Customers', icon: 'groups' },
                  { id: 'new', label: 'New Customers', icon: 'person_add' },
                  { id: 'specific', label: 'Specific Users', icon: 'person_search' }
                ].map((aud) => (
                  <label key={aud.id} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${audienceType === aud.id ? 'border-[#171717] bg-[#F1ECE5] shadow-sm' : 'border-[#E4DED6] bg-[#FAF8F5] hover:border-[#D6CDBF] hover:bg-white'}`}>
                    <input type="radio" value={aud.id} checked={audienceType === aud.id} onChange={() => setAudienceType(aud.id)} className="sr-only" />
                    <span className="material-symbols-outlined mb-1 text-[#171717]">{aud.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#171717]">{aud.label}</span>
                  </label>
                ))}
              </div>

              {audienceType === 'new' && (
                <div className="animate-fade-in p-4 bg-indigo-50 rounded-2xl border border-indigo-200 flex items-center gap-4">
                  <span className="material-symbols-outlined text-indigo-700 text-[24px]">info</span>
                  <p className="text-[12px] font-bold text-indigo-900 italic">This coupon will only be valid for customers who have never placed an order.</p>
                </div>
              )}

              {audienceType === 'specific' && (
                <div className="animate-fade-in space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#77736E] mb-2">Search & Add Customers</p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[18px]">search</span>
                    <input
                      type="text"
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] pl-11 pr-4 py-3 text-[13px] font-semibold focus:ring-2 focus:ring-[#C9A77A]/20 focus:border-[#C9A77A] outline-none transition-all"
                    />
                    {usersList.length > 0 && usersSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E4DED6] rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto w-full p-2">
                        {usersList.map(u => (
                          <button type="button" onClick={() => addUser(u)} key={u.id} className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] rounded-lg flex items-center justify-between group gap-3 border-b border-[#EFEAE2] last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F1ECE5] border border-[#E4DED6] rounded-full flex items-center justify-center text-[11px] font-black uppercase text-[#5f5a53]">{u.name?.charAt(0)}</div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#171717] line-clamp-1">{u.name}</span>
                                <span className="text-[10px] text-[#77736E]">{u.email}</span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-[#8a857d] group-hover:text-[#171717] transition-colors">add_circle</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedUsersData.length > 0 && (
                    <div className="mt-4 p-4 bg-[#FAF8F5] rounded-[16px] border border-[#E4DED6]">
                      <p className="text-[10px] text-[#77736E] uppercase tracking-widest font-bold mb-3">Selected Customers ({selectedUsersData.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsersData.map(u => (
                          <div key={u.id} className="px-3 py-1.5 bg-white border border-[#E4DED6] rounded-lg flex items-center gap-2 shadow-sm">
                            <span className="text-[12px] font-bold text-[#171717] max-w-[150px] truncate">{u.name}</span>
                            <button type="button" onClick={() => removeUser(u.id)} className="text-[#8a857d] hover:text-red-600 transition-colors flex items-center">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Revoke Coupon"
        message={`Are you sure you want to completely revoke the promotional code "${deleteTarget?.code}"? All active users will immediately lose access to this promotion.`}
        loading={deleteLoading}
        isDanger={true}
        confirmText="Confirm Revocation"
      />
    </div>
  );
};
