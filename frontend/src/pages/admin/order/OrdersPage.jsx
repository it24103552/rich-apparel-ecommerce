import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ordersService, orderDiscountService } from "../../../services";
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
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "On the Way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const getStatusColor = (status) => {
  const colors = {
    pending: "yellow",
    confirmed: "blue",
    shipped: "indigo",
    delivered: "green",
    cancelled: "red",
  };
  return colors[status] || "gray";
};

export const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [discountModalOrder, setDiscountModalOrder] = useState(null);

  const filtered = useMemo(() => {
    let data = filterBySearch(orders, searchTerm, ["id", "userId", "contactEmail", "contactNumber"]);
    if (statusFilter) {
      data = data.filter(o => o.status === statusFilter);
    }
    return data;
  }, [orders, searchTerm, statusFilter]);

  const paginated = useMemo(
    () => paginateData(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  // Deep-linking
  useEffect(() => {
    const viewId = searchParams.get("viewId");
    if (viewId && orders.length > 0) {
      const order = orders.find(o => o.id === viewId);
      if (order) {
        openOrderDetails(order);
        // Clear param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("viewId");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ordersService.getAll(0, 1000, true); // true for isAdmin
      setOrders(res.data.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await ordersService.updateStatus(orderId, { status: newStatus });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success("Order status updated successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalMode("view");
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalMode(null);
  };

  const openDiscountModal = async (orderId) => {
    try {
      const res = await orderDiscountService.getDiscount(orderId);
      setDiscountModalOrder(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch discount details");
    }
  };

  const handleExportPDF = () => {
    try {
      exportTablePDF(
        "Orders Archive Report",
        [
          { label: "Order ID", key: "id" },
          { label: "Date", key: "createdAt", format: "date" },
          { label: "Customer", key: "contactEmail" },
          { label: "Status", key: "status" },
          { label: "Method", key: "method" },
          { label: "Total", key: "total", format: "price" },
        ],
        filtered,
        "orders-archive-report-" + new Date().toISOString().split('T')[0]
      );
      toast.success("PDF report generated");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const handleRefund = async (orderId) => {
    try {
      setUpdating(true);
      await ordersService.processRefund(orderId);
      toast.success("Refund processed successfully!");
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          payment: { ...selectedOrder.payment, status: "refunded" }
        });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process refund");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: "id",
      label: "Reference",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase text-[#8a857d] tracking-widest mb-0.5">Order ID</span>
          <button
            onClick={() => openOrderDetails(row)}
            className="text-[#171717] hover:underline font-mono text-[13px] font-bold text-left"
          >
            #{row.id.slice(-8).toUpperCase()}
          </button>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Client",
      render: (row) => (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-bold text-[#171717] truncate">{row.user?.name || "Guest"}</span>
          <span className="text-[11px] text-[#77736E] truncate">{row.contactEmail}</span>
        </div>
      )
    },
    {
      key: "status",
      label: "Fulfillment",
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          disabled={updating}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border focus:ring-2 focus:ring-[#C9A77A]/40 transition-all cursor-pointer outline-none ${
            row.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
            row.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
            row.status === 'shipped' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
            row.status === 'confirmed' ? 'bg-sky-50 text-sky-800 border-sky-200' :
            row.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#F1ECE5] text-[#292929] border-[#E4DED6]'
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
      key: "subtotal",
      label: "Total Value",
      render: (row) => {
        if (row.method === 'return_replacement') {
          return (
            <span className="font-headline font-semibold tracking-tight text-sm text-[#77736E]">
              {formatPrice(0)}
            </span>
          );
        }
        const subtotal = row.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
        const discountVal = row.orderDiscount 
          ? (row.orderDiscount.couponDiscount + row.orderDiscount.pointsValue)
          : Math.max(0, subtotal - (row.total || 0));
        
        const itemsTotal = Math.max(0, subtotal - discountVal);
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
        const isReplacement = row.method === 'return_replacement';
        const sFee = row.shippingFee || (row.deliveryMethod === "express_delivery" ? 500 : (row.deliveryMethod === "pickup" ? 0 : 350));
        return (
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${isReplacement ? 'text-red-600' : 'text-[#171717]'}`}>
                {isReplacement ? `-${formatPrice(sFee)}` : formatPrice(sFee)}
            </span>
            <span className="text-[10px] text-[#77736E] font-semibold uppercase tracking-tighter">
              {row.deliveryMethod?.replace(/_/g, ' ') || 'Standard'}
            </span>
          </div>
        );
      },
    },
    {
      key: "grandTotal",
      label: "Settlement",
      render: (row) => {
        const sFee = row.shippingFee || (row.deliveryMethod === "express_delivery" ? 500 : (row.deliveryMethod === "pickup" ? 0 : 350));
        const settlement = row.method === 'return_replacement' ? row.total : (row.total || 0) + sFee;
        return (
          <span className="font-headline font-bold tracking-tight text-base text-[#171717]">
            {formatPrice(settlement)}
          </span>
        );
      },
    },
    {
      key: "method",
      label: "Payment",
      render: (row) => (
        <div className="flex flex-col items-start">
            <Badge dark={false} color={row.payment?.status === "paid" ? "green" : "yellow"}>
                {row.payment?.status || "unpaid"}
            </Badge>
            {row.payment?.status === "paid" ? (
              row.method?.toLowerCase() === "return_replacement" && (
                <span className="text-[10px] text-sky-700 font-extrabold uppercase mt-1 tracking-tighter">
                  REPLACEMENT ORDER PLACED
                </span>
              )
            ) : (
              <span className="text-[10px] text-[#77736E] font-semibold uppercase mt-1">{row.method || "N/A"}</span>
            )}
        </div>
      )
    },
    {
      key: "createdAt",
      label: "Timeline",
      render: (row) => (
        <div className="flex flex-col text-[11px]">
          <span className="font-bold text-[#171717]">{formatDate(row.createdAt)}</span>
          <span className="text-[#77736E]">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => openOrderDetails(row)}
            className="h-9 w-9 bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] rounded-xl flex items-center justify-center transition-all duration-200"
            title="View Details"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          {row.orderDiscount && (
             <button
                onClick={() => openDiscountModal(row.id)}
                className="h-9 w-9 bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] rounded-xl flex items-center justify-center transition-all duration-200"
                title="View Discounts"
            >
                <span className="material-symbols-outlined text-[18px]">sell</span>
            </button>
          )}
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
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Records
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
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] text-[20px] group-focus-within:text-[#171717] transition-colors">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID, email, or phone..."
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
              All Orders
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
        emptyMessage="No orders discovered for the selected criteria."
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
        isOpen={!!selectedOrder}
        onClose={closeModal}
        title={`Order #${selectedOrder?.id?.slice(-8).toUpperCase()}`}
        size="4xl"
      >
        {selectedOrder && (
          <div className="space-y-8 py-2">
            {/* Top Bar Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6]">
                    <p className="text-[10px] font-semibold text-[#77736E] uppercase tracking-widest mb-1.5">Status</p>
                    <Badge dark={false} color={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                    </Badge>
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6]">
                    <p className="text-[10px] font-semibold text-[#77736E] uppercase tracking-widest mb-1">Settlement</p>
                    <p className="text-xl font-headline font-bold text-[#171717] tracking-tight">{formatPrice(
                      selectedOrder.method === 'return_replacement'
                        ? selectedOrder.total
                        : (selectedOrder.total || 0) + (selectedOrder.shippingFee || (selectedOrder.deliveryMethod === "express_delivery" ? 500 : (selectedOrder.deliveryMethod === "pickup" ? 0 : 350)))
                    )}</p>
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6]">
                    <p className="text-[10px] font-semibold text-[#77736E] uppercase tracking-widest mb-1">Payment</p>
                    <p className="font-bold text-[#171717]">{selectedOrder.method || "Standard"}</p>
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6]">
                    <p className="text-[10px] font-semibold text-[#77736E] uppercase tracking-widest mb-1">Delivery Fee</p>
                    <p className="font-bold text-[#171717]">
                      {formatPrice(selectedOrder.shippingFee || (selectedOrder.deliveryMethod === "express_delivery" ? 500 : (selectedOrder.deliveryMethod === "pickup" ? 0 : 350)))}
                    </p>
                </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">person</span>
                        Customer Information
                    </h4>
                    <div className="space-y-4 bg-[#FAF8F5] border border-[#E4DED6] p-5 rounded-[20px]">
                        <div>
                            <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Name</label>
                            <p className="font-bold text-[#171717]">{selectedOrder.user?.name || "Unregistered Guest"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Email Affinity</label>
                                <p className="font-medium text-[#292929] break-all text-sm">{selectedOrder.contactEmail}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-[#8a857d] uppercase tracking-widest block mb-1">Phone</label>
                                <p className="font-medium text-[#292929] text-sm">{selectedOrder.contactNumber}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                        Shipping Destination
                    </h4>
                    <div className="bg-[#F4EFE8] text-[#171717] p-6 rounded-[20px] min-h-[140px] flex flex-col justify-center border border-[#E4DED6]">
                        <p className="font-medium leading-relaxed text-sm">
                            "{selectedOrder.address}"
                        </p>
                    </div>
                </section>
            </div>

            {/* Items Table */}
            <section>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">inventory</span>
                    Procured Items
                </h4>
                <div className="border border-[#E4DED6] rounded-[22px] overflow-hidden">
                    <table className="min-w-full divide-y divide-[#EFEAE2]">
                        <thead className="bg-[#F1ECE5]">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest">Product Discovery</th>
                                <th className="px-6 py-3.5 text-center text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest">Quantity</th>
                                <th className="px-6 py-3.5 text-right text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest">Unit Price</th>
                                <th className="px-6 py-3.5 text-right text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest">Aggregate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#EFEAE2]">
                            {selectedOrder.items?.map((item) => (
                                <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#171717]">{item.product?.name || `Product #${item.productId.slice(-6)}`}</span>
                                            {item.variantAttributes && Object.entries(item.variantAttributes).filter(([k]) => k !== 'id').length > 0 && (
                                                <span className="text-[10px] text-[#77736E] font-semibold uppercase tracking-wide mt-0.5">
                                                    {Object.entries(item.variantAttributes).filter(([k]) => k !== 'id').map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono font-bold px-3 py-1 bg-[#FAF8F5] text-[#171717] rounded-lg border border-[#E4DED6]">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-[#77736E]">{formatPrice(item.price)}</td>
                                    <td className="px-6 py-4 text-right font-headline font-bold text-base text-[#171717]">
                                        {formatPrice(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[#FAF8F5] border-t border-[#E4DED6]">
                            {/* Item Subtotal Row */}
                            <tr>
                                <td colSpan="3" className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#77736E]">Items Subtotal</td>
                                <td className="px-6 py-3 text-right font-semibold text-[#171717]">
                                    {formatPrice(selectedOrder.items?.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0) || 0)}
                                </td>
                            </tr>

                            {/* Coupon Discount Row */}
                            {selectedOrder.orderDiscount?.couponDiscount > 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-700 italic">
                                        Promo Discount ({selectedOrder.orderDiscount.couponCode})
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-emerald-700">
                                        -{formatPrice(selectedOrder.orderDiscount.couponDiscount)}
                                    </td>
                                </tr>
                            )}

                            {/* Loyalty Points Row */}
                            {selectedOrder.orderDiscount?.pointsValue > 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-700 italic">
                                        Loyalty Points Redemption
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-emerald-700">
                                        -{formatPrice(selectedOrder.orderDiscount.pointsValue)}
                                    </td>
                                </tr>
                            )}

                            <tr>
                                <td colSpan="3" className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#77736E]">Delivery Fee ({selectedOrder.deliveryMethod?.replace(/_/g, ' ') || 'Standard'})</td>
                                <td className={`px-6 py-3 text-right font-bold ${selectedOrder.method === 'return_replacement' ? 'text-red-600' : 'text-[#171717]'}`}>
                                    {selectedOrder.method === 'return_replacement' ? '-' : ''}{formatPrice(selectedOrder.shippingFee || (selectedOrder.deliveryMethod === "express_delivery" ? 500 : (selectedOrder.deliveryMethod === "pickup" ? 0 : 350)))}
                                </td>
                            </tr>
                            <tr className="bg-[#F1ECE5] border-t border-[#E4DED6]">
                                <td colSpan="3" className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#171717]">Settlement Total</td>
                                <td className="px-6 py-4 text-right font-headline font-black text-2xl tracking-tighter text-[#171717]">
                                    {formatPrice(
                                      selectedOrder.method === 'return_replacement'
                                        ? selectedOrder.total
                                        : (selectedOrder.total || 0) + (selectedOrder.shippingFee || (selectedOrder.deliveryMethod === "express_delivery" ? 500 : (selectedOrder.deliveryMethod === "pickup" ? 0 : 350)))
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>

            {/* Payment Proof/Info */}
            {selectedOrder.payment && (
              <section className="bg-[#FAF8F5] border border-[#E4DED6] p-6 rounded-[24px]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77736E] mb-1">Financial Settlement</h4>
                        <p className="text-xl font-headline font-bold text-[#171717]">Electronic Remittance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedOrder.status === 'cancelled' && selectedOrder.payment.status === 'refund_pending' && (
                            <Button 
                                dark={false}
                                onClick={() => handleRefund(selectedOrder.id)} 
                                disabled={updating}
                                variant="dark" 
                                className="px-4 py-2 text-[10px] tracking-widest rounded-xl"
                            >
                                Process Refund
                            </Button>
                        )}
                        <Badge dark={false} color={
                            selectedOrder.payment.status === "paid" ? "green" : 
                            (selectedOrder.payment.status === "refunded" ? "purple" : "yellow")
                        }>
                            {selectedOrder.payment.status.replace(/_/g, " ")}
                        </Badge>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <span className="text-[10px] text-[#77736E] font-semibold uppercase block mb-1">Methodology</span>
                        <p className="font-bold text-[#171717]">{selectedOrder.payment.method}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-[#77736E] font-semibold uppercase block mb-1">Settled Amount</span>
                        <p className="font-bold text-[#171717]">{formatPrice(selectedOrder.payment.amount)}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-[#77736E] font-semibold uppercase block mb-1">Timestamp</span>
                        <p className="font-medium text-[#292929]">{formatDate(selectedOrder.payment.createdAt)}</p>
                    </div>
                </div>
              </section>
            )}
            
            <div className="flex justify-end pt-2">
                <Button dark={false} onClick={closeModal} className="px-8 py-3 rounded-2xl bg-[#171717] text-white hover:bg-[#292929]">Close Portal</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Discount Modal */}
      <Modal
        dark={false}
        isOpen={!!discountModalOrder}
        onClose={() => setDiscountModalOrder(null)}
        title="Benefit Architecture"
        size="md"
      >
        {discountModalOrder && (
          <div className="p-1 space-y-5">
            <div className="bg-[#FAF8F5] rounded-[22px] p-6 border border-[#E4DED6]">
                <div className="flex items-center gap-4 mb-5 text-emerald-700">
                    <span className="material-symbols-outlined text-4xl">sell</span>
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#77736E]">Coupon Application</h4>
                        <p className="text-2xl font-headline font-bold tracking-tight text-[#171717]">{discountModalOrder.couponCode || "No Coupon"}</p>
                    </div>
                </div>
                {discountModalOrder.couponDiscount > 0 && (
                    <div className="flex justify-between items-center py-3 border-t border-[#E4DED6] border-dashed">
                        <span className="text-sm font-medium text-[#77736E]">Value Redemption</span>
                        <span className="text-lg font-bold text-emerald-700">-{formatPrice(discountModalOrder.couponDiscount)}</span>
                    </div>
                )}
            </div>

            <div className="bg-[#F4EFE8] text-[#171717] rounded-[22px] p-6 border border-[#E4DED6]">
                <div className="flex items-center gap-4 mb-5">
                    <span className="material-symbols-outlined text-3xl text-[#8A6D3F]">stars</span>
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#77736E]">Loyalty Mechanics</h4>
                        <p className="text-xl font-headline font-bold">Points Economy</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-4 py-3 bg-white rounded-2xl border border-[#E4DED6]">
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#77736E]">Redeemed</span>
                        <div className="text-right">
                            <p className="font-bold text-lg text-[#171717]">{discountModalOrder.pointsUsed} <span className="text-[10px] text-[#77736E]">pts</span></p>
                            <p className="text-[10px] font-semibold text-emerald-700">-{formatPrice(discountModalOrder.pointsValue)} value</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Generation</span>
                        <p className="font-bold text-lg text-emerald-800">+{discountModalOrder.earnedPoints} <span className="text-[10px]">pts</span></p>
                    </div>
                </div>
            </div>
            
            <Button dark={false} onClick={() => setDiscountModalOrder(null)} className="w-full h-12 rounded-2xl bg-[#171717] text-white hover:bg-[#292929] mt-2">Acknowledge</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
