import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { paymentsService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal } from "../../../components/common/Modal";
import { Button } from "../../../components/common/Button";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { Badge } from "../../../components/common/Badge";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";
import { formatDate, formatPrice } from "../../../utils/formatters";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const getStatusColor = (status) => {
  const colors = {
    pending: "yellow",
    paid: "green",
    failed: "red",
    refunded: "gray",
  };
  return colors[status] || "gray";
};

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [updating, setUpdating] = useState(false);

  const filtered = useMemo(() => {
    let data = filterBySearch(payments, searchTerm, ["id", "orderId", "method"]);
    if (statusFilter) {
      data = data.filter(p => p.status === statusFilter);
    }
    return data;
  }, [payments, searchTerm, statusFilter]);

  const paginated = useMemo(
    () => paginateData(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await paymentsService.getAll(0, 1000);
      setPayments(res.data.data.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId, newStatus) => {
    setUpdating(true);
    try {
      await paymentsService.updateStatus(paymentId, { status: newStatus });
      setPayments(payments.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p)));
      toast.success("Payment status updated successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const openPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setModalMode("view");
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setModalMode(null);
  };

  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((p) => ({
        ...p,
        _orderId: p.order?.id?.slice(-8).toUpperCase() || "N/A",
      }));

      exportTablePDF(
        "Financial Settlements Report",
        [
          { label: "Payment ID", key: "id" },
          { label: "Order Ref", key: "_orderId" },
          { label: "Settlement", key: "amount", format: "price" },
          { label: "Methodology", key: "method" },
          { label: "Status", key: "status" },
          { label: "Timestamp", key: "createdAt", format: "date" },
        ],
        dataForPdf,
        "financial-settlements-report-" + new Date().toISOString().split('T')[0]
      );
      toast.success("Financial report generated");
    } catch {
      toast.error("Failed to export PDF record");
    }
  };

  const columns = [
    {
      key: "id",
      label: "Reference",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase text-[#8a857d] tracking-widest mb-0.5">Payment ID</span>
          <button
            onClick={() => openPaymentDetails(row)}
            className="text-[#171717] hover:underline font-mono text-[13px] font-bold text-left"
          >
            #{row.id.slice(-8).toUpperCase()}
          </button>
        </div>
      ),
    },
    {
      key: "orderId",
      label: "Order Link",
      render: (row) => (
        <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase text-[#8a857d] tracking-widest mb-0.5">Order Ref</span>
            <span className="font-mono text-[12px] font-medium text-[#5f5a53]">
                {row.order?.id ? `#${row.order.id.slice(-8).toUpperCase()}` : "N/A"}
            </span>
        </div>
      ),
    },
    {
      key: "subtotal",
      label: "Total Value",
      render: (row) => {
        if (row.order?.method === 'return_replacement') {
          return (
            <span className="font-headline font-semibold tracking-tight text-sm text-[#77736E]">
              {formatPrice(0)}
            </span>
          );
        }
        const sFee = row.order?.shippingFee || (row.order?.deliveryMethod === "express_delivery" ? 500 : (row.order?.deliveryMethod === "pickup" ? 0 : 350));
        const itemsTotal = Math.max(0, (row.amount || 0) - sFee);
        return (
          <span className="font-headline font-semibold tracking-tight text-sm text-[#5f5a53]">
            {formatPrice(itemsTotal)}
          </span>
        );
      },
    },
    {
      key: "delivery",
      label: "Delivery",
      render: (row) => {
        const isReplacement = row.order?.method === 'return_replacement';
        const sFee = row.order?.shippingFee || (row.order?.deliveryMethod === "express_delivery" ? 500 : (row.order?.deliveryMethod === "pickup" ? 0 : 350));
        const method = row.order?.deliveryMethod?.replace(/_/g, ' ') || 'Standard';
        return (
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${isReplacement ? 'text-red-600' : 'text-[#171717]'}`}>
                {isReplacement ? `-${formatPrice(sFee)}` : formatPrice(sFee)}
            </span>
            <span className="text-[10px] text-[#77736E] font-semibold uppercase tracking-tighter">{method}</span>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "Settlement",
      render: (row) => (
        <span className="font-headline font-bold tracking-tight text-base text-[#171717]">
          {formatPrice(row.amount)}
        </span>
      ),
    },
    { 
        key: "method", 
        label: "Methodology",
        render: (row) => (
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5f5a53]">
                {row.method.replace(/_/g, ' ')}
            </span>
        )
    },
    {
      key: "status",
      label: "Assurance",
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          disabled={updating}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border focus:ring-2 focus:ring-[#C9A77A]/40 transition-all cursor-pointer outline-none ${
            row.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
            row.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
            row.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#F1ECE5] text-[#292929] border-[#E4DED6]'
          }`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-[#171717]">
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row) => (
        <div className="flex flex-col text-[11px]">
          <span className="font-semibold text-[#171717]">{formatDate(row.createdAt)}</span>
          <span className="text-[#77736E]">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
        key: "actions",
        label: "",
        render: (row) => (
          <div className="flex justify-end">
            <button
              onClick={() => openPaymentDetails(row)}
              className="h-9 w-9 bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] rounded-xl flex items-center justify-center transition-all duration-200"
              title="View Settlement Details"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
          </div>
        )
      }
  ];

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleExportPDF}
          className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#171717]/80 active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          Export Ledger
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-[13px] font-medium">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="admin-card rounded-[24px] p-3">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          <div className="flex-1 relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] text-[20px] group-focus-within:text-[#171717] transition-colors">payments</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Payment ID, Order ID, or Method..."
              className="w-full h-12 bg-white hover:bg-[#FAF8F5] focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl pl-11 pr-4 text-[13.5px] font-medium text-[#171717] placeholder:text-[#9d978f] outline-none transition-all"
            />
          </div>
          <div className="flex bg-[#F1ECE5] p-1 rounded-2xl border border-[#E4DED6] overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-tight transition-all ${statusFilter === "" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717] hover:bg-white/60'}`}
            >
              All Ledger
            </button>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-tight transition-all ${statusFilter === opt.value ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717] hover:bg-white/60'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Table
        dark={false}
        columns={columns}
        data={paginated.data}
        loading={loading}
        emptyMessage="No financial settlements found for the current filter set."
      />

      {paginated.pages > 1 && (
        <div className="pt-2">
          <Pagination
            dark={false}
            currentPage={page}
            totalPages={paginated.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Details Modal */}
      <Modal
        dark={false}
        isOpen={!!selectedPayment}
        onClose={closeModal}
        title={`Settlement #${selectedPayment?.id?.slice(-8).toUpperCase()}`}
        size="2xl"
      >
        {selectedPayment && (
          <div className="space-y-8 py-2">
            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-[#F4EFE8] text-[#171717] rounded-[22px] border border-[#E4DED6]">
                    <p className="text-[10px] font-semibold text-[#77736E] uppercase tracking-widest mb-1">Settlement Amount</p>
                    <p className="text-2xl font-headline font-bold tracking-tighter">{formatPrice(selectedPayment.amount)}</p>
                </div>
                <div className="p-6 bg-[#FAF8F5] rounded-[22px] border border-[#E4DED6]">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedPayment.order?.method === 'return_replacement' ? 'text-red-600' : 'text-[#77736E]'}`}>
                        {selectedPayment.order?.method === 'return_replacement' ? 'Replacement Delivery Cost' : 'Delivery Charge'}
                    </p>
                    <p className={`text-xl font-headline font-bold tracking-tight ${selectedPayment.order?.method === 'return_replacement' ? 'text-red-600' : 'text-[#171717]'}`}>
                        {selectedPayment.order?.method === 'return_replacement' 
                            ? `-${formatPrice(selectedPayment.order?.shippingFee || (selectedPayment.order?.deliveryMethod === "express_delivery" ? 500 : (selectedPayment.order?.deliveryMethod === "pickup" ? 0 : 350)))}` 
                            : formatPrice(selectedPayment.order?.shippingFee || (selectedPayment.order?.deliveryMethod === "express_delivery" ? 500 : (selectedPayment.order?.deliveryMethod === "pickup" ? 0 : 350)))}
                    </p>
                </div>
            </div>

            {/* General Info */}
            <section className="bg-[#FAF8F5] border border-[#E4DED6] p-6 rounded-[24px]">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">info</span>
                    Transaction Meta
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                    <div>
                        <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Core Payment ID</label>
                        <p className="font-mono text-xs font-medium text-[#171717] break-all bg-white p-3 rounded-xl border border-[#E4DED6]">{selectedPayment.id}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Associated Order ID</label>
                        <p className="font-mono text-xs font-medium text-[#171717] break-all bg-white p-3 rounded-xl border border-[#E4DED6]">{selectedPayment.order?.id || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Settlement Technique</label>
                        <p className="text-lg font-bold text-[#171717] capitalize">{selectedPayment.method.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Chronological Entry</label>
                        <p className="text-lg font-bold text-[#171717]">{formatDate(selectedPayment.createdAt)}</p>
                    </div>
                </div>
            </section>

            {/* Proof of Settlement */}
            {selectedPayment.proofImageUrl && (
              <section className="bg-[#FAF8F5] p-6 rounded-[24px] border border-[#E4DED6]">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                    Proof of Settlement
                </h4>
                <div className="relative group overflow-hidden rounded-[20px] border border-[#E4DED6] shadow-sm transition-transform hover:scale-[1.01]">
                    <img
                        src={selectedPayment.proofImageUrl.startsWith('http') ? selectedPayment.proofImageUrl : `http://localhost:5001${selectedPayment.proofImageUrl}`}
                        alt="Handcrafted Proof"
                        className="w-full object-cover max-h-[400px]"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <a 
                            href={selectedPayment.proofImageUrl.startsWith('http') ? selectedPayment.proofImageUrl : `http://localhost:5001${selectedPayment.proofImageUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-[#171717] text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl"
                        >
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                            Expand Verification
                        </a>
                    </div>
                </div>
              </section>
            )}
            
            <div className="flex justify-end pt-2">
                <Button dark={false} onClick={closeModal} className="px-10 py-3 rounded-2xl bg-[#171717] text-white hover:bg-[#292929]">Close Ledger Entry</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
