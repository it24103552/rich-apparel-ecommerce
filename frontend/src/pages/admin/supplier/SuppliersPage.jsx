import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { suppliersService, restockRequestService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { ModalPortal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { supplierRules } from "../../../validations/supplier.validation";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";

const PAGE_SIZE = 10;

export const SuppliersPage = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const hasAccess = (...roles) => isAdmin || roles.includes(userRole);
  const canManageSuppliers = hasAccess('supplier manager');

  // Data
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Restock Requests State
  const [activeTab, setActiveTab] = useState("suppliers"); // 'suppliers' | 'restock'
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null); // id of request being updated

  // Search / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewSupplier, setViewSupplier] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Dynamic Product Types State
  const [productTypesList, setProductTypesList] = useState([]);
  const [newProductType, setNewProductType] = useState("");

  const handleAddProductType = () => {
    if (newProductType.trim() && !productTypesList.includes(newProductType.trim())) {
      setProductTypesList([...productTypesList, newProductType.trim()]);
      setNewProductType("");
    }
  };

  const handleRemoveProductType = (typeToRemove) => {
    setProductTypesList(productTypesList.filter(t => t !== typeToRemove));
  };

  // Dynamic Payment State
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankDetails, setBankDetails] = useState({ bankName: "", accountHolderName: "", accountNo: "", branch: "" });

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
    const searchableSuppliers = suppliers.map(s => ({
      ...s,
      supplierId: s.supplierId || `SUP-${s.id.substring(s.id.length - 6).toUpperCase()}`
    }));
    return filterBySearch(searchableSuppliers, searchTerm, ["supplierId", "name", "email", "phone"]);
  }, [suppliers, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await suppliersService.getAll(0, 1000);
        setSuppliers(res.data.data.suppliers || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchRestockRequests = async (showLoading = true) => {
    if (showLoading) setRestockLoading(true);
    try {
      const res = await restockRequestService.getAll();
      setRestockRequests(res.data.data || []);
    } catch (err) {
      if (showLoading) toast.error("Failed to fetch restock requests");
    } finally {
      if (showLoading) setRestockLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "restock") {
      fetchRestockRequests();
    }
  }, [activeTab]);

  // Real-time polling for restock requests
  useEffect(() => {
    // Initial fetch to get the badge count updated if not on restock tab
    fetchRestockRequests(false);
    
    const interval = setInterval(() => {
      fetchRestockRequests(false);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRestockAction = async (id, action) => {
    setUpdatingStatus(id);
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await restockRequestService.approve(id);
          toast.success("Request approved");
          break;
        case 'process':
          response = await restockRequestService.process(id);
          toast.success("Processing started");
          break;
        case 'complete':
          response = await restockRequestService.complete(id);
          toast.success("Marked as completed");
          break;
        case 'Rejected':
          response = await restockRequestService.updateStatus(id, 'Rejected');
          toast.success("Request rejected");
          break;
        default:
          response = await restockRequestService.updateStatus(id, action);
          toast.success(`Status updated to ${action}`);
      }
      fetchRestockRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Modal handlers
  const generateSupplierId = () => {
    const chars = '0123456789ABCDEF';
    let result = 'SUP-';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedSupplier(null);
    setProductTypesList([]);
    setNewProductType("");
    setPaymentMethod("");
    setBankDetails({ bankName: "", accountHolderName: "", accountNo: "", branch: "" });
    setImageFile(null);
    setImagePreview(null);
    reset({
      supplierId: generateSupplierId(),
      name: "",
      type: "Local",
      email: "",
      phone: "",
      address: "",
      description: "",
    });
  };

  const openEditModal = (supplier) => {
    setModalMode("edit");
    setSelectedSupplier(supplier);

    const types = supplier.productTypes ? supplier.productTypes.split(",").map(t => t.trim()).filter(Boolean) : [];
    setProductTypesList(types);
    setNewProductType("");

    let method = "";
    let parsedBank = { bankName: "", accountHolderName: "", accountNo: "", branch: "" };
    if (supplier.paymentInfo) {
      try {
        const parsed = JSON.parse(supplier.paymentInfo);
        method = parsed.method || "";
        parsedBank = {
          bankName: parsed.bankName || "",
          accountHolderName: parsed.accountHolderName || "",
          accountNo: parsed.accountNo || "",
          branch: parsed.branch || "",
        };
      } catch (e) {
        console.error("Failed to parse payment info");
      }
    }
    setPaymentMethod(method);
    setBankDetails(parsedBank);
    setImageFile(null);
    setImagePreview(supplier.imageUrl || null);

    reset({
      supplierId: supplier.supplierId || generateSupplierId(),
      name: supplier.name,
      type: supplier.type || "Local",
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || "",
      description: supplier.description || "",
    });
  };

  const openViewModal = (supplier) => {
    setViewSupplier(supplier);
  };

  const closeViewModal = () => {
    setViewSupplier(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
    reset();
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("type", data.type || "Local");
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      if (data.address) formData.append("address", data.address);
      if (data.description) formData.append("description", data.description);

      // Dynamic arrays mapping
      formData.append("productTypes", productTypesList.join(", "));

      let payData = { method: paymentMethod };
      if (paymentMethod === "Bank Deposit" || paymentMethod === "Online Bank") {
        payData = { ...payData, ...bankDetails };
      }
      formData.append("paymentInfo", JSON.stringify(payData));

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imagePreview && modalMode === "edit") {
        // preserve url on update if not changed
        formData.append("imageUrl", imagePreview);
      }

      if (modalMode === "create") {
        await suppliersService.create(formData);
        toast.success("Supplier created successfully");
      } else {
        await suppliersService.update(selectedSupplier.id, formData);
        toast.success("Supplier updated successfully");
      }

      // Re-fetch suppliers
      const res = await suppliersService.getAll(0, 1000);
      setSuppliers(res.data.data.suppliers || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save supplier";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const openDeleteDialog = (supplier) => {
    setDeleteTarget(supplier);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await suppliersService.delete(deleteTarget.id);
      setSuppliers(suppliers.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Supplier deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete supplier";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    try {
      exportTablePDF(
        "Suppliers Report",
        [
          { label: "Supplier Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
        ],
        filtered,
        "suppliers-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  // Table columns
  const columns = [
    { key: "name", label: "Supplier Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ];

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-end pt-1">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {activeTab === "suppliers" && (
            <>
              <button
                onClick={handleExportPDF}
                className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                Export PDF
              </button>
              {canManageSuppliers && (
                <button
                  onClick={openCreateModal}
                  className="h-11 px-6 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/30 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] font-semibold">add</span>
                  <span>Add Supplier</span>
                </button>
              )}
            </>
          )}
          {activeTab === "restock" && (
            <button
              onClick={fetchRestockRequests}
              disabled={restockLoading}
              className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${restockLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh Requests
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Premium Multi-Filter Console with Tabs */}
      <div className="admin-card rounded-[24px] p-3.5 flex flex-col xl:flex-row gap-3 xl:items-center">
        {/* Tab Switcher */}
        <div className="flex bg-[#F1ECE5] p-1 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar border border-[#E4DED6]">
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all ${activeTab === "suppliers" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717]'}`}
          >
            Sourcing Partners
          </button>
          <button
            onClick={() => setActiveTab("restock")}
            className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${activeTab === "restock" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717]'}`}
          >
            Inventory Requests
            {restockRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === "restock" ? 'bg-white text-[#171717]' : 'bg-red-600 text-white'}`}>
                {restockRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>

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
            placeholder={activeTab === "suppliers" ? "Search partners by ID, name, or contact..." : "Search requests by product name or ID..."}
            className="w-full bg-[#FAF8F5] hover:bg-white focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl py-2.5 pl-11 pr-4 text-[13.5px] font-medium transition-all outline-none text-[#171717] placeholder-[#8a857d] h-12"
          />
        </div>
      </div>

      {/* Main List Container (Detached Rows) */}
      <div>
        {activeTab === "suppliers" ? (
          <>
            {/* Floating Header Row */}
            <div className="hidden md:flex py-3 px-5 mb-2.5 rounded-2xl admin-table-header text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em]">
              <div className="w-[40%]">Supplier Identity</div>
              <div className="w-[25%] text-left">Email Address</div>
              <div className="w-[20%] text-left">Phone Network</div>
              <div className="w-[15%] text-center px-4">Actions</div>
            </div>

            {/* Supplier Items */}
            <div className="space-y-3">
              {paginated.data.length === 0 ? (
                <div className="py-20 bg-white rounded-[24px] text-center text-[#77736E] font-medium border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
                  No suppliers found matching your criteria.
                </div>
              ) : (
                paginated.data.map((supplier) => (
                  <div key={supplier.id} className="flex flex-col md:flex-row md:items-center py-4 px-5 admin-card rounded-[20px] transition-all duration-300 gap-4 md:gap-0 group">
                    <div
                      className="w-full md:w-[40%] flex items-center gap-4 cursor-pointer group/item"
                      onClick={() => openViewModal(supplier)}
                    >
                      {supplier.imageUrl ? (
                        <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden shrink-0">
                          <img src={supplier.imageUrl} alt={supplier.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] flex items-center justify-center border border-[#E4DED6] shrink-0 transition-all">
                          <span className="material-symbols-outlined text-[20px] text-[#5f5a53] group-hover:text-[#171717] transition-colors duration-300">
                            store
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-headline font-bold text-[15px] leading-tight text-[#171717] truncate">{supplier.name}</h4>
                        <p className="text-[10px] text-[#77736E] font-bold tracking-widest uppercase mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#F1ECE5] border border-[#E4DED6] rounded-md text-[#292929] font-mono">
                            {supplier.supplierId || `SUP-${supplier.id.substring(supplier.id.length - 6).toUpperCase()}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest border ${supplier.type === 'Foreign' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                            {supplier.type || 'LOCAL'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-[25%] text-[13px] text-[#292929] font-medium flex justify-between md:block items-center">
                      <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Email Address</span>
                      <div className="flex items-center gap-1.5 hover:text-[#171717] transition-colors cursor-pointer group/mail" title="Send Email">
                        {supplier.email || <span className="text-[#8a857d] italic">Not Provided</span>}
                      </div>
                    </div>

                    <div className="w-full md:w-[20%] text-[13px] text-[#292929] font-medium flex justify-between md:block items-center font-mono">
                      <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Contact Number</span>
                      <div className="flex items-center gap-1.5 hover:text-[#171717] transition-colors cursor-pointer group/phone" title="Call Supplier">
                        {supplier.phone || <span className="text-[#8a857d] italic font-sans">Not Provided</span>}
                      </div>
                    </div>

                    <div className="w-full md:w-[15%] flex justify-end md:justify-center items-center gap-1.5 relative mt-2 md:mt-0">
                      <button onClick={() => openViewModal(supplier)} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-colors rounded-xl" title="View">
                        <span className="material-symbols-outlined text-[17px]">visibility</span>
                      </button>
                      {canManageSuppliers && (
                        <>
                          <button onClick={() => openEditModal(supplier)} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-colors rounded-xl" title="Edit">
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button onClick={() => openDeleteDialog(supplier)} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#5f5a53] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors rounded-xl" title="Delete">
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Restock Requests Tab View */}
            <div className="hidden md:flex py-3 px-6 rounded-2xl admin-table-header text-[10px] font-bold text-[#77736E] uppercase tracking-widest mb-2.5 mt-4">
              <div className="w-[30%]">Product Information</div>
              <div className="w-[15%] text-left">Quantity</div>
              <div className="w-[20%] text-left">Requested By</div>
              <div className="w-[15%] text-left">Status</div>
              <div className="w-[20%] text-center px-4">Actions</div>
            </div>

            <div className="space-y-3">
              {restockLoading ? (
                <div className="py-12 bg-white rounded-3xl text-center flex flex-col items-center gap-3 border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] mt-4">
                  <Spinner dark={false} size="md" />
                  <p className="text-[11px] font-black text-[#77736E] uppercase tracking-widest">Loading Requests...</p>
                </div>
              ) : restockRequests.length === 0 ? (
                <div className="py-12 bg-white rounded-3xl text-center text-[#77736E] font-medium border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] mt-4">
                  No active restock requests.
                </div>
              ) : (
                restockRequests.map((request) => (
                  <div key={request.id} className="flex flex-col md:flex-row md:items-center py-4 px-6 bg-white border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] hover:border-[#D6CDBF] hover:shadow-[0_8px_24px_rgba(23,23,23,0.06)] rounded-[20px] transition-all duration-300 gap-4 md:gap-0">
                    <div className="w-full md:w-[30%] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[12px] bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden flex items-center justify-center shrink-0">
                        {request.product.imageUrl ? (
                          <img src={request.product.imageUrl} alt={request.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[#77736E]">inventory_2</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-headline font-bold text-[14px] leading-tight text-[#171717]">{request.product.name}</h4>
                        <p className="text-[9px] text-[#77736E] font-black tracking-widest uppercase mt-0.5">SKU: {request.product.sku}</p>
                      </div>
                    </div>

                    <div className="w-full md:w-[15%]">
                      <p className="text-[15px] font-black text-[#171717]">{request.quantity} Units</p>
                      <p className="text-[9px] text-[#77736E] font-bold uppercase tracking-widest">Requested</p>
                    </div>

                    <div className="w-full md:w-[20%]">
                      <p className="text-[13px] font-bold text-[#171717]">{request.requestedBy.name}</p>
                      <p className="text-[9px] text-[#77736E] font-bold uppercase tracking-widest">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="w-full md:w-[15%]">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        request.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        request.status === 'Approved' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                        request.status === 'Processing' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        request.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        request.status === 'Closed' ? 'bg-[#F1ECE5] text-[#5f5a53] border-[#E4DED6]' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {request.status === 'Closed' ? 'FULFILLED' : request.status}
                      </span>
                    </div>

                    <div className="w-full md:w-[20%] flex justify-end md:justify-center items-center gap-2">
                      <button
                        onClick={() => openViewModal(request.product.supplier)}
                        disabled={!request.product.supplier}
                        className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E4DED6] text-[#292929] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#F1ECE5] transition-all active:scale-95 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="Contact Supplier"
                      >
                        <span className="material-symbols-outlined text-[16px]">contact_phone</span>
                        <span>Contact</span>
                      </button>
                      {hasAccess("admin", "supplier manager") ? (
                        <>
                          {request.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleRestockAction(request.id, 'approve')}
                                disabled={updatingStatus === request.id}
                                className="px-4 py-1.5 bg-[#171717] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRestockAction(request.id, 'Rejected')}
                                disabled={updatingStatus === request.id}
                                className="px-4 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 active:scale-95"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'Approved' && (
                            <button
                              onClick={() => handleRestockAction(request.id, 'process')}
                              disabled={updatingStatus === request.id}
                              className="px-6 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                            >
                              <span>Start Processing</span>
                              <span className="material-symbols-outlined text-[14px]">forklift</span>
                            </button>
                          )}
                          {request.status === 'Processing' && (
                            <button
                              onClick={() => handleRestockAction(request.id, 'complete')}
                              disabled={updatingStatus === request.id}
                              className="px-6 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                            >
                              <span>Mark Completed</span>
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            </button>
                          )}
                          {(request.status === 'Completed' || request.status === 'Closed') && (
                            <div className="flex items-center gap-2 text-emerald-700">
                              <span className="material-symbols-outlined text-[20px]">verified</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{request.status === 'Completed' ? 'Stock Ready' : 'Fulfillment Complete'}</span>
                            </div>
                          )}
                          {request.status === 'Rejected' && (
                            <div className="flex items-center gap-2 text-red-600">
                              <span className="material-symbols-outlined text-[20px]">cancel</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Cancelled</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#77736E]">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">View Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* custom pagination style */}
        {paginated.pages > 0 && (
          <div className="mt-8 pt-6 border-t border-[#E4DED6] flex flex-col md:flex-row justify-between items-center gap-4 px-2">
            <div className="text-[10px] font-bold text-[#77736E] uppercase tracking-widest">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} suppliers
            </div>

            {paginated.pages > 1 && (
              <div className="mt-4 md:mt-0">
                <Pagination
                  dark={false}
                  currentPage={page}
                  totalPages={paginated.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ModalPortal
        isOpen={!!modalMode}
        onClose={closeModal}
        backdropClassName="bg-[#171717]/40 backdrop-blur-sm transition-opacity duration-300"
        containerClassName="p-4"
      >
        {modalMode && (
          <div className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-[0_24px_64px_rgba(23,23,23,0.18)] border border-[#E4DED6] overflow-hidden transform transition-all duration-500 scale-100 opacity-100 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-[#E4DED6] bg-[#FAF8F5] sticky top-0 z-10">
              <div className="flex items-center gap-6">
                {/* Image Upload Avatar */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border-2 ${imagePreview ? 'border-[#C9A77A]' : 'border-[#D6CDBF] border-dashed bg-white'} overflow-hidden transition-all`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Supplier Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-[#77736E] group-hover:text-[#171717] transition-colors">add_photo_alternate</span>
                    )}
                    <div className="absolute inset-0 bg-[#171717]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold tracking-wider backdrop-blur-[2px]">
                      CHANGE
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
                <div>
                  <h2 className="text-[20px] font-black font-headline tracking-tight text-[#171717]">
                    {modalMode === "create" ? "Add New Supplier" : "Edit Supplier Profile"}
                  </h2>
                  <p className="text-[13px] text-[#77736E] font-medium mt-0.5">
                    {modalMode === "create" ? "Establish a new supply chain partner." : "Update business and contact information."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#77736E] hover:text-[#171717] hover:bg-[#F1ECE5] transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">

                {/* Column 1: Core Identity & Contact */}
                <div className="flex-1 space-y-6">
                  <div className="bg-[#FAF8F5] rounded-[24px] p-6 border border-[#E4DED6]">
                    <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#9A7B4A]">badge</span>
                      Identity & Contact
                    </h3>

                    <div className="space-y-5">
                      {/* Name */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Supplier Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Apex Manufacturing Inc."
                          {...register("name", supplierRules.name)}
                          className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.name ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                        />
                        {errors.name && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.name.message}</p>}
                      </div>

                      {/* Supplier ID */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Supplier ID *</label>
                        <input
                          type="text"
                          placeholder="SUP-000000"
                          maxLength={10}
                          {...register("supplierId", supplierRules.supplierId)}
                          onChange={(e) => {
                            e.target.value = e.target.value.toUpperCase();
                            register("supplierId").onChange(e);
                          }}
                          className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.supplierId ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-mono font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                        />
                        {errors.supplierId && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.supplierId.message}</p>}
                      </div>

                      {/* Type & Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Type */}
                        <div>
                          <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Supplier Origin</label>
                          <div className="relative">
                            <select
                              {...register("type")}
                              className="w-full bg-white text-[#171717] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px] appearance-none cursor-pointer"
                            >
                              <option value="Local" className="bg-white text-[#171717]">Local Supplier</option>
                              <option value="Foreign" className="bg-white text-[#171717]">Foreign Supplier</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Email Address *</label>
                          <input
                            type="email"
                            placeholder="contact@supplier.com"
                            {...register("email", supplierRules.email)}
                            className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.email ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                          />
                          {errors.email && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.email.message}</p>}
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder={watch("type") === "Foreign" ? "+1 (555) 000-0000" : "0771234567"}
                          maxLength={watch("type") === "Foreign" ? 15 : ((watch("phone") || "").startsWith("+") ? 12 : 10)}
                          {...register("phone", supplierRules.phone)}
                          onInput={(e) => { e.target.value = e.target.value.replace(/[^\d+]/g, ''); }}
                          className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.phone ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-mono focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]`}
                        />
                        {errors.phone && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.phone.message}</p>}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Physical Address</label>
                        <textarea
                          placeholder="Full street address, city, and zip..."
                          rows="3"
                          {...register("address", supplierRules.address)}
                          className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.address ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all resize-none`}
                        />
                        {errors.address && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.address.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Business & Operations */}
                <div className="flex-1 space-y-6">
                  <div className="bg-[#FAF8F5] rounded-[24px] p-6 border border-[#E4DED6] h-full">
                    <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#9A7B4A]">domain</span>
                      Business Operations
                    </h3>

                    <div className="space-y-5">
                      {/* Dynamic Product Types via Pill Tags */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Product Categories Provided</label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newProductType}
                            onChange={(e) => setNewProductType(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddProductType();
                              }
                            }}
                            placeholder="e.g. Women, Men, Sporty, Fabrics..."
                            className="flex-1 bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                          />
                          <button
                            type="button"
                            onClick={handleAddProductType}
                            className="h-[52px] px-6 rounded-[14px] bg-[#171717] hover:bg-[#292929] text-white font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {productTypesList.map((type, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-[#E4DED6] shadow-sm text-[#171717] px-3 py-2 rounded-xl text-[13px] font-bold animate-fade-in">
                              {type}
                              <button type="button" onClick={() => handleRemoveProductType(type)} className="text-[#77736E] hover:text-red-600 transition-colors bg-[#F1ECE5] hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          ))}
                          {productTypesList.length === 0 && (
                            <p className="text-[12px] text-[#77736E] font-medium italic py-2">No categories assigned. Add above.</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Internal Notes & Description</label>
                        <textarea
                          placeholder="Lead times, reliability notes, main contact persons..."
                          rows="4"
                          {...register("description", supplierRules.description)}
                          className={`w-full bg-white text-[#171717] placeholder:text-[#8a857d] border ${errors.description ? 'border-red-400' : 'border-[#E4DED6]'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all resize-none`}
                        />
                      </div>

                      {/* Dynamic Conditional Payment Infrastructure */}
                      <div>
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Payment Method</label>
                        <div className="relative">
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-white text-[#171717] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px] appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-white text-[#77736E]">Select Primary Method...</option>
                            <option value="Cash" className="bg-white text-[#171717]">Cash / Physical</option>
                            <option value="Bank Deposit" className="bg-white text-[#171717]">Bank Deposit</option>
                            <option value="Online Bank" className="bg-white text-[#171717]">Online Bank Transfer</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">expand_more</span>
                        </div>

                        {/* Expandable Banking Node */}
                        {(paymentMethod === "Bank Deposit" || paymentMethod === "Online Bank") && (
                          <div className="mt-4 p-5 bg-white border border-[#E4DED6] shadow-sm rounded-[20px] space-y-4 animate-fade-in-up">
                            {/* Bank Name */}
                            <div>
                              <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Bank Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Sampath Bank"
                                value={bankDetails.bankName}
                                onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') }))}
                                className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                              />
                            </div>

                            {/* Account Holder Name */}
                            <div>
                              <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Account Holder Name</label>
                              <input
                                type="text"
                                placeholder="Name"
                                value={bankDetails.accountHolderName}
                                onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') }))}
                                className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              {/* Account Number */}
                              <div>
                                <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Account Number</label>
                                <input
                                  type="text"
                                  placeholder="000100200300"
                                  maxLength={20}
                                  value={bankDetails.accountNo}
                                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNo: e.target.value.replace(/[^0-9]/g, '') }))}
                                  className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-mono focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                                />
                              </div>

                              {/* Branch */}
                              <div>
                                <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Branch</label>
                                <input
                                  type="text"
                                  placeholder="Colombo"
                                  value={bankDetails.branch}
                                  onChange={(e) => setBankDetails(prev => ({ ...prev, branch: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') }))}
                                  className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-mono focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E4DED6] bg-[#FAF8F5] flex justify-end gap-3 sticky bottom-0 z-10 rounded-b-[32px]">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-[46px] px-6 rounded-[14px] bg-white hover:bg-[#F1ECE5] text-[#292929] font-bold text-[13.5px] transition-all border border-[#E4DED6] shadow-sm active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="supplier-form"
                disabled={saving}
                className="h-[46px] px-8 rounded-[14px] bg-[#171717] hover:bg-[#292929] text-white font-black text-[13.5px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      {modalMode === "create" ? "add_task" : "save"}
                    </span>
                    {modalMode === "create" ? "Add Supplier" : "Save Changes"}
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </ModalPortal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
        isDanger={true}
      />

      {/* Supplier Details Viewer (Crystal Clear Read-Only) */}
      <ModalPortal
        isOpen={!!viewSupplier}
        onClose={closeViewModal}
        backdropClassName="bg-[#171717]/45 backdrop-blur-sm transition-all duration-700"
        containerClassName="p-4 md:p-8"
      >
        {viewSupplier && (
          <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-[32px] border border-[#E4DED6] shadow-[0_40px_100px_rgba(23,23,23,0.22)] overflow-hidden flex flex-col md:flex-row relative animate-scale-up">
            {/* Close Button Pin */}
            <button
              onClick={closeViewModal}
              className="absolute top-6 right-6 z-[10] w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#F1ECE5] text-[#5f5a53] hover:text-[#171717] flex items-center justify-center transition-all active:scale-95 border border-[#E4DED6]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Left Column: Visuals & Core Identity (40%) */}
            <div className="w-full md:w-[40%] h-full bg-[#F4EFE8] border-r border-[#E4DED6] flex flex-col relative group">
              <div className="flex-1 overflow-hidden flex items-center justify-center p-12">
                {viewSupplier.imageUrl ? (
                  <div className="w-56 h-56 rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative group-hover:scale-105 transition-transform duration-700">
                    <img
                      src={viewSupplier.imageUrl}
                      alt={viewSupplier.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 rounded-[32px] bg-white border border-[#E4DED6] flex flex-col items-center justify-center gap-4 text-[#77736E] shadow-sm relative group-hover:scale-105 transition-transform duration-700">
                    <span className="material-symbols-outlined text-[84px]">store</span>
                    <p className="text-[12px] font-black uppercase tracking-widest">No Profile Image</p>
                  </div>
                )}
              </div>

              <div className="p-10 pt-0 text-center">
                <div className="inline-flex items-center gap-2 bg-white border border-[#E4DED6] px-4 py-1.5 rounded-full mb-6 relative hover:scale-105 transition-transform cursor-default shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${viewSupplier.type === 'Foreign' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                  <span className="text-[10px] font-black text-[#171717] tracking-widest uppercase">{viewSupplier.type || 'Local'} Supplier</span>
                </div>
                <h2 className="text-[32px] font-headline font-black text-[#171717] leading-tight tracking-tight mb-2">{viewSupplier.name}</h2>
                <p className="text-[14px] text-[#77736E] font-mono font-bold tracking-widest mb-8">{viewSupplier.supplierId || `SUP-${viewSupplier.id.substring(viewSupplier.id.length - 6).toUpperCase()}`}</p>
              </div>
            </div>

            {/* Right Column: Information (60%) */}
            <div className="w-full md:w-[60%] h-full bg-white p-10 overflow-y-auto no-scrollbar flex flex-col">
              <div className="mb-10 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#9A7B4A]">contact_mail</span>
                  Contact Directives
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] hover:bg-[#F1ECE5]/70 transition-colors group/card">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#E4DED6] shadow-sm flex items-center justify-center text-[#5f5a53] shrink-0">
                        <span className="material-symbols-outlined text-[18px] group-hover/card:scale-110 transition-transform">mail</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-0.5">Primary Email</p>
                        <p className="text-[14px] font-medium text-[#171717]">{viewSupplier.email || "Not Provided"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] hover:bg-[#F1ECE5]/70 transition-colors group/card">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#E4DED6] shadow-sm flex items-center justify-center text-[#5f5a53] shrink-0">
                        <span className="material-symbols-outlined text-[18px] group-hover/card:scale-110 transition-transform">call</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-0.5">Contact Number</p>
                        <p className="text-[14px] font-mono font-bold text-[#171717]">{viewSupplier.phone || "Not Provided"}</p>
                      </div>
                    </div>
                  </div>
                  {viewSupplier.address && (
                    <div className="flex gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] hover:bg-[#F1ECE5]/70 transition-colors group/card">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#E4DED6] shadow-sm flex items-center justify-center text-[#5f5a53] shrink-0">
                        <span className="material-symbols-outlined text-[18px] group-hover/card:scale-110 transition-transform">location_on</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-0.5">Physical Address</p>
                        <p className="text-[14px] font-medium text-[#171717] pr-4 leading-relaxed">{viewSupplier.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Categories */}
              {viewSupplier.productTypes && viewSupplier.productTypes.trim() !== "" && (
                <div className="mb-10 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#9A7B4A]">category</span>
                    Supplied Goods
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewSupplier.productTypes.split(',').filter(Boolean).map((pt, idx) => (
                      <span key={idx} className="px-4 py-2 bg-[#FAF8F5] border border-[#E4DED6] hover:border-[#C9A77A] text-[#171717] text-[12px] font-bold rounded-[10px] shadow-sm transition-all hover:-translate-y-0.5">
                        {pt.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Architecture */}
              {viewSupplier.paymentInfo && (
                <div className="mb-10 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#9A7B4A]">account_balance</span>
                    Financial Routing
                  </h3>
                  {(() => {
                    try {
                      const payInfo = JSON.parse(viewSupplier.paymentInfo);
                      if (payInfo.method === "Bank Transfer") {
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border border-[#E4DED6] bg-[#FAF8F5] hover:bg-[#F1ECE5]/70 transition-colors shadow-sm">
                              <p className="text-[9px] font-black text-[#77736E] uppercase tracking-widest mb-1">Target Bank</p>
                              <p className="text-[14px] font-bold text-[#171717]">{payInfo.bankDetails?.bankName || "-"}</p>
                            </div>
                            <div className="p-5 rounded-2xl border border-[#E4DED6] bg-[#FAF8F5] hover:bg-[#F1ECE5]/70 transition-colors shadow-sm">
                              <p className="text-[9px] font-black text-[#77736E] uppercase tracking-widest mb-1">Branch Code / Area</p>
                              <p className="text-[14px] font-bold text-[#171717]">{payInfo.bankDetails?.branch || "-"}</p>
                            </div>
                            <div className="col-span-2 p-5 rounded-2xl border border-[#E4DED6] bg-[#FAF8F5] hover:bg-[#F1ECE5]/70 transition-colors shadow-sm flex items-center justify-between group/bank">
                              <div>
                                <p className="text-[9px] font-black text-[#77736E] uppercase tracking-widest mb-1">Account Number & Holder</p>
                                <p className="text-[16px] font-mono font-black tracking-tight text-[#171717] mb-0.5">{payInfo.bankDetails?.accountNo || "-"}</p>
                                <p className="text-[12px] font-bold text-[#5f5a53] uppercase">{payInfo.bankDetails?.accountHolderName || "-"}</p>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#E4DED6] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px] text-[#77736E] group-hover/bank:text-[#171717] transition-colors">account_balance_wallet</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-white border border-[#E4DED6] shadow-sm flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px] text-[#292929]">payments</span>
                          </div>
                          <span className="text-[14px] font-black text-[#171717]">{payInfo.method}</span>
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-[12px] text-[#77736E] italic">Financial data encrypted or malformed.</p>;
                    }
                  })()}
                </div>
              )}

              {/* Internal Notes */}
              {viewSupplier.description && viewSupplier.description.trim() !== "" && (
                <div className="mb-4 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                  <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#9A7B4A]">sticky_note_2</span>
                    Internal Notes
                  </h3>
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 relative overflow-hidden">
                    <p className="text-[13px] text-amber-900 font-medium leading-relaxed italic relative z-10">
                      "{viewSupplier.description}"
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
