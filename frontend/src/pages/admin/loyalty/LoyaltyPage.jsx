import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { loyaltyService, usersService } from "../../../services";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Spinner } from "../../../components/common/Spinner";
import { formatDate } from "../../../utils/formatters";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";

const PAGE_SIZE = 10;
const TRANSACTION_TYPES = ["bonus", "earned", "redeemed", "adjustment"];

export const LoyaltyPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalMode, setModalMode] = useState(null);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onChange",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [transRes, usersRes] = await Promise.all([
        loyaltyService.getAll(0, 1000),
        usersService.getAll(0, 1000),
      ]);

      setTransactions(transRes.data.data || []);

      // Filter only customers
      const customerList = (usersRes.data.data.users || []).filter(
        (u) => u.role?.name?.toLowerCase() === "customer" || u.role?.name?.toLowerCase() === "Customer"
      );
      setCustomers(customerList);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return filterBySearch(transactions, searchTerm, ["user.name", "type"]);
  }, [transactions, searchTerm]);

  // Compute Customer Loyalty Stats
  const customerStats = useMemo(() => {
    return customers.map(customer => {
      const userTransactions = transactions.filter(t => t.userId === customer.id);
      const earned = userTransactions.reduce((sum, t) => t.points > 0 ? sum + t.points : sum, 0);
      const redeemed = userTransactions.reduce((sum, t) => t.points < 0 ? sum + Math.abs(t.points) : sum, 0);
      
      return {
        ...customer,
        totalEarned: earned,
        totalRedeemed: redeemed,
        currentBalance: earned - redeemed
      };
    });
  }, [customers, transactions]);

  const filteredCustomerStats = useMemo(() => {
    return filterBySearch(customerStats, customerSearchTerm, ["name", "email"]);
  }, [customerStats, customerSearchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTransaction(null);
    reset({
      userId: "",
      points: "",
      type: "bonus",
    });
  };

  const openCustomersModal = () => {
    setIsCustomersModalOpen(true);
    setCustomerSearchTerm("");
  };

  const openEditModal = (transaction) => {
    setModalMode("edit");
    setSelectedTransaction(transaction);
    reset({
      userId: transaction.userId,
      points: transaction.points,
      type: transaction.type,
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedTransaction(null);
    reset({});
  };

  const closeCustomersModal = () => {
    setIsCustomersModalOpen(false);
  };

  const openDeleteDialog = (transaction) => {
    setDeleteTarget(transaction);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await loyaltyService.addPoints({
          userId: data.userId,
          points: parseInt(data.points),
          type: data.type,
        });
        toast.success("Loyalty points added successfully");
      } else {
        await loyaltyService.update(selectedTransaction.id, {
          points: parseInt(data.points),
          type: data.type,
        });
        toast.success("Loyalty transaction updated");
      }

      // Re-fetch transactions
      await fetchData();
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save transaction";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await loyaltyService.delete(deleteTarget.id);
      setTransactions(transactions.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Transaction deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete transaction";
      setError(message);
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const calculateGlobalPoints = () => {
    return transactions.reduce((acc, curr) => acc + (curr.points || 0), 0);
  };

  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((t) => ({
        ...t,
        _userName: t.user?.name || "Unknown",
        _userEmail: t.user?.email || "No Data",
      }));

      exportTablePDF(
        "Loyalty Transactions Ledger",
        [
          { label: "Customer", key: "_userName" },
          { label: "Email", key: "_userEmail" },
          { label: "Points", key: "points" },
          { label: "Category", key: "type" },
          { label: "Date Posted", key: "createdAt", format: "date" },
        ],
        dataForPdf,
        "loyalty-ledger-report"
      );
      toast.success("Ledger exported successfully");
    } catch (err) {
      toast.error("Failed to export ledger");
    }
  };

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in overflow-x-hidden">
      {/* Header Actions */}
      <div className="flex justify-end pt-1 text-left">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleExportPDF}
            className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Export Ledger
          </button>
          <button
            onClick={openCustomersModal}
            className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)] active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">group</span> Loyalty Customers
          </button>
          <button
            onClick={openCreateModal}
            className="h-11 px-6 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/30 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] font-semibold">toll</span> Award Points
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
            placeholder="Search transactions or type..."
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
      <div className="text-left">
        {/* Floating Header Row */}
        <div className="hidden md:flex py-3 px-5 mb-2.5 rounded-2xl admin-table-header text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em]">
          <div className="w-[30%]">Customer Name</div>
          <div className="w-[15%] text-left">Points Given</div>
          <div className="w-[15%] text-left">Trans. Type</div>
          <div className="w-[25%] text-left">Date Posted</div>
          <div className="w-[15%] text-center">Actions</div>
        </div>

        {/* Transaction Items */}
        <div className="space-y-3">
          {paginated.data.length === 0 ? (
            <div className="py-20 bg-white rounded-[24px] text-center text-[#77736E] font-medium border border-[#E4DED6] shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
              No loyalty transactions found.
            </div>
          ) : (
            paginated.data.map((row) => (
              <div key={row.id} className="flex flex-col md:flex-row md:items-center py-4 px-5 admin-card rounded-[20px] transition-all duration-300 gap-4 md:gap-0 group">
                
                {/* Customer Column */}
                <div className="w-full md:w-[30%] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden bg-[#F1ECE5] shrink-0 border border-[#E4DED6] transition-all group-hover:scale-105">
                    <span className="material-symbols-outlined text-[#5f5a53] text-[20px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-[15px] leading-tight text-[#171717] truncate">{row.user?.name || "Unknown"}</h4>
                    <p className="text-[11px] text-[#77736E] font-medium mt-0.5 line-clamp-1">{row.user?.email || "No Data"}</p>
                  </div>
                </div>

                {/* Points Column */}
                <div className="w-full md:w-[15%] font-headline font-bold text-[14px] flex justify-between md:block">
                  <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Amount</span>
                  <div className="flex items-center gap-1.5">
                    {row.points > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-[13px] font-bold">
                         <span className="material-symbols-outlined text-[16px]">trending_up</span>
                         + {row.points}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200 text-[13px] font-bold">
                         <span className="material-symbols-outlined text-[16px]">trending_down</span>
                         {row.points}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type Column */}
                <div className="w-full md:w-[15%] text-[13px] flex justify-between md:block">
                  <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Category</span>
                  <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] rounded-full border ${
                    row.type === "bonus" ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                    row.type === "earned" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                    row.type === "redeemed" ? "bg-amber-50 text-amber-800 border-amber-200" :
                    "bg-[#F1ECE5] text-[#5f5a53] border-[#E4DED6]"
                  }`}>
                    {row.type}
                  </span>
                </div>

                {/* Date Column */}
                <div className="w-full md:w-[25%] text-[13px] text-[#5f5a53] font-medium flex justify-between md:block">
                  <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold mt-1">Posted On</span>
                  {formatDate(row.createdAt)}
                </div>

                {/* Actions Column */}
                <div className="w-full md:w-[15%] flex justify-end md:justify-center items-center gap-1.5 relative mt-2 md:mt-0">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(row); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-all rounded-xl" title="Edit">
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openDeleteDialog(row); }} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E4DED6] text-[#5f5a53] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all rounded-xl" title="Delete">
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats & Pagination */}
      <div className="admin-card rounded-[24px] p-6 flex flex-col lg:flex-row items-center justify-between gap-6 text-left">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 sm:gap-12 w-full lg:w-auto">
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1.5">Total Transactions</p>
            <p className="text-[24px] font-headline font-extrabold text-[#171717] leading-none tracking-tight">{transactions.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1.5">Active Customers</p>
            <p className="text-[24px] font-headline font-extrabold text-[#171717] leading-none tracking-tight">{customers.length.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#77736E] tracking-[0.16em] uppercase mb-1.5">Net Points Flow</p>
            <div className="flex items-baseline gap-1.5">
               <p className={`text-[24px] font-headline font-extrabold leading-none tracking-tight ${calculateGlobalPoints() >= 0 ? "text-[#171717]" : "text-red-600"}`}>
                 {calculateGlobalPoints().toLocaleString()}
               </p>
               <span className="text-[13px] font-bold text-[#77736E]">XP</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#77736E] font-bold uppercase tracking-widest">Entry Page {page} / {paginated.pages || 1}</span>
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

      {/* Architect Modal (Record Entry) */}
      <Modal
        dark={false}
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === "create" ? "Award Points" : "Revise Ledger Entry"}
        size="lg"
        actions={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="px-6 py-2 rounded-xl border border-[#E4DED6] bg-white text-[#5f5a53] text-[10px] font-black uppercase tracking-widest hover:bg-[#F1ECE5] hover:text-[#171717] transition-all disabled:opacity-50 h-[44px]"
            >
              Discard
            </button>
            <button
              type="submit"
              form="loyalty-architect-form"
              disabled={saving}
              className="px-8 py-2 rounded-xl bg-[#171717] text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#292929] transition-all shadow-sm active:scale-95 flex items-center gap-3 disabled:opacity-70 h-[44px]"
            >
              {saving ? <Spinner size="xs" color="white" dark={false} /> : <span className="material-symbols-outlined text-[18px]">verified</span>}
              {modalMode === "create" ? "Award Points" : "Commit Changes"}
            </button>
          </div>
        }
      >
        <form
          id="loyalty-architect-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 animate-fade-in-up pb-4"
        >
          <div className="space-y-8">
            <section className="text-left">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-[#C9A77A] rounded-full" />
                <label className="text-[13px] font-black text-[#171717] uppercase tracking-[0.25em]">Registry Details</label>
              </div>

              <div className="space-y-6">
                <div className="relative text-left">
                  <label className="block text-[11px] font-black text-[#77736E] uppercase tracking-widest mb-2 ml-1 text-left">Identity Verification</label>
                  {modalMode === "create" ? (
                    <div className="relative">
                      <select
                        {...register("userId", { required: "Please select a customer" })}
                        className={`w-full bg-[#FAF8F5] text-[#171717] border ${errors.userId ? 'border-red-400' : 'border-[#E4DED6]'} rounded-2xl px-5 py-4 text-[14px] font-black focus:bg-white focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[58px] appearance-none cursor-pointer`}
                      >
                        <option value="" className="bg-white text-[#77736E]">Select Customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id} className="bg-white text-[#171717]">{c.name} ({c.email})</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">unfold_more</span>
                    </div>
                  ) : (
                    <div className="w-full bg-[#F1ECE5] border border-[#E4DED6] rounded-2xl px-5 py-4 text-[14px] font-black text-[#5f5a53] h-[58px] flex items-center cursor-not-allowed">
                      {selectedTransaction?.user?.name}
                    </div>
                  )}
                  {errors.userId && <p className="text-red-600 text-[11px] font-bold mt-2 ml-1">{errors.userId.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative text-left">
                    <label className="block text-[11px] font-black text-[#77736E] uppercase tracking-widest mb-2 ml-1 text-left">Points Quantity</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[20px]">toll</span>
                      <input
                        type="number"
                        placeholder="0"
                        {...register("points", {
                          required: "Points quantity is required",
                          validate: (value) => {
                            const numVal = parseInt(value);
                            if (numVal === 0) return "Quantity cannot be zero";
                            return true;
                          },
                        })}
                        className={`w-full bg-[#FAF8F5] text-[#171717] placeholder:text-[#8a857d] border ${errors.points ? 'border-red-400' : 'border-[#E4DED6]'} rounded-2xl pl-12 pr-4 py-4 text-[15px] font-black focus:bg-white focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[58px]`}
                      />
                    </div>
                    <p className="text-[#77736E] text-[10px] font-bold uppercase tracking-tight mt-2 ml-1">(Negative values for deductions)</p>
                    {errors.points && <p className="text-red-600 text-[11px] font-bold mt-2 ml-1">{errors.points.message}</p>}
                  </div>

                  <div className="relative text-left">
                    <label className="block text-[11px] font-black text-[#77736E] uppercase tracking-widest mb-2 ml-1 text-left">Classification</label>
                    <div className="relative">
                      <select
                        {...register("type", { required: "Type is required" })}
                        className={`w-full bg-[#FAF8F5] text-[#171717] border ${errors.type ? 'border-red-400' : 'border-[#E4DED6]'} rounded-2xl px-5 py-4 text-[14px] font-black focus:bg-white focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[58px] appearance-none cursor-pointer uppercase tracking-widest`}
                      >
                        <option value="" className="bg-white text-[#77736E]">Select Type</option>
                        {TRANSACTION_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-white text-[#171717]">{t}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">category</span>
                    </div>
                    {errors.type && <p className="text-red-600 text-[11px] font-bold mt-2 ml-1">{errors.type.message}</p>}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </form>
      </Modal>

      {/* Loyalty Customers Overview Modal */}
      <Modal
        dark={false}
        isOpen={isCustomersModalOpen}
        onClose={closeCustomersModal}
        title="Loyalty Customers Statistics"
        size="2xl"
      >
         <div className="space-y-6 pt-2">
            {/* Search Bar for Modal */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a857d] text-[18px]">search</span>
              <input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                placeholder="Search customers by name or email..."
                className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#8a857d] border border-[#E4DED6] focus:border-[#C9A77A] rounded-2xl py-3.5 pl-12 pr-4 text-[13px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 outline-none transition-all"
              />
            </div>

            {/* Stats Table */}
            <div className="bg-white rounded-3xl border border-[#E4DED6] overflow-hidden shadow-sm">
                <div className="grid grid-cols-4 px-6 py-4 bg-[#F1ECE5] border-b border-[#E4DED6] text-[10px] font-black uppercase tracking-widest text-[#77736E]">
                   <div className="col-span-1">Customer</div>
                   <div className="text-center">Earned</div>
                   <div className="text-center">Redeemed</div>
                   <div className="text-right">Balance</div>
                </div>
                <div className="max-h-[50vh] overflow-y-auto no-scrollbar divide-y divide-[#EFEAE2]">
                   {filteredCustomerStats.length === 0 ? (
                     <div className="py-20 text-center text-[#77736E] font-bold text-[13px]">No records match your search.</div>
                   ) : (
                     filteredCustomerStats.map(stat => (
                       <div key={stat.id} className="grid grid-cols-4 px-6 py-4 items-center hover:bg-[#FAF8F5] transition-colors group">
                          <div className="col-span-1">
                             <p className="text-[13px] font-bold text-[#171717] truncate">{stat.name}</p>
                             <p className="text-[9px] text-[#77736E] font-bold uppercase tracking-tight truncate">{stat.email}</p>
                          </div>
                          <div className="text-center font-black text-[14px] text-emerald-700">
                             + {stat.totalEarned.toLocaleString()}
                          </div>
                          <div className="text-center font-black text-[14px] text-amber-700">
                             - {stat.totalRedeemed.toLocaleString()}
                          </div>
                          <div className="text-right">
                             <span className={`inline-flex px-3 py-1 rounded-lg font-black text-[13px] ${stat.currentBalance >= 0 ? 'bg-[#171717] text-white shadow-sm' : 'bg-red-600 text-white shadow-sm'}`}>
                                {stat.currentBalance.toLocaleString()} <span className="ml-1 text-[9px] opacity-75">XP</span>
                             </span>
                          </div>
                       </div>
                     ))
                   )}
                </div>
            </div>
         </div>
         <div className="flex justify-end pt-8 pb-2">
            <button onClick={closeCustomersModal} className="px-10 py-3 bg-[#171717] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all active:scale-95">Close Overview</button>
         </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ledger entry? This will permanently undo the impact of ${deleteTarget?.points} points for ${deleteTarget?.user?.name}.`}
        loading={deleteLoading}
        isDanger={true}
        confirmText="Confirm Deletion"
      />
    </div>
  );
};
