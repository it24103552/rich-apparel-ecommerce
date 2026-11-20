import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { returnsService, restockRequestService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Select } from "../../../components/common/Select";
import { Spinner } from "../../../components/common/Spinner";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Badge } from "../../../components/common/Badge";
import { formatDate } from "../../../utils/formatters";
import { truncate } from "../../../utils/formatters";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { resolveImageUrl } from "../../../utils/imageHelpers";
import { RotateCcw } from "lucide-react";


const PAGE_SIZE = 10;
const RETURN_STATUSES = ["pending", "approved", "rejected", "return picked"];

const STATUS_COLORS = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  "return picked": "blue",
};

export const ReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View Details state
  const [viewTarget, setViewTarget] = useState(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' | 'process'
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [updatingRestockId, setUpdatingRestockId] = useState(null);

  // Restock state
  const [restockTarget, setRestockTarget] = useState(null);
  const [submittingRestock, setSubmittingRestock] = useState(false);
  const [expandedRequestIds, setExpandedRequestIds] = useState({});

  // Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onChange",
  });

  const parseNotesMeta = (notes) => {
    if (!notes || !notes.includes("||META||")) return null;
    try {
      const afterTag = notes.split("||META||")[1];
      const jsonBlock = afterTag.split("||")[0];
      return JSON.parse(jsonBlock);
    } catch (e) {
      return null;
    }
  };

  const parseFulfillmentMeta = (notes) => {
    if (!notes || !notes.includes("||FULFILLMENT||")) return null;
    try {
      const afterTag = notes.split("||FULFILLMENT||")[1];
      const jsonBlock = afterTag.split("||")[0];
      return JSON.parse(jsonBlock);
    } catch (e) {
      return null;
    }
  };

  const toggleRequestExpansion = (id) => {
    setExpandedRequestIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    fetchReturns();
    fetchRestockRequests(false);
  }, []);

  useEffect(() => {
    if (activeTab === "process") {
      fetchRestockRequests();
    }
  }, [activeTab]);

  const fetchReturns = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await returnsService.getAll(0, 1000);
      setReturns(res.data.data?.returns || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch returns");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestockRequests = async (showLoading = true) => {
    if (showLoading) setRestockLoading(true);
    try {
      const res = await restockRequestService.getAll();
      // Filter for restocks related to returns (looking for "return #" in notes)
      const allRequests = res.data.data || [];
      const returnRelated = allRequests.filter(r => r.notes?.includes("return #"));
      setRestockRequests(returnRelated);
    } catch (err) {
      if (showLoading) toast.error("Failed to fetch return process data");
    } finally {
      if (showLoading) setRestockLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return filterBySearch(returns, searchTerm, ["order.user.name", "status"]);
  }, [returns, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  const openUpdateModal = (returnItem) => {
    setSelectedReturn(returnItem);
    reset({ status: returnItem.status });
    setUpdateModalOpen(true);
  };

  const openViewModal = (returnItem) => {
    setViewTarget(returnItem);
    reset({ status: returnItem.status });
  };

  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setSelectedReturn(null);
    reset({});
  };

  const onStatusUpdate = async (data, explicitTarget = null) => {
    setUpdating(true);
    const targetId = explicitTarget?.id || selectedReturn?.id || viewTarget?.id;
    try {
      await returnsService.updateStatus(targetId, { status: data.status });
      // Re-fetch returns
      const res = await returnsService.getAll(0, 1000);
      setReturns(res.data.data?.returns || []);
      // Keep page if it was inline update
      if (!explicitTarget) {
         setPage(1);
         closeUpdateModal();
         setViewTarget(null);
      }
      toast.success("Return status updated");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update return status";
      setError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await returnsService.delete(deleteTarget.id);
      setReturns(returns.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Return deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete return";
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRestock = async () => {
    if (!restockTarget) return;
    setSubmittingRestock(true);
    try {
      // Create a restock request for each item in the return
      const requests = restockTarget.items.map(item => {
        const itemMeta = JSON.stringify({
          type: "return_replacement",
          returnId: restockTarget.id,
          orderId: restockTarget.order?.id,
          userId: restockTarget.order?.userId,
          customerName: restockTarget.order?.user?.name || "Unknown",
          customerEmail: restockTarget.order?.contactEmail || restockTarget.order?.user?.email || "",
          customerPhone: restockTarget.order?.contactNumber || restockTarget.order?.user?.phone || "",
          customerAddress: restockTarget.order?.address || "",
          deliveryMethod: restockTarget.order?.deliveryMethod || "Standard",
          reason: restockTarget.reason,
          returnImage: restockTarget.imageUrl,
          originalItemPrice: item.price, // Include the price capture from DB
        });

        return {
          productId: item.productId,
          quantity: item.quantity,
          variantDetails: item.variantAttributes ? [item.variantAttributes] : [],
          notes: `Auto-generated from approved return #${restockTarget.order?.id?.slice(-8).toUpperCase()} - Reason: ${restockTarget.reason} ||META||${itemMeta}`
        };
      });

      await Promise.all(requests.map(req => restockRequestService.create(req)));
      
      toast.success(`Successfully created ${requests.length} restock request(s)`);
      setRestockTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create restock requests");
    } finally {
      setSubmittingRestock(false);
    }
  };

  const handleRestockAction = async (id, action) => {
    setUpdatingRestockId(id);
    try {
      if (action === 'approve') await restockRequestService.approve(id);
      else if (action === 'process') await restockRequestService.process(id);
      else if (action === 'complete') await restockRequestService.complete(id);
      else if (action === 'Rejected') await restockRequestService.updateStatus(id, 'Rejected');
      else await restockRequestService.updateStatus(id, action);
      
      toast.success("Return process status updated");
      fetchRestockRequests(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setUpdatingRestockId(null);
    }
  };

  const columns = [
    {
      key: "order",
      label: "Order",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase text-[#171717] leading-none">#{row.order?.id?.slice(-8).toUpperCase() || "N/A"}</span>
          <span className="text-[9px] font-bold text-[#77736E] uppercase mt-1">{row.order?.user?.name || "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "items",
      label: "Returned Items",
      render: (row) => (
        <div className="flex flex-wrap gap-2 py-1">
          {row.items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4DED6] rounded-lg p-1 pr-3 shadow-sm group hover:border-[#C9A77A] transition-all">
              <div className="w-8 h-8 rounded bg-[#F1ECE5] overflow-hidden flex-shrink-0 border border-[#E4DED6]">
                <img 
                  src={resolveImageUrl(item.product?.images?.[0] || item.product?.imageUrl)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  alt="" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black uppercase tracking-tight text-[#171717] truncate max-w-[100px]">
                  {item.product?.name || "Product"}
                </span>
                <span className="text-[8px] font-bold text-[#77736E] uppercase">
                  QTY: {item.quantity}
                </span>
              </div>
            </div>
          ))}
          {(!row.items || row.items.length === 0) && <span className="text-[#77736E] text-xs">No items</span>}
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <div className="max-w-[200px]">
          <p className="text-[10px] text-[#5f5a53] leading-relaxed italic">"{truncate(row.reason, 60)}"</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="relative inline-block w-full min-w-[120px]">
          <select
            value={row.status}
            onChange={(e) => onStatusUpdate({ status: e.target.value }, row)}
            disabled={updating}
            className={`
              appearance-none w-full cursor-pointer
              text-[9px] font-black uppercase tracking-[0.1em]
              px-3 py-1.5 rounded-lg border
              transition-all duration-300
              ${row.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300' : ''}
              ${row.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300' : ''}
              ${row.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 hover:border-red-300' : ''}
              ${row.status === 'return picked' ? 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-300' : ''}
              focus:outline-none focus:ring-2 focus:ring-[#C9A77A]/25
              disabled:opacity-50 disabled:cursor-wait
            `}
          >
            {RETURN_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-white text-[#171717] font-bold uppercase">
                {s}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-[#5f5a53]">
            <RotateCcw size={8} />
          </div>
        </div>
      ),
    },
    {
      key: "restock",
      label: "Restock",
      render: (row) => (
        <button
          onClick={() => setRestockTarget(row)}
          disabled={row.status !== "approved"}
          className={`
            px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95
            ${row.status === "approved" 
              ? "bg-[#171717] text-white hover:bg-[#292929] shadow-sm" 
              : "bg-[#F1ECE5] text-[#8a857d] border border-[#E4DED6] cursor-not-allowed"}
          `}
        >
          Request Product
        </button>
      ),
    },
    {
      key: "createdAt",
      label: "Requested",
      render: (row) => (
        <div className="text-right">
          <p className="text-[10px] font-bold text-[#171717]">{formatDate(row.createdAt).split(",")[0]}</p>
          <p className="text-[8px] font-medium text-[#77736E] uppercase">{formatDate(row.createdAt).split(",")[1]}</p>
        </div>
      ),
    },
  ];

  const processColumns = [
    {
      key: "product",
      label: "Product Info",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F1ECE5] overflow-hidden shrink-0 border border-[#E4DED6]">
            <img src={resolveImageUrl(row.product?.images?.[0] || row.product?.imageUrl)} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0">
            <h4 className="font-headline font-bold text-[14px] leading-tight text-[#171717]">{row.product?.name || "Deleted Product"}</h4>
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] text-[#77736E] font-black tracking-widest uppercase truncate">SKU: {row.product?.sku || 'N/A'}</p>
              {row.variantDetails && row.variantDetails.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(() => {
                    const variantData = (row.variantDetails?.[0]?.attributes || row.variantDetails?.[0] || {});
                    return Object.entries(variantData)
                      .filter(([k, v]) => typeof v === 'string' || typeof v === 'number')
                      .map(([k, v]) => (
                        <span key={k} className="text-[8px] font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded px-1.5 py-0.5 uppercase tracking-widest">
                          {k}: {v}
                        </span>
                      ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "quantity",
      label: "Qty",
      render: (row) => (
        <span className="text-[11px] font-black text-[#171717]">{row.quantity} Units</span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          row.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          row.status === 'Approved' ? 'bg-sky-50 text-sky-800 border-sky-200' :
          row.status === 'Processing' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
          row.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          row.status === 'Closed' ? 'bg-[#F1ECE5] text-[#5f5a53] border-[#E4DED6]' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          {row.status === 'Closed' ? 'FULFILLED' : row.status}
        </span>
      )
    },
    {
      key: "actions",
      label: "Process Control",
      render: (row) => {
        const fulfillment = parseFulfillmentMeta(row.notes);
        const meta = parseNotesMeta(row.notes);
        const isExpanded = expandedRequestIds[row.id];
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {row.status === 'Pending' && (
                <button
                  onClick={() => handleRestockAction(row.id, 'approve')}
                  disabled={updatingRestockId === row.id}
                  className="px-3 py-1 bg-[#171717] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#292929] disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {row.status === 'Approved' && (
                <button
                  onClick={() => handleRestockAction(row.id, 'process')}
                  disabled={updatingRestockId === row.id}
                  className="px-3 py-1 bg-sky-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-sky-700 disabled:opacity-50"
                >
                  Start Processing
                </button>
              )}
              {row.status === 'Processing' && (
                <button
                  onClick={() => handleRestockAction(row.id, 'complete')}
                  disabled={updatingRestockId === row.id}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                >
                  Mark Completed
                </button>
              )}
              {(row.status === 'Completed' || row.status === 'Closed') && (
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Success
                </span>
              )}
              {(meta || fulfillment) && (
                <button
                  onClick={() => toggleRequestExpansion(row.id)}
                  className="ml-auto text-[9px] font-black text-[#171717] hover:underline uppercase tracking-widest flex items-center gap-1 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                  {isExpanded ? 'Hide' : 'More'} Details
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 mt-2">
                {meta && (
                  <div className="p-5 bg-[#FAF8F5] rounded-[20px] border border-[#E4DED6] flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 relative z-10">
                      <div className="w-6 h-6 rounded-lg bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-[#5f5a53]">person</span>
                      </div>
                      <p className="text-[10px] font-black text-[#77736E] uppercase tracking-[0.2em]">Customer Source</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 relative z-10">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em]">Contact Name</p>
                        <p className="text-[13px] font-black text-[#171717] leading-tight">{meta.customerName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em]">Mobile Link</p>
                        <p className="text-[12px] font-black text-[#292929]">{meta.customerPhone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em]">Digital Mail</p>
                        <p className="text-[11px] font-bold text-[#5f5a53] lowercase truncate">{meta.customerEmail}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em]">Shipping Address</p>
                        <p className="text-[11px] font-bold text-[#5f5a53] line-clamp-1" title={meta.customerAddress}>
                          {meta.customerAddress || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em]">Delivery Method</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A77A]" />
                          <p className="text-[11px] font-black text-[#171717] uppercase tracking-widest leading-none">{meta.deliveryMethod || 'Standard'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E4DED6] relative z-10">
                      <p className="text-[8px] text-[#8a857d] font-black uppercase tracking-[0.2em] mb-2">Claim Rationale</p>
                      <p className="text-[11px] text-[#292929] font-medium italic leading-relaxed bg-white p-3 rounded-xl border border-[#E4DED6]">
                        "{meta.reason}"
                      </p>
                    </div>
                  </div>
                )}
                {fulfillment && (
                  <div className="flex items-center gap-4 bg-white rounded-[20px] p-4 border border-[#E4DED6] shadow-sm group/fulfill transition-all hover:border-[#D6CDBF] translate-y-0.5">
                    <div className="w-12 h-12 rounded-[14px] bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden shrink-0 relative">
                      <img src={resolveImageUrl(fulfillment.imageUrl)} className="w-full h-full object-cover group-hover/fulfill:scale-110 transition-transform duration-500" alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <h5 className="text-[12px] font-black text-[#171717] truncate leading-tight uppercase tracking-tight">{fulfillment.name}</h5>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(fulfillment.variantAttributes || {}).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 bg-[#F1ECE5] text-[#5f5a53] rounded-[6px] text-[7px] font-black uppercase tracking-widest border border-[#E4DED6]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Premium Filter Console with Tabs */}
      <div className="admin-card rounded-[24px] p-3.5 flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex bg-[#F1ECE5] p-1 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar border border-[#E4DED6]">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 xl:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all ${activeTab === "requests" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717]'}`}
          >
            Return Requests
          </button>
          <button
            onClick={() => setActiveTab("process")}
            className={`flex-1 xl:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${activeTab === "process" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717]'}`}
          >
            Return Process
            {restockRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === "process" ? 'bg-white text-[#171717]' : 'bg-red-600 text-white'}`}>
                {restockRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 w-full">
          <SearchBar
            dark={false}
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={activeTab === "requests" ? "Search by customer name or status..." : "Search processed items..."}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "requests" ? (
        <Table
          dark={false}
          columns={columns}
          data={paginated.data}
          loading={loading}
          onView={openViewModal}
          emptyMessage="No returns found"
        />
      ) : (
        <Table
          dark={false}
          columns={processColumns}
          data={restockRequests}
          loading={restockLoading}
          emptyMessage="No returns currently in processing"
        />
      )}

      {/* Pagination */}
      {paginated.pages > 1 && (
        <div className="pt-2">
          <Pagination dark={false} currentPage={page} totalPages={paginated.pages} onPageChange={setPage} />
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        dark={false}
        isOpen={updateModalOpen}
        onClose={closeUpdateModal}
        title="Update Return Status"
        size="sm"
      >
        <form onSubmit={handleSubmit(onStatusUpdate)} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[#77736E] mb-1">Order</p>
            <p className="text-[#171717] font-semibold">
              {selectedReturn?.order?.id?.slice(-8).toUpperCase() || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#77736E] mb-1">Customer</p>
            <p className="text-[#171717]">{selectedReturn?.order?.user?.name || "Unknown"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#77736E] mb-1">Reason</p>
            <p className="text-[#292929] text-sm">{selectedReturn?.reason || "N/A"}</p>
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E4DED6] space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#77736E]">Items Requested for Return</p>
            {selectedReturn?.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E4DED6] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 rounded bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden flex-shrink-0">
                      {(item.product?.images?.[0] || item.product?.imageUrl) && (
                        <img src={resolveImageUrl(item.product.images?.[0] || item.product.imageUrl)} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#171717] leading-none">{item.product?.name || "Product"}</p>
                      {item.variantAttributes && (
                        <p className="text-[9px] text-[#77736E] font-medium uppercase mt-1">
                          {Object.entries(item.variantAttributes).map(([k,v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#171717] text-white text-[10px] font-black px-2 py-1 rounded">
                    QTY: {item.quantity}
                  </div>
                </div>
              ))}
          </div>

          {selectedReturn?.imageUrl && (
            <div>
              <p className="text-xs font-bold text-[#171717] mb-2 uppercase tracking-wide">Proof Image</p>
              <a href={resolveImageUrl(selectedReturn.imageUrl)} target="_blank" rel="noreferrer">
                <img 
                  src={resolveImageUrl(selectedReturn.imageUrl)} 
                  alt="Proof" 
                  className="w-full h-32 object-cover rounded-xl border border-[#E4DED6] cursor-pointer hover:opacity-85 transition-opacity" 
                />
              </a>
            </div>
          )}

          <Select
            dark={false}
            label="Status"
            options={RETURN_STATUSES.map((s) => ({ 
              value: s, 
              label: s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
            }))}
            {...register("status", { required: "Status is required" })}
            error={errors.status?.message}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-[#EFEAE2]">
            <Button
              dark={false}
              type="button"
              variant="secondary"
              onClick={closeUpdateModal}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button dark={false} type="submit" loading={updating}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Return"
        message={`Are you sure you want to delete this return request from ${deleteTarget?.order?.user?.name}? This action cannot be undone.`}
        loading={deleting}
        isDanger={true}
      />

      {/* View Details Modal */}
      <Modal
        dark={false}
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Return Request Details"
        size="4xl"
      >
        <div className="space-y-5">

          {/* ── ROW 1: Order + Customer + Reason ── */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Order */}
            <div className="flex-shrink-0 w-full md:w-[160px] bg-[#FAF8F5] rounded-2xl p-4 border border-[#E4DED6]">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#77736E] mb-3">Order</p>
              <p className="text-[15px] font-black text-[#171717] leading-none mb-2">#{viewTarget?.order?.id?.slice(-8).toUpperCase()}</p>
              <p className="text-[10px] text-[#77736E] font-medium">{viewTarget && formatDate(viewTarget.createdAt)}</p>
            </div>

            {/* Customer */}
            <div className="flex-1 min-w-0 bg-[#FAF8F5] rounded-2xl p-4 border border-[#E4DED6]">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#77736E] mb-3">Customer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-[#8a857d] mb-0.5">Name</p>
                  <p className="text-[13px] font-black text-[#171717] truncate">{viewTarget?.order?.user?.name}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-[#8a857d] mb-0.5">Email</p>
                  <p className="text-[13px] font-semibold text-[#5f5a53] truncate lowercase">{viewTarget?.order?.contactEmail || viewTarget?.order?.user?.email}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-[#8a857d] mb-0.5">Phone</p>
                  <p className="text-[13px] font-bold text-[#171717]">{viewTarget?.order?.contactNumber || viewTarget?.order?.user?.phone || '—'}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-[#8a857d] mb-0.5">Address</p>
                  <p className="text-[11px] font-medium text-[#5f5a53] leading-snug truncate">{viewTarget?.order?.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Reason (compact) ── */}
          <div className="bg-[#FAF8F5] rounded-2xl px-5 py-3 border border-[#E4DED6] flex items-start gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#77736E] pt-0.5 flex-shrink-0">Reason</span>
            <p className="text-[13px] text-[#292929] italic font-medium leading-relaxed">"{viewTarget?.reason}"</p>
          </div>

          {/* ── ROW 3: Returned Items (horizontal) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#77736E]">Returned Items</p>
              <span className="text-[9px] font-bold text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] px-2 py-0.5 rounded-full">{viewTarget?.items?.length} {viewTarget?.items?.length === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              {viewTarget?.items?.map((item, idx) => (
                <div key={idx} className="group flex items-center gap-3 bg-white border border-[#E4DED6] rounded-2xl p-3 pr-5 hover:border-[#D6CDBF] shadow-sm transition-all min-w-[280px] flex-1">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-[#F1ECE5] overflow-hidden flex-shrink-0 border border-[#E4DED6]">
                    {(item.product?.images?.[0] || item.product?.imageUrl) ? (
                      <img src={resolveImageUrl(item.product.images?.[0] || item.product.imageUrl)} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#8a857d] uppercase">No Img</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-[#171717] leading-tight truncate">{item.product?.name || "Unknown Product"}</p>
                    {item.variantAttributes && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(item.variantAttributes).map(([k, v]) => (
                          <span key={k} className="text-[9px] font-bold text-[#77736E] bg-[#F1ECE5] border border-[#E4DED6] px-1.5 py-0.5 rounded">
                            {k}: <span className="text-[#171717]">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Qty badge */}
                  <div className="flex-shrink-0 bg-[#171717] text-white text-[10px] font-black w-8 h-8 rounded-lg flex items-center justify-center">
                    {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ROW 4: Status bar ── */}
          <div className="bg-[#FAF8F5] border border-[#E4DED6] rounded-2xl px-5 py-4 flex items-center gap-5">
            {/* Current status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${
                STATUS_COLORS[viewTarget?.status] === 'red' ? 'bg-red-500' : 
                STATUS_COLORS[viewTarget?.status] === 'green' ? 'bg-emerald-500' : 
                STATUS_COLORS[viewTarget?.status] === 'blue' ? 'bg-sky-500' : 
                'bg-amber-500'
              }`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5f5a53]">
                {viewTarget?.status}
              </span>
            </div>

            <div className="w-px h-6 bg-[#E4DED6] flex-shrink-0" />

            {/* Update form */}
            <form onSubmit={handleSubmit((data) => {
              onStatusUpdate(data);
              setViewTarget(null);
            })} className="flex items-center gap-3 flex-1">
              <select
                {...register("status", { required: "Status is required" })}
                className="flex-1 bg-white border border-[#E4DED6] text-[#171717] text-[12px] font-bold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#C9A77A]/20 focus:border-[#C9A77A] focus:outline-none appearance-none cursor-pointer"
              >
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-white text-[#171717]">
                    {s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              <Button 
                dark={false}
                type="submit" 
                loading={updating} 
                className="bg-[#171717] text-white hover:bg-[#292929] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex-shrink-0"
              >
                Apply
              </Button>
            </form>
          </div>

        </div>
      </Modal>

      {/* Restock Confirmation Modal */}
      <Modal
        dark={false}
        isOpen={!!restockTarget}
        onClose={() => setRestockTarget(null)}
        title="Confirm Restock Request"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#77736E] mb-4">Items to Restock</p>
            <div className="space-y-3">
              {restockTarget?.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E4DED6] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F1ECE5] overflow-hidden shrink-0 border border-[#E4DED6]">
                      <img src={resolveImageUrl(item.product?.images?.[0] || item.product?.imageUrl)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#171717] truncate max-w-[120px]">{item.product?.name}</p>
                      {item.variantAttributes && Object.entries(item.variantAttributes).length > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {Object.entries(item.variantAttributes).map(([key, value]) => (
                            <span key={key} className="text-[8px] font-bold uppercase tracking-wider text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] px-1.5 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[8px] text-[#77736E] font-bold uppercase mt-1">Ordered: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-black bg-[#F1ECE5] border border-[#E4DED6] text-[#171717] px-2.5 py-1 rounded">
                    QTY: {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3">
            <span className="material-symbols-outlined text-amber-700">info</span>
            <p className="text-[12px] text-amber-900 font-medium leading-relaxed">
              This will create a new restock request for each item listed above. The inventory manager will be notified to source these products.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#EFEAE2]">
            <Button
              dark={false}
              variant="secondary"
              onClick={() => setRestockTarget(null)}
              disabled={submittingRestock}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button 
              dark={false}
              onClick={handleRestock} 
              loading={submittingRestock}
              className="bg-[#171717] text-white hover:bg-[#292929] rounded-xl px-8"
            >
              Submit Requests
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
