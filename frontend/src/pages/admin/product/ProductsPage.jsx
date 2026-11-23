import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import JsBarcode from "jsbarcode";
import { useAuth } from "../../../hooks/useAuth";
import {
  productsService,
  categoriesService,
  suppliersService,
  aiService,
  activitiesService,
  restockRequestService,
  ordersService,
} from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal, ModalPortal } from "../../../components/common/Modal";
import { SectionCard } from "../../../components/common/SectionCard";
import { ProductImageGallery } from "../../../components/common/ProductImageGallery";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { Select } from "../../../components/common/Select";
import { Textarea } from "../../../components/common/Textarea";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { FileUpload } from "../../../components/common/FileUpload";
import { Badge } from "../../../components/common/Badge";
import { Spinner } from "../../../components/common/Spinner";
import { productRules } from "../../../validations/product.validation";
import { formatPrice } from "../../../utils/formatters";
import { getDisplayColor, toHexColor, isExplicitColorCode } from "../../../utils/colorUtils";
import { filterBySearch, filterByField, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";

const PAGE_SIZE = 7;

// Shared column template for the product list header + rows (presentation only).
const PRODUCT_GRID =
  "md:grid-cols-[minmax(0,2.4fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(110px,1.1fr)_minmax(100px,1fr)_172px] xl:grid-cols-[minmax(0,2.4fr)_minmax(90px,1fr)_minmax(110px,1fr)_minmax(120px,1.1fr)_minmax(100px,1fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)_172px]";

// Color Architect Component
const ColorAtelier = ({ value = [], onChange, options = [], synapticPalette = [], syncNewTone, resolveColorName }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#162b56");
  const [customName, setCustomName] = useState("");
  const [hasPickedCustomColor, setHasPickedCustomColor] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const triggerRef = useRef(null);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportMargin = 12;
    const gap = 8;
    const width = Math.min(280, window.innerWidth - viewportMargin * 2);
    const left = Math.max(
      viewportMargin,
      Math.min(rect.left, window.innerWidth - width - viewportMargin)
    );
    const spaceAbove = rect.top - viewportMargin;
    const spaceBelow = window.innerHeight - rect.bottom - viewportMargin;
    const openBelow = spaceBelow >= 340 || spaceBelow >= spaceAbove;

    if (openBelow) {
      setPopoverStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        width,
        maxHeight: Math.min(480, Math.max(220, spaceBelow - gap)),
      });
    } else {
      setPopoverStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + gap,
        left,
        width,
        maxHeight: Math.min(480, Math.max(220, spaceAbove - gap)),
      });
    }
  }, []);

  useEffect(() => {
    if (!isPickerOpen) return;
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isPickerOpen, updatePopoverPosition]);

  // Ensure value is always an array for multi-tone
  const currentTones = Array.isArray(value) ? value : (value ? [value] : []);

  const hasTone = (tone) => {
    const target = String(tone).trim().toLowerCase();
    return currentTones.some((t) => String(t).trim().toLowerCase() === target);
  };

  const toggleTone = (tone) => {
    const target = String(tone).trim().toLowerCase();
    const isSelected = currentTones.some((t) => String(t).trim().toLowerCase() === target);
    const next = isSelected
      ? currentTones.filter((t) => String(t).trim().toLowerCase() !== target)
      : [...currentTones, tone];
    onChange(next);
  };

  const handleNativeColorChange = (e) => {
    const picked = e.target.value;
    if (picked) {
      setCustomColor(picked.toUpperCase());
      setHasPickedCustomColor(true);
    }
  };

  const handleCustomNameChange = (e) => {
    const nextName = e.target.value;
    setCustomName(nextName);
    const trimmed = nextName.trim();
    if (!trimmed) return;

    if (isExplicitColorCode(trimmed)) {
      const hex = toHexColor(trimmed);
      if (hex) setCustomColor(hex.toUpperCase());
    } else if (!hasPickedCustomColor) {
      const namedHex = toHexColor(trimmed);
      if (namedHex) setCustomColor(namedHex.toUpperCase());
    }
  };

  const handleApplyCustom = () => {
    const trimmedName = customName.trim();
    let finalColorValue = customColor.startsWith("#") ? customColor.toUpperCase() : customColor;
    let displayLabel = trimmedName;

    if (isExplicitColorCode(trimmedName)) {
      finalColorValue = trimmedName.startsWith("#") ? trimmedName.toUpperCase() : trimmedName;
      displayLabel = "";
    } else if (!hasPickedCustomColor && trimmedName) {
      const namedHex = toHexColor(trimmedName);
      if (namedHex) {
        finalColorValue = namedHex.toUpperCase();
      }
    }

    if (!hasTone(finalColorValue)) {
      syncNewTone(finalColorValue, displayLabel);
      toggleTone(finalColorValue);
    }
    setCustomName("");
    setHasPickedCustomColor(false);
  };

  const nativePickerHex = toHexColor(customColor) || "#162b56";

  return (
    <div ref={triggerRef} className="relative">
      <div
        onClick={() => {
          const nextOpen = !isPickerOpen;
          if (nextOpen) updatePopoverPosition();
          setIsPickerOpen(nextOpen);
        }}
        className="flex flex-wrap gap-1.5 p-2 bg-[#FAF8F5] border border-[#E4DED6] rounded-[12px] min-h-[42px] min-w-[140px] cursor-pointer hover:border-[#C9A77A] transition-all items-center"
      >
        {currentTones.length === 0 ? (
          <span className="text-[#8a857d] text-[11px] font-black uppercase tracking-widest pl-1">Pick Color</span>
        ) : (
          currentTones.map(t => (
            <div key={t} className="group/chip flex items-center gap-1.5 bg-white border border-[#E4DED6] rounded-[8px] pl-1.5 pr-1.5 py-0.5 shadow-2xs">
              <div
                className="w-3 h-3 rounded-full border border-[#D6CDBF]"
                style={{ backgroundColor: getDisplayColor(t) }}
              />
              <span className="text-[9px] font-black text-[#171717] uppercase truncate max-w-[60px]">{resolveColorName(t)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTone(t);
                }}
                className="w-3.5 h-3.5 flex items-center justify-center text-[#8a857d] hover:text-red-600 transition-all"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          ))
        )}
      </div>

      {isPickerOpen && popoverStyle && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setIsPickerOpen(false)} />
          <div
            style={popoverStyle}
            className="z-[56] bg-white border border-[#E4DED6] shadow-[0_18px_48px_rgba(23,23,23,0.12)] rounded-[18px] pt-4 px-4 pb-3 animate-in fade-in duration-200 overflow-y-auto custom-scrollbar"
          >
            <div className="mb-4">
              <h4 className="text-[11px] font-black text-[#171717] uppercase tracking-[0.2em] mb-2.5">Colour Picker</h4>
              <div className="grid grid-cols-5 gap-2">
                {options.map(opt => {
                  const colorVal = getDisplayColor(opt);
                  const isSelected = hasTone(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleTone(opt)}
                      className={`w-9 h-9 rounded-[10px] border-2 transition-all duration-300 ${isSelected ? 'border-[#171717] scale-110 shadow-md ring-4 ring-[#C9A77A]/25' : 'border-[#E4DED6] hover:scale-105 hover:border-[#9A7B4A]'}`}
                      style={{ backgroundColor: colorVal }}
                      title={opt}
                    />
                  );
                })}
              </div>
            </div>

            {synapticPalette?.length > 0 && (
              <div className="mb-4 pt-4 border-t border-[#EFEAE2]">
                <h4 className="text-[11px] font-black text-[#171717] uppercase tracking-[0.2em] mb-2.5">Recent Colours</h4>
                <div className="grid grid-cols-5 gap-2">
                  {synapticPalette.slice(-10).map(t => {
                    const isSelected = hasTone(t.hex);
                    return (
                      <button
                        key={t.hex}
                        type="button"
                        onClick={() => toggleTone(t.hex)}
                        className={`w-9 h-9 rounded-[10px] border-2 transition-all duration-300 ${isSelected ? 'border-[#171717] scale-110 shadow-md ring-4 ring-[#C9A77A]/25' : 'border-[#E4DED6] hover:scale-105 hover:border-[#9A7B4A]'}`}
                        style={{ backgroundColor: getDisplayColor(t.hex) }}
                        title={t.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#EFEAE2] mb-1">
              <h4 className="text-[11px] font-black text-[#171717] uppercase tracking-[0.2em] mb-3">New Colour Discovery</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-[10px] border border-[#E4DED6] p-0.5 shadow-2xs relative overflow-hidden flex-shrink-0 group/picker hover:border-[#C9A77A] transition-all"
                    style={{ backgroundColor: getDisplayColor(customColor) }}
                  >
                    <input
                      type="color"
                      value={nativePickerHex}
                      onInput={handleNativeColorChange}
                      onChange={handleNativeColorChange}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Colour Name"
                    value={customName}
                    onChange={handleCustomNameChange}
                    className="flex-1 min-w-0 bg-[#FAF8F5] border border-[#E4DED6] text-[#171717] placeholder:text-[#9d978f] rounded-[10px] px-3.5 h-10 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:border-[#C9A77A] transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full bg-[#171717] text-white text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-[10px] hover:bg-[#292929] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Add Colour
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const hasAccess = (...roles) => isAdmin || roles.includes(userRole);
  const canManageProducts = hasAccess('product manager');

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / Filter / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [sku, setSku] = useState("");
  const [synapticPalette, setSynapticPalette] = useState([]); // Array of { hex, name }

  // Image
  const [images, setImages] = useState([]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // AI Description
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const [productName, setProductName] = useState("");

  // Confirmation States
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // View Modal
  const [viewProduct, setViewProduct] = useState(null);
  const [activeDetailPhoto, setActiveDetailPhoto] = useState(null);

  // Sub-component Deletion
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);

  // Restock Request State
  const [restockModalProduct, setRestockModalProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [variantQuantities, setVariantQuantities] = useState({}); // { index: quantity }
  const [restockNotes, setRestockNotes] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products"); // 'products' | 'restock' | 'return_process'
  const [restockRequests, setRestockRequests] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [expandedRequestIds, setExpandedRequestIds] = useState({}); // { requestId: boolean }

  // Send Product Replacement Logic
  const [isSendProductModalOpen, setIsSendProductModalOpen] = useState(false);
  const [selectedRequestForSend, setSelectedRequestForSend] = useState(null);
  const [replacementProduct, setReplacementProduct] = useState(null);
  const [submittingReplacement, setSubmittingReplacement] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onChange",
  });

  // Real-time Stock Sync: Calculate total stock based on variants
  useEffect(() => {
    if (variants.length > 0) {
      const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      setValue("stock", totalStock);
    }
  }, [variants, setValue]);

  // Computed data
  const filtered = useMemo(() => {
    let data = filterBySearch(products, searchTerm, ["name", "category.name", "sku", "description"]);
    data = filterByField(data, "categoryId", categoryFilter);

    if (statusFilter === "active") {
      data = data.filter(p => p.stock > 10);
    } else if (statusFilter === "low") {
      data = data.filter(p => p.stock <= 10 && p.stock > 0);
    } else if (statusFilter === "draft") {
      data = data.filter(p => p.stock === 0);
    }

    if (sortFilter === "price_asc") {
      data = [...data].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortFilter === "price_desc") {
      data = [...data].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return data;
  }, [products, searchTerm, categoryFilter, statusFilter, sortFilter]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          productsService.getAll(0, 1000),
          categoriesService.getAll(0, 1000),
          suppliersService.getAll(0, 1000),
        ]);

        setProducts(productsRes.data.data.products || []);
        setCategories(categoriesRes.data.data.categories || []);
        setSuppliers(suppliersRes.data.data.suppliers || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const parseNotesMeta = (notes) => {
    if (!notes || !notes.includes("||META||")) return null;
    try {
      // Split by ||META|| and then isolate only the chunk before any subsequent tag
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
      // Split by ||FULFILLMENT|| and then isolate only the chunk before any subsequent tag
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

  const fetchRestockRequests = async (showLoading = true) => {
    if (showLoading) setRestockLoading(true);
    try {
      const res = await restockRequestService.getAll();
      const all = res.data.data || [];

      // Standard restocks (Manual sourcing)
      const standard = all.filter(r => !r.notes?.includes("return #"));
      // Return-based restocks
      const returnBased = all.filter(r => r.notes?.includes("return #"));

      // We'll store them in a unified way or split them? 
      // Let's store them in restockRequests but filter during render for less state management overhead
      setRestockRequests(all);
    } catch (err) {
      if (showLoading) toast.error("Failed to fetch restock requests");
    } finally {
      if (showLoading) setRestockLoading(false);
    }
  };

  const handleSendProduct = async (product, specificVariant = null) => {
    if (!selectedRequestForSend) return;
    const meta = parseNotesMeta(selectedRequestForSend.notes);
    if (!meta) {
      toast.error("Missing customer metadata in request");
      return;
    }

    setSubmittingReplacement(true);
    try {
      // Price Validation: Cannot exceed original item price
      if (specificVariant && meta.originalItemPrice && specificVariant.price > meta.originalItemPrice) {
        toast.error(`Price Exceeded: Replacement (${specificVariant.price} LKR) cannot be more expensive than original (${meta.originalItemPrice} LKR)`);
        setSubmittingReplacement(false);
        return;
      } else if (!specificVariant && meta.originalItemPrice && product.price > meta.originalItemPrice) {
        toast.error(`Price Exceeded: Replacement (${product.price} LKR) cannot be more expensive than original (${meta.originalItemPrice} LKR)`);
        setSubmittingReplacement(false);
        return;
      }

      const orderData = {
        userId: meta.userId,
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 0,
            variantAttributes: specificVariant
              ? specificVariant.attributes
              : (product.variants?.length > 0 ? product.variants[0].attributes : {}),
            variantId: specificVariant?.id || (product.variants?.length > 0 ? product.variants[0].id : null)
          }
        ],
        address: meta.customerAddress,
        contactNumber: meta.customerPhone,
        contactEmail: meta.customerEmail,
        returnRequestId: meta.returnId,
        notes: `Replacement for Return #${meta.returnId.slice(-8).toUpperCase()}`,
      };

      console.log("[ReturnReplacement] Submitting Order Data:", orderData);
      await ordersService.createReturnOrder(orderData);

      const fulfillment = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        variantAttributes: specificVariant
          ? specificVariant.attributes
          : (product.variants?.length > 0 ? product.variants[0].attributes : {})
      };

      // Update restock request status to Closed or similar?
      await restockRequestService.updateStatus(selectedRequestForSend.id, "Closed", fulfillment);

      toast.success("Replacement order created successfully!");
      setIsSendProductModalOpen(false);
      setSelectedRequestForSend(null);
      fetchRestockRequests(false);
    } catch (err) {
      console.error("[ReturnReplacement] Error details:", err);
      const message = err.response?.data?.message || err.message || "Failed to create replacement order";
      toast.error(message);
    } finally {
      setSubmittingReplacement(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await productsService.getAll(0, 1000);
      setAllProducts(res.data.data?.products || []);
    } catch (err) {
      console.error("Failed to fetch all products", err);
    }
  };

  useEffect(() => {
    if (isSendProductModalOpen) {
      fetchAllProducts();
    }
  }, [isSendProductModalOpen]);

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
        case 'add-to-stock':
          response = await restockRequestService.addToStock(id);
          toast.success("Stock updated and request closed");
          // Refresh products to show updated stock
          const productsRes = await productsService.getAll(0, 1000);
          setProducts(productsRes.data.data.products || []);
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

  // Deep-linking from notifications
  useEffect(() => {
    const viewId = searchParams.get("viewId");
    if (viewId) {
      // Clear the param after reading to avoid re-opening on manual refresh or page changes
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("viewId");
      setSearchParams(newParams, { replace: true });

      // Fetch product and open modal
      productsService.getById(viewId).then(res => {
        const product = res.data.data;
        if (product) {
          setViewProduct(product);
          setActiveDetailPhoto(product.imageUrl);
        }
      }).catch(err => {
        console.error("Failed to deep-link view product:", err);
      });
    }
  }, [searchParams, setSearchParams]);

  // Image handler
  const handleImageChange = (files) => {
    const newFiles = Array.from(files);

    setImages(prev => {
      const totalCount = prev.length + newFiles.length;
      if (totalCount > 5) {
        toast.error("You can upload a maximum of 5 images.");
        return prev;
      }

      const addedImages = newFiles.map(file => ({
        id: `new-${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file)
      }));

      return [...prev, ...addedImages];
    });
  };

  const removeImage = (idToRemove) => {
    setImageToDelete(idToRemove);
  };

  const confirmRemoveImage = () => {
    if (imageToDelete) {
      setImages(prev => prev.filter(img => img.id !== imageToDelete));
      setImageToDelete(null);
      toast.success("Image removed from gallery");
    }
  };

  // Restock Request Handlers
  const openRestockModal = (product) => {
    setRestockModalProduct(product);
    setRestockQuantity(1);
    setRestockNotes("");
  };

  const closeRestockModal = () => {
    setRestockModalProduct(null);
    setVariantQuantities({});
    setRestockQuantity(1);
    setRestockNotes("");
  };

  const handleRestockSubmit = async () => {
    if (!restockModalProduct) return;

    let finalQuantity = parseInt(restockQuantity);
    let variantDetails = null;

    if (restockModalProduct.variants && Array.isArray(restockModalProduct.variants) && restockModalProduct.variants.length > 0) {
      variantDetails = restockModalProduct.variants
        .map((v, idx) => ({
          ...v,
          quantity: parseInt(variantQuantities[idx] || 0)
        }))
        .filter(v => v.quantity > 0);

      finalQuantity = variantDetails.reduce((sum, v) => sum + v.quantity, 0);
    }

    if (finalQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setRestockLoading(true);
    try {
      await restockRequestService.create({
        productId: restockModalProduct.id,
        quantity: finalQuantity,
        variantDetails: variantDetails,
        notes: restockNotes,
      });
      toast.success("Restock request submitted successfully");
      closeRestockModal();
      // If we are on the restock tab, refresh the list
      if (activeTab === "restock") {
        const res = await restockRequestService.getAll();
        setRestockRequests(res.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit restock request");
    } finally {
      setRestockLoading(false);
    }
  };

  // Helper to resolve image URLs consistently
  const getFinalImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `http://localhost:5001${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const setMainImage = (id) => {
    setImages(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [chosen] = updated.splice(idx, 1);
      updated.unshift(chosen);
      return updated;
    });
  };

  const generateSKU = (name) => {
    if (!name) return "";
    const prefix = "RA";
    const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const namePart = cleanName.substring(0, 6);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${namePart}-${randomPart}`.substring(0, 20);
  };

  const resolveColorName = (hex) => {
    if (!hex) return "";
    const str = String(hex).trim();

    // Check Synaptic Palette first (manual names)
    const synapticTone = synapticPalette.find(t => t.hex.toUpperCase() === str.toUpperCase());
    if (synapticTone) return synapticTone.name;

    // If it's already a named color (not a hex/rgb/hsl code), show the name directly
    if (!isExplicitColorCode(str)) {
      return str;
    }

    const names = {
      "#000000": "Black", "#FFFFFF": "White", "#FF0000": "Red", "#00FF00": "Lime",
      "#0000FF": "Blue", "#FFFF00": "Yellow", "#FFA500": "Orange", "#800080": "Purple",
      "#FFC0CB": "Pink", "#A52A2A": "Brown", "#808080": "Gray", "#008080": "Teal",
      "#4B0082": "Indigo", "#EE82EE": "Violet", "#FF00FF": "Magenta", "#00FFFF": "Cyan",
      "#F5F5DC": "Beige", "#98FB98": "Pale Green", "#E6E6FA": "Lavender", "#FFD700": "Gold"
    };
    return names[str.toUpperCase()] || str.toUpperCase();
  };

  const syncNewTone = (hex, name) => {
    if (!hex) return;
    const normalizedVal = hex.startsWith("#") ? hex.toUpperCase() : hex.trim();
    setSynapticPalette(prev => {
      // Don't add duplicates
      if (prev.some(t => t.hex.toUpperCase() === normalizedVal.toUpperCase())) return prev;
      const toneName = name?.trim() || resolveColorName(normalizedVal);
      return [...prev, { hex: normalizedVal, name: toneName }];
    });
  };

  const isColorAttribute = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower === 'color' || lower === 'colour' || lower === 'colours';
  };

  const isMaterialAttribute = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower === 'material' || lower === 'fabric';
  };

  const isPropagatableAttribute = (name) => {
    return isColorAttribute(name) || isMaterialAttribute(name);
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setProductName("");
    reset({
      name: "",
      description: "",
      price: "",
      costPrice: "",
      stock: "",
      categoryId: "",
      supplierId: "",
    });
    setVariants([]);
    setSynapticPalette([]);
    setIsActive(true);
    setSku("");
    setImages([]); // Clear images for new product
  };

  const openEditModal = async (product) => {
    setModalMode("edit");
    setSelectedProduct(product);

    // CRITICAL: Fetch fresh product data from the API to get current stock values.
    // The products list in memory may have stale stock after orders, returns, or restocks.
    let freshProduct = product;
    try {
      const res = await productsService.getById(product.id);
      if (res.data?.data) {
        freshProduct = res.data.data;
        setSelectedProduct(freshProduct);
      }
    } catch (err) {
      console.warn("[EditModal] Failed to fetch fresh product data, using list data:", err);
    }

    const initialImages = [];
    if (freshProduct.images && freshProduct.images.length > 0) {
      freshProduct.images.forEach((url, i) => {
        if (!url) return;
        initialImages.push({
          id: `existing-${i}`,
          file: null,
          url: getFinalImageUrl(url)
        });
      });
    } else if (freshProduct.imageUrl) {
      initialImages.push({
        id: 'legacy-existing',
        file: null,
        url: getFinalImageUrl(freshProduct.imageUrl)
      });
    }
    setImages(initialImages);

    setProductName(freshProduct.name || "");
    reset({
      name: freshProduct.name || "",
      description: freshProduct.description || "",
      price: freshProduct.price || 0,
      costPrice: freshProduct.costPrice || 0,
      stock: freshProduct.stock || 0,
      categoryId: freshProduct.categoryId || "",
      supplierId: freshProduct.supplierId || "",
      sku: freshProduct.sku || "",
    });
    const loadedVariants = freshProduct.variants || [];
    setVariants(loadedVariants);
    // Preserve any existing custom hex/rgb colours from this product in Recent Colours
    const existingCustomTones = [];
    const seenCustom = new Set();
    loadedVariants.forEach((v) => {
      if (!v?.attributes) return;
      Object.entries(v.attributes).forEach(([k, val]) => {
        if (!isColorAttribute(k)) return;
        const list = Array.isArray(val) ? val : [val];
        list.forEach((item) => {
          if (typeof item === "string" && isExplicitColorCode(item)) {
            const normalized = item.startsWith("#") ? item.toUpperCase() : item.trim();
            if (!seenCustom.has(normalized.toLowerCase())) {
              seenCustom.add(normalized.toLowerCase());
              existingCustomTones.push({ hex: normalized, name: normalized });
            }
          }
        });
      });
    });
    setSynapticPalette(existingCustomTones);
    setIsActive(freshProduct.isActive !== false);
    setSku(freshProduct.sku || "");
  };

  const handleCloseAttempt = () => {
    // Consider it dirty if form is dirty OR variants added OR new images provided OR name entered
    const isDirtyWorkspace = isDirty || variants.length > 0 || images.some(img => !!img.file) || !!productName;
    if (isDirtyWorkspace) {
      setShowDiscardConfirm(true);
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setImages([]);
    reset();
    setVariants([]);
    setSynapticPalette([]);
    setIsActive(true);
    setSku("");
    setShowPublishConfirm(false);
    setShowDiscardConfirm(false);
  };

  const handlePublishRequest = () => {
    // Validate first, then show confirm
    handleSubmit(() => {
      setShowPublishConfirm(true);
    })();
  };

  // Generate AI description
  const handleGenerateDescription = async () => {
    if (!productName || productName.length < 2) {
      toast.error("Please enter a product name first");
      return;
    }

    setGeneratingDesc(true);
    try {
      const res = await aiService.generateProductDescription(productName);
      if (res.data?.success) {
        setValue("description", res.data.data.description);
        toast.success("Description generated!");
      } else {
        toast.error(res.data?.message || "Failed to generate description");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to generate description";
      toast.error(errMsg);
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", data.price);
      formData.append("costPrice", data.costPrice || 0);
      formData.append("stock", data.stock);
      formData.append("categoryId", data.categoryId);
      if (data.supplierId) {
        formData.append("supplierId", data.supplierId);
      }

      const existingImages = [];
      images.forEach(img => {
        if (img.file) {
          formData.append("images", img.file);
        } else {
          // If the URL was prepended with localhost, strip it out to avoid saving localhost hardcodes,
          // except Supabase URLs are already absolute starting with https.
          const finalUrl = img.url.replace('http://localhost:5001', '');
          existingImages.push(finalUrl);
        }
      });

      if (existingImages.length > 0) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }

      formData.append("variants", JSON.stringify(variants));
      formData.append("isActive", isActive);
      formData.append("sku", sku);

      if (modalMode === "create") {
        await productsService.create(formData);
        toast.success("Product created successfully");
      } else {
        await productsService.update(selectedProduct.id, formData);
        toast.success("Product updated successfully");
      }

      // Re-fetch products
      const res = await productsService.getAll(0, 1000);
      setProducts(res.data.data.products || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save product";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const openDeleteDialog = (product) => {
    setDeleteTarget(product);
  };

  const addVariant = () => {
    const catId = watch("categoryId");
    const category = categories.find(c => c.id === catId);
    const config = category?.variantConfig ? (typeof category.variantConfig === 'string' ? JSON.parse(category.variantConfig) : category.variantConfig) : null;

    const initialAttributes = {};
    if (variants.length > 0) {
      // Inherit from the first variant (Master Template)
      Object.assign(initialAttributes, variants[0].attributes);
    } else if (Array.isArray(config)) {
      config.forEach(cfg => {
        initialAttributes[cfg.name] = cfg.options?.[0] || "";
      });
    }
    setVariants([...variants, { attributes: initialAttributes, stock: 0, priceAdj: 0 }]);
  };

  const removeVariant = (index) => {
    setVariantToDelete(index);
  };

  const confirmRemoveVariant = () => {
    if (variantToDelete !== null) {
      setVariants(variants.filter((_, i) => i !== variantToDelete));
      setVariantToDelete(null);
      toast.success("Variant removed from collection");
    }
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    if (field === 'stock' || field === 'priceAdj') {
      const numericValue = parseInt(value) || 0;
      updated[index][field] = field === 'stock' ? Math.max(0, numericValue) : numericValue;
    } else {
      if (!updated[index].attributes) updated[index].attributes = {};
      updated[index].attributes[field] = value;

      // Master Propagation Logic:
      // If updating the first row's color or material, propagate to all other rows
      if (index === 0 && isPropagatableAttribute(field)) {
        updated.forEach((v, i) => {
          if (i > 0) {
            if (!v.attributes) v.attributes = {};
            v.attributes[field] = value;
          }
        });
      }
    }
    setVariants(updated);
  };
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await productsService.delete(deleteTarget.id);
      setProducts(products.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Product deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete product";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((p) => ({
        ...p,
        _categoryName: categories.find((c) => c.id === p.categoryId)?.name || "-",
      }));

      exportTablePDF(
        "Products Report",
        [
          { label: "Product", key: "name" },
          { label: "Category", key: "_categoryName" },
          { label: "Price", key: "price", format: "price" },
          { label: "Stock", key: "stock" },
        ],
        dataForPdf,
        "products-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  const openViewModal = (product) => {
    setViewProduct(product);
    setActiveDetailPhoto(product.images?.[0] || product.imageUrl);
  };

  const closeViewModal = () => {
    setViewProduct(null);
    setActiveDetailPhoto(null);
  };

  // Table columns
  const columns = [
    {
      key: "imageUrl",
      label: "Image",
      render: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl.startsWith('http') ? row.imageUrl : `http://localhost:5001${row.imageUrl}`}
            alt={row.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: "name", label: "Product Name" },
    {
      key: "categoryId",
      label: "Category",
      render: (row) => categories.find((c) => c.id === row.categoryId)?.name || "-",
    },
    {
      key: "price",
      label: "Price",
      render: (row) => formatPrice(row.price),
    },
    {
      key: "stock",
      label: "Stock",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={row.stock < 10 ? "text-red-600 font-semibold" : ""}>
            {row.stock}
          </span>
          {row.stock < 10 && (
            <Badge color="red">Low</Badge>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <AdminPageSkeleton />;
  }

  // Visual reference only: stock bars are drawn relative to the largest stock level in the catalogue.
  // (No stock rule / threshold is derived from this value.)
  const maxStock = Math.max(1, ...products.map((p) => Number(p.stock) || 0));

  return (
    <div>
      {/* Header Actions */}
      <div className="flex justify-end mb-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleExportPDF}
            className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#171717]/80 flex items-center gap-2 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/60"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export PDF</span>
          </button>
          {canManageProducts && (
            <button
              onClick={openCreateModal}
              className="h-11 px-7 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] hover:shadow-[0_10px_26px_rgba(23,23,23,0.24)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/70 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] font-semibold">add</span>
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4 text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Premium Multi-Filter Console with Tabs */}
      <div className="admin-card rounded-[24px] p-3 mb-8 flex flex-col gap-3 animate-fade-in-up">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
          {/* Tab Switcher */}
          <div className="flex bg-[#F1ECE5] p-1 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar border border-[#E4DED6]">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all ${activeTab === "products" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717] hover:bg-white/60'}`}
            >
              Inventory Management
            </button>
            <button
              onClick={() => setActiveTab("restock")}
              className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${activeTab === "restock" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717] hover:bg-white/60'}`}
            >
              Restock Process
              {restockRequests.filter(r => r.status === 'Pending' && !r.notes?.includes("return #")).length > 0 && (
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === "restock" ? 'bg-white text-[#171717]' : 'bg-[#171717] text-white'}`}>
                  {restockRequests.filter(r => r.status === 'Pending' && !r.notes?.includes("return #")).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("return_process")}
              className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${activeTab === "return_process" ? 'bg-[#171717] text-white shadow-sm' : 'text-[#5f5a53] hover:text-[#171717] hover:bg-white/60'}`}
            >
              Return Process
              {restockRequests.filter(r => r.status === 'Pending' && r.notes?.includes("return #")).length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full">
                  {restockRequests.filter(r => r.status === 'Pending' && r.notes?.includes("return #")).length}
                </span>
              )}
            </button>
          </div>

          {/* Search Engine */}
          <div className="flex-1 w-full relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] text-[20px] group-focus-within:text-[#171717] transition-colors">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={activeTab === "products" ? "Search products by SKU, name, or collector ID..." : "Search restocking workflow..."}
              className="w-full bg-white hover:bg-[#FAF8F5] focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl py-2.5 pl-11 pr-4 text-[13.5px] font-medium transition-all outline-none text-[#171717] placeholder-[#9d978f] h-12"
            />
          </div>
        </div>

        {/* Dynamic Filter Group */}
        {activeTab === "products" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <Select
              dark={false}
              hidePlaceholder
              fullWidth={false}
              containerClassName="min-w-[160px]"
              className="h-12 pl-4! pr-10! text-[13px] font-semibold transition-all rounded-[14px]! bg-white! border-[#E4DED6]! text-[#171717]! shadow-none! backdrop-blur-none! hover:bg-[#FAF8F5]! hover:shadow-none! focus:bg-white! focus:border-[#C9A77A]! focus:ring-4! focus:ring-[#C9A77A]/15!"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Collections" },
                ...categories.filter(c => c.isActive !== false).map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            {/* Visualization Status Filter */}
            <Select
              dark={false}
              hidePlaceholder
              fullWidth={false}
              containerClassName="min-w-[140px]"
              className="h-12 pl-4! pr-10! text-[13px] font-semibold transition-all rounded-[14px]! bg-white! border-[#E4DED6]! text-[#171717]! shadow-none! backdrop-blur-none! hover:bg-[#FAF8F5]! hover:shadow-none! focus:bg-white! focus:border-[#C9A77A]! focus:ring-4! focus:ring-[#C9A77A]/15!"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "Status: All" },
                { value: "active", label: "Active" },
                { value: "low", label: "Low Stock" },
                { value: "draft", label: "Draft" },
              ]}
            />

            {/* Visualization Sort Filter */}
            <Select
              dark={false}
              hidePlaceholder
              fullWidth={false}
              containerClassName="min-w-[190px]"
              className="h-12 pl-4! pr-10! text-[13px] font-semibold transition-all rounded-[14px]! bg-white! border-[#E4DED6]! text-[#171717]! shadow-none! backdrop-blur-none! hover:bg-[#FAF8F5]! hover:shadow-none! focus:bg-white! focus:border-[#C9A77A]! focus:ring-4! focus:ring-[#C9A77A]/15!"
              value={sortFilter}
              onChange={(e) => {
                setSortFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "Sort: Recently Added" },
                { value: "price_asc", label: "Price (Low)" },
                { value: "price_desc", label: "Price (High)" },
              ]}
            />

            {/* Advanced Filter Action */}
            <button className="h-12 w-12 shrink-0 rounded-[14px] bg-white hover:bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#292929] hover:text-[#171717] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/50" title="Advanced Filters">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>

            {/* Clear Filters Action */}
            {(searchTerm || categoryFilter || statusFilter || sortFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("");
                  setStatusFilter("");
                  setSortFilter("");
                  setPage(1);
                }}
                title="Clear Filters"
                className="h-12 px-4 shrink-0 rounded-[14px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-semibold text-[13px] gap-1.5 animate-fade-in"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main List Container (Detached Rows) */}
      <div className="mb-8">
        {activeTab === "products" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-4 text-[12px] text-[#77736E] font-medium">
              <span><span className="font-bold text-[#171717]">{filtered.length}</span> of {products.length} products</span>
              <span className="inline-flex items-center gap-1.5 text-[#8A6D3F]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A77A]" />
                Low stock: 10 units or fewer
              </span>
            </div>

            <div className={`hidden md:grid ${PRODUCT_GRID} gap-4 px-5 py-3.5 mb-3 admin-table-header rounded-2xl text-[10px] font-bold text-[#5f5a53] uppercase tracking-[0.16em]`}>
              <div>Collection Essence</div>
              <div>Category</div>
              <div>Price</div>
              <div>Stock</div>
              <div>Status</div>
              <div className="hidden xl:block">Created</div>
              <div className="hidden xl:block">Updated</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="py-24 bg-white rounded-[24px] text-center flex flex-col items-center gap-4 border border-[#E4DED6]">
                  <Spinner size="lg" color="black" />
                  <p className="text-[11px] font-black text-[#77736E] uppercase tracking-[0.2em] animate-pulse">Syncing Inventory...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="py-24 bg-white rounded-[24px] text-center border border-[#E4DED6] group">
                  <span className="material-symbols-outlined text-[48px] text-[#C9BFAF] mb-4 group-hover:scale-110 transition-transform duration-500">inventory_2</span>
                  <p className="text-[14px] font-black text-[#5f5a53] uppercase tracking-widest">No pieces found in this collection</p>
                  <p className="text-[11px] text-[#9d978f] font-bold mt-2 uppercase tracking-tight">Adjust your search parameters</p>
                </div>
              ) : (
                paginated.data.map((product) => {
                  const isLowStock = product.stock > 0 && product.stock <= 10;
                  const isOutOfStock = product.stock === 0;
                  const stockPct = Math.max(0, Math.min(100, Math.round(((Number(product.stock) || 0) / maxStock) * 100)));
                  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';
                  const priceText = formatPrice(product.price);
                  const hasLkrPrefix = typeof priceText === 'string' && priceText.startsWith('LKR');
                  return (
                    <div key={product.id} onClick={() => { setViewProduct(product); setActiveDetailPhoto(product.imageUrl); }} className={`grid grid-cols-1 ${PRODUCT_GRID} gap-4 items-center py-4 px-5 admin-card rounded-[18px] cursor-pointer group`}>
                      {/* Product identity */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden flex items-center justify-center shrink-0">
                          {product.imageUrl ? (
                            <img src={getFinalImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[#a8a29a] text-[24px]">image</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-headline font-bold text-[16px] leading-snug text-[#171717]">{product.name}</h4>
                          <p className="text-[10px] font-semibold tracking-[0.06em] uppercase mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#F1ECE5] border border-[#E4DED6] rounded-md text-[#5f5a53] font-mono">{product.sku || 'NO SKU'}</span>
                            <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E4DED6] rounded-md text-[#8a857d] font-mono">{product.id.slice(-6).toUpperCase()}</span>
                          </p>
                          {/* Created / Updated (shown inline on narrower screens) */}
                          <p className="xl:hidden mt-1.5 text-[11px] text-[#8a857d] font-medium">
                            Created {fmtDate(product.createdAt)} · Updated {fmtDate(product.updatedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="flex justify-between items-center md:block">
                        <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Category</span>
                        <span className="inline-block px-3 py-1.5 bg-[#F1ECE5] text-[#292929] text-[11px] font-bold uppercase tracking-wider rounded-lg">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="font-headline font-bold text-[15px] text-[#171717] flex justify-between items-center md:block">
                        <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Price</span>
                        <span>
                          {hasLkrPrefix ? (
                            <>
                              <span className="text-[#8a857d] text-[12px] font-medium mr-1">LKR</span>
                              {priceText.replace(/^LKR\s*/, '')}
                            </>
                          ) : priceText}
                        </span>
                      </div>

                      {/* Stock */}
                      <div className="flex justify-between items-center md:block">
                        <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Stock</span>
                        <div className="md:max-w-[130px]">
                          <p className={`text-[14px] font-bold leading-none ${isOutOfStock ? 'text-red-600' : 'text-[#171717]'}`}>
                            {product.stock} <span className="font-semibold text-[#77736E]">units</span>
                          </p>
                          <div className="mt-2 h-1 w-24 rounded-full bg-[#E9E3DA] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-[#C9A77A]'}`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                          {isLowStock && (
                            <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-semibold leading-none">Low stock</span>
                          )}
                          {isOutOfStock && (
                            <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-[10.5px] font-semibold leading-none">Out of stock</span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex justify-between md:justify-start items-center">
                        <span className="md:hidden text-[#8a857d] text-[10px] uppercase tracking-widest font-bold">Status</span>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1ECE5] border border-[#E4DED6] text-[#5f5a53] text-[11px] font-bold uppercase tracking-wider rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />Draft
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-[11px] font-bold uppercase tracking-wider rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E4DED6] text-[#171717] text-[11px] font-bold uppercase tracking-wider rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                          </span>
                        )}
                      </div>

                      {/* Created */}
                      <div className="hidden xl:block text-[12px] text-[#77736E] font-medium">
                        {fmtDate(product.createdAt)}
                      </div>

                      {/* Updated */}
                      <div className="hidden xl:block text-[12px] text-[#77736E] font-medium">
                        {fmtDate(product.updatedAt)}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end items-center gap-1.5 relative mt-1 md:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm(product.name);
                            setActiveTab("restock");
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#E4DED6] transition-all text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/50"
                          title="Track Process"
                        >
                          <span className="material-symbols-outlined text-[18px]">analytics</span>
                        </button>
                        {canManageProducts && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); openRestockModal(product); }}
                              className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/50 ${isLowStock ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-[#292929] bg-white border-[#E4DED6] hover:bg-[#F1ECE5] hover:border-[#D6CDBF]'}`}
                              title="Restock Request"
                            >
                              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }} className="h-9 w-9 flex items-center justify-center text-[#292929] bg-white border border-[#E4DED6] transition-all hover:bg-[#F1ECE5] hover:border-[#D6CDBF] rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/50" title="Edit">
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openDeleteDialog(product); }} className="h-9 w-9 flex items-center justify-center text-[#292929] bg-white border border-[#E4DED6] transition-all hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-red-300" title="Delete">
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination
              dark={false}
              currentPage={page}
              totalPages={paginated.pages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        ) : (
          /* Restock & Return Process Tab View */
          <>
            <div className="hidden md:flex px-6 py-3.5 mb-3 mt-4 bg-[#F1ECE5] border border-[#E4DED6] rounded-2xl text-[10px] font-bold text-[#5f5a53] uppercase tracking-[0.16em]">
              <div className="w-[30%]">Product Information</div>
              <div className="w-[15%] text-left">Quantity</div>
              <div className="w-[20%] text-left">Requested By</div>
              <div className="w-[15%] text-left">Status</div>
              <div className="w-[20%] text-center px-4">Actions</div>
            </div>

            <div className="space-y-4">
              {restockLoading ? (
                <div className="py-24 bg-white rounded-[24px] text-center flex flex-col items-center gap-3 border border-[#E4DED6]">
                  <Spinner size="md" color="black" />
                  <p className="text-[11px] font-black text-[#77736E] uppercase tracking-widest">Loading Requests...</p>
                </div>
              ) : restockRequests.filter(r => activeTab === 'restock' ? !r.notes?.includes("||META||") : r.notes?.includes("||META||")).length === 0 ? (
                <div className="py-24 bg-white rounded-[24px] text-center text-[#77736E] font-medium border border-[#E4DED6]">
                  No active {activeTab === 'restock' ? 'restock' : 'return process'} requests found.
                </div>
              ) : (
                restockRequests
                  .filter(r => activeTab === 'restock' ? !r.notes?.includes("||META||") : r.notes?.includes("||META||"))
                  .map((request) => {
                    const meta = parseNotesMeta(request.notes);
                    const fulfillment = parseFulfillmentMeta(request.notes);
                    return (
                      <div key={request.id} className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center py-5 px-6 bg-white border border-[#E4DED6] rounded-[18px] transition-all duration-300 hover:border-[#D6CDBF] hover:shadow-[0_8px_24px_rgba(23,23,23,0.06)] gap-4 md:gap-0 animate-fade-in group">
                          <div className="w-full md:w-[30%] flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] overflow-hidden flex items-center justify-center shrink-0">
                              {request.product?.imageUrl ? (
                                <img src={getFinalImageUrl(request.product.imageUrl)} alt={request.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-[#a8a29a] text-[20px]">inventory_2</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-headline font-bold text-[15px] leading-snug text-[#171717]">{request.product?.name || "Deleted Product"}</h4>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] text-[#8a857d] font-bold tracking-widest uppercase truncate">SKU: {request.product?.sku || 'N/A'}</p>
                                {request.variantDetails && request.variantDetails.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(() => {
                                      const variantData = (request.variantDetails?.[0]?.attributes || request.variantDetails?.[0] || {});
                                      return Object.entries(variantData)
                                        .filter(([k, v]) => typeof v === 'string' || typeof v === 'number')
                                        .map(([k, v]) => (
                                          <span key={k} className="text-[9px] font-bold text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] rounded px-1.5 py-0.5 uppercase tracking-widest">
                                            {k}: {v}
                                          </span>
                                        ));
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-[15%]">
                            <p className="text-[15px] font-black text-[#171717]">{request.quantity} Units</p>
                            <p className="text-[10px] text-[#8a857d] font-bold uppercase tracking-widest">Target Stock</p>
                          </div>

                          <div className="w-full md:w-[20%]">
                            <p className="text-[12px] font-bold text-[#171717]">{activeTab === 'return_process' && meta ? meta.customerName : (request.user?.name || "System")}</p>
                            <p className="text-[10px] text-[#8a857d] font-black uppercase tracking-widest leading-none mt-1">{activeTab === 'return_process' && meta ? "Customer" : (request.user?.role?.name || "Service")}</p>
                          </div>

                          <div className="w-full md:w-[15%]">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${request.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                request.status === 'Approved' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                                  request.status === 'Processing' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                    request.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      request.status === 'Closed' ? 'bg-[#F1ECE5] text-[#5f5a53] border-[#E4DED6]' :
                                        'bg-red-50 text-red-700 border-red-200'
                              }`}>
                              {request.status}
                            </span>
                          </div>

                            <div className="flex flex-col items-end gap-2">
                              {request.status === 'Pending' && (isAdmin || userRole === 'supplier manager' || (activeTab === 'return_process' && userRole === 'product manager')) ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRestockAction(request.id, 'approve')}
                                    disabled={updatingStatus === request.id}
                                    className="px-4 py-1.5 bg-[#171717] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all disabled:opacity-50 active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRestockAction(request.id, 'Rejected')}
                                    disabled={updatingStatus === request.id}
                                    className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 active:scale-95"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : request.status === 'Approved' && activeTab === 'return_process' && (isAdmin || userRole === 'product manager') ? (
                                <button
                                  onClick={() => {
                                    setSelectedRequestForSend(request);
                                    setIsSendProductModalOpen(true);
                                  }}
                                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                                >
                                  <span className="material-symbols-outlined text-[14px]">send</span>
                                  Send Product
                                </button>
                              ) : request.status === 'Approved' && activeTab === 'restock' && (isAdmin || userRole === 'supplier manager') ? (
                                <button
                                  onClick={() => handleRestockAction(request.id, 'process')}
                                  disabled={updatingStatus === request.id}
                                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                                >
                                  <span>Start Processing</span>
                                  <span className="material-symbols-outlined text-[14px]">forklift</span>
                                </button>
                              ) : request.status === 'Processing' && (isAdmin || userRole === 'supplier manager') ? (
                                <button
                                  onClick={() => handleRestockAction(request.id, 'complete')}
                                  disabled={updatingStatus === request.id}
                                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                                >
                                  <span>Mark Completed</span>
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                </button>
                              ) : request.status === 'Completed' && (isAdmin || userRole === 'product manager') ? (
                                <button
                                  onClick={() => handleRestockAction(request.id, 'add-to-stock')}
                                  disabled={updatingStatus === request.id}
                                  className="px-4 py-1.5 bg-[#171717] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#292929] transition-all flex items-center gap-2"
                                >
                                  <span>Add to Stock</span>
                          <span className="material-symbols-outlined text-[14px]">add_box</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-black text-[#8a857d] uppercase tracking-widest">
                                  {request.status === 'Closed' ? 'Completed' : 'In Progress'}
                                </span>
                              )}

                              {(meta || fulfillment || request.notes) && (
                                <button
                                  onClick={() => toggleRequestExpansion(request.id)}
                                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 hover:underline uppercase tracking-widest transition-all flex items-center gap-1 mt-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {expandedRequestIds[request.id] ? 'expand_less' : 'expand_more'}
                                  </span>
                                  {expandedRequestIds[request.id] ? 'Hide' : 'More'} Details
                                </button>
                              )}
                            </div>
                          </div>

                        {(meta || fulfillment || request.notes) && expandedRequestIds[request.id] && (
                          <div className="mx-2 sm:mx-6 p-6 bg-[#FAF8F5] rounded-[24px] border border-[#E4DED6] flex flex-col md:flex-row gap-6 animate-fade-in shadow-sm mt-3 mb-6 relative overflow-hidden">
                            {!meta && !fulfillment && request.notes && (
                              <div className="flex-1 space-y-2.5">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#77736E] ml-1">Sourcing Notes & Rationale</p>
                                <div className="bg-white p-5 rounded-[20px] border border-[#E4DED6] shadow-2xs">
                                  <p className="text-[13px] text-[#292929] font-medium leading-relaxed italic">
                                    "{request.notes.split('||META||')[0].split('||FULFILLMENT||')[0]}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {meta && (
                              <div className="flex-[1.4] space-y-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-3 ml-1">
                                    <div className="w-6 h-6 rounded-lg bg-white border border-[#E4DED6] flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[14px] text-[#9A7B4A]">person_search</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#77736E]">Customer Context</p>
                                  </div>

                                  <div className="bg-white p-5 rounded-[20px] border border-[#E4DED6] shadow-2xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-[0.18em] mb-1">Full Name</p>
                                        <p className="text-[14px] font-bold text-[#171717] leading-tight truncate">{meta.customerName}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-[0.18em] mb-1">Direct Email</p>
                                        <p className="text-[12px] font-semibold text-[#5f5a53] truncate lowercase tracking-wide">{meta.customerEmail}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-[0.18em] mb-1">Mobile Contact</p>
                                        <p className="text-[13px] font-mono font-bold text-[#171717]">{meta.customerPhone}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-[0.18em] mb-1">Shipping Address</p>
                                        <p className="text-[12px] font-medium text-[#5f5a53] line-clamp-2 leading-relaxed">
                                          {meta.customerAddress || 'Direct Pickup/N/A'}
                                        </p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-[0.18em] mb-1">Delivery Method</p>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                          <p className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">{meta.deliveryMethod || 'Standard'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-[#F4EFE8] p-4 rounded-[18px] border border-[#E4DED6]">
                                  <p className="text-[9px] font-black text-[#8A6D3F] uppercase tracking-[0.18em] mb-1.5">Return Rationale</p>
                                  <p className="text-[13px] text-[#171717] font-medium italic leading-relaxed">
                                    "{meta.reason}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {meta?.returnImage && (
                              <div className="flex-none w-[130px] self-start">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#77736E] mb-3 ml-1">Asset Verification</p>
                                <div className="bg-white p-1.5 rounded-[20px] border border-[#E4DED6] shadow-2xs group/img hover:border-[#C9A77A] transition-all">
                                  <a href={getFinalImageUrl(meta.returnImage)} target="_blank" rel="noreferrer" className="block relative overflow-hidden rounded-[16px]">
                                    <img
                                      src={getFinalImageUrl(meta.returnImage)}
                                      alt="Proof"
                                      className="w-full h-[90px] object-cover group-hover/img:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-[#171717]/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                      <span className="material-symbols-outlined text-white text-[18px]">fullscreen</span>
                                    </div>
                                  </a>
                                </div>
                              </div>
                            )}

                            {fulfillment && (
                              <div className="flex-1 bg-white rounded-[22px] p-6 border border-[#E4DED6] shadow-2xs flex flex-col justify-center relative">
                                <div className="absolute top-4 right-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Active Fulfilment</span>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-7 h-7 rounded-lg bg-[#F4EFE8] border border-[#E4DED6] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[15px] text-[#9A7B4A]">local_shipping</span>
                                  </div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#77736E]">Replacement Dispatched</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-20 rounded-[18px] bg-[#FAF8F5] border border-[#E4DED6] overflow-hidden shrink-0 group/sub-img">
                                    <img src={getFinalImageUrl(fulfillment.imageUrl)} className="w-full h-full object-cover group-hover/sub-img:scale-110 transition-transform duration-500" alt="" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-[15px] font-headline font-bold text-[#171717] truncate leading-tight mb-1">{fulfillment.name}</h5>
                                    <p className="text-[10px] text-[#77736E] font-mono font-bold uppercase tracking-wider">SKU: {fulfillment.sku}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                      {Object.entries(fulfillment.variantAttributes || {}).map(([k, v]) => (
                                        <span key={k} className="px-2.5 py-1 bg-[#FAF8F5] text-[#5f5a53] rounded-[8px] text-[9px] font-bold uppercase tracking-wider border border-[#E4DED6]">
                                          {k}: {v}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={!!modalMode}
        onClose={handleCloseAttempt}
        size="6xl"
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#77736E] uppercase tracking-widest mb-1.5">
              <span>Products</span>
              <span className="material-symbols-outlined text-[12px] mt-0.5">chevron_right</span>
              <span className="text-[#171717]">{modalMode === "create" ? "Add New Product" : "Edit Item"}</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-headline font-black tracking-tight text-[#171717] leading-none">
              {modalMode === "create" ? "New Product Item" : "Refine Collection Item"}
            </h2>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-[#F1ECE5] rounded-xl border border-[#E4DED6] cursor-pointer transition-all group/status"
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[16px] transition-colors ${isActive ? 'text-emerald-600' : 'text-[#8a857d]'}`}>public</span>
                <span className="text-[11px] font-black text-[#171717] uppercase tracking-widest hidden sm:block">Public</span>
              </div>
              <button
                type="button"
                aria-label="Toggle public visibility"
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${isActive ? 'bg-[#171717]' : 'bg-[#D6CDBF]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-2xs transition-all duration-200 ${isActive ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCloseAttempt}
                type="button"
                className="px-5 py-2.5 rounded-[14px] bg-white hover:bg-[#F1ECE5] border border-[#E4DED6] text-[#5f5a53] hover:text-[#171717] font-bold font-headline text-[12.5px] tracking-tight transition-all active:scale-95"
              >
                Discard
              </button>
              <button
                onClick={handlePublishRequest}
                type="button"
                disabled={saving}
                className="px-6 sm:px-7 py-2.5 rounded-[14px] bg-[#171717] hover:bg-[#292929] text-white font-bold font-headline text-[12.5px] tracking-tight shadow-[0_6px_16px_rgba(23,23,23,0.16)] transition-all flex items-center gap-2 group active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{modalMode === "create" ? "Publish Product" : "Commit Changes"}</span>
                    <span className="material-symbols-outlined text-[17px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <form id="product-architect-form" onSubmit={handleSubmit(onSubmit)} className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* Left Column: Information & Variants */}
            <div className="lg:col-span-8 space-y-6">

              {/* Essential Information Section */}
              <SectionCard title="Essential Information" icon="info">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1">Product Name</label>
                      <input
                        placeholder="e.g. Minimalist Cashmere Overcoat"
                        {...register("name", productRules.name)}
                        className={`w-full bg-white text-[#171717] border ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 outline-none transition-all placeholder:text-[#9d978f] placeholder:font-medium h-[52px]`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductName(val);
                          if (modalMode === 'create' && (!sku || sku.startsWith('RA-'))) {
                            setSku(generateSKU(val));
                          }
                        }}
                      />
                      {errors.name && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest ml-1">SKU Identification</label>
                        <button
                          type="button"
                          onClick={() => setSku(generateSKU(productName))}
                          className="text-[10px] font-black text-[#8A6D3F] hover:text-[#171717] hover:underline uppercase tracking-widest transition-all"
                        >
                          Regenerate
                        </button>
                      </div>
                      <input
                        placeholder="e.g. RA-MCO-1234"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        className="w-full bg-white text-[#171717] border border-[#E4DED6] rounded-[14px] px-4 py-3.5 text-[14px] font-mono font-bold tracking-wider focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all placeholder:text-[#9d978f] h-[52px]"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest ml-1">Description</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingDesc || !productName}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#8A6D3F] hover:text-[#171717] disabled:opacity-40 transition-colors uppercase tracking-wider"
                      >
                        {generatingDesc ? 'Neural Processing...' : '✨ Generate with AI'}
                      </button>
                    </div>
                    <textarea
                      placeholder="Describe the silhouette, materials, and artisan techniques used..."
                      {...register("description", productRules.description)}
                      rows={4}
                      className={`w-full bg-white text-[#171717] border ${errors.description ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 outline-none transition-all placeholder:text-[#9d978f] resize-none`}
                    />
                    {errors.description && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Actual Cost (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[14px]">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("costPrice", productRules.costPrice)}
                          className={`w-full bg-white text-[#171717] border ${errors.costPrice ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-bold focus:ring-4 outline-none transition-all h-[52px]`}
                        />
                      </div>
                      {errors.costPrice && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.costPrice.message}</p>}
                      {watch("price") && watch("costPrice") && (
                        <p className="text-[11px] font-semibold text-[#77736E] mt-1.5 ml-1 text-left">
                          Est. Profit: <span className="font-bold text-[#171717]">Rs. {(Number(watch("price")) - Number(watch("costPrice"))).toLocaleString()}</span>
                        </p>
                      )}
                    </div>

                    <div className="relative group/price">
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest text-left">Retail Price (LKR)</label>
                        {watch("price") && watch("costPrice") && (
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${Number(watch("price")) - Number(watch("costPrice")) > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {Math.round(((Number(watch("price")) - Number(watch("costPrice"))) / Number(watch("price"))) * 100)}% Margin
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] font-bold text-[14px]">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("price", productRules.price)}
                          className={`w-full bg-white text-[#171717] border ${errors.price ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-black focus:ring-4 outline-none transition-all h-[52px]`}
                        />
                      </div>
                      {errors.price && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.price.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Collection Category</label>
                      <div className="relative">
                        <select
                          {...register("categoryId", {
                            ...productRules.categoryId,
                            onChange: (e) => {
                              const catId = e.target.value;
                              const category = categories.find(c => c.id === catId);
                              if (category?.variantConfig && variants.length === 0) {
                                const config = typeof category.variantConfig === 'string'
                                  ? JSON.parse(category.variantConfig)
                                  : category.variantConfig;

                                if (Array.isArray(config)) {
                                  // Auto-scaffold first variant based on config
                                  const initialAttributes = {};
                                  config.forEach(cfg => {
                                    initialAttributes[cfg.name] = cfg.options?.[0] || "";
                                  });
                                  setVariants([{ attributes: initialAttributes, stock: 0, priceAdj: 0 }]);
                                }
                              }
                            }
                          })}
                          className={`w-full bg-white text-[#171717] border ${errors.categoryId ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 outline-none transition-all h-[52px] appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-white text-[#77736E]">Select Collection</option>
                          {categories.filter(c => c.isActive !== false).map((c) => (
                            <option key={c.id} value={c.id} className="bg-white text-[#171717]">{c.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">unfold_more</span>
                      </div>
                      {errors.categoryId && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1">{errors.categoryId.message}</p>}
                    </div>

                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 text-left">Supplier Source</label>
                      <div className="relative text-left">
                        <select
                          {...register("supplierId", productRules.supplierId)}
                          className={`w-full bg-white text-[#171717] border ${errors.supplierId ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 outline-none transition-all h-[52px] appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-white text-[#77736E]">Select Supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id} className="bg-white text-[#171717]">{s.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none">factory</span>
                      </div>
                      {errors.supplierId && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.supplierId.message}</p>}
                    </div>

                    {/* Conditional Stock Input for Simple Items */}
                    {(() => {
                      const catId = watch("categoryId");
                      const category = categories.find(c => c.id === catId);
                      const variantConfig = category?.variantConfig ? (typeof category.variantConfig === 'string' ? JSON.parse(category.variantConfig) : category.variantConfig) : null;

                      if (variantConfig && Array.isArray(variantConfig) && variantConfig.length > 0) return null;

                      return (
                        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1">Total Available Stock</label>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            {...register("stock", { ...productRules.stock, min: { value: 0, message: "Stock cannot be negative" } })}
                            className={`w-full bg-white text-[#171717] border ${errors.stock ? 'border-red-400 focus:ring-red-100' : 'border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15'} rounded-[14px] px-4 py-3.5 text-[14px] font-black focus:ring-4 outline-none transition-all h-[52px]`}
                          />
                          {errors.stock && <p className="text-red-600 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.stock.message}</p>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </SectionCard>

              {/* Product Variants Section - Autonomous Discovery */}
              {(() => {
                const catId = watch("categoryId");
                const category = categories.find(c => c.id === catId);
                const variantConfig = category?.variantConfig ? (typeof category.variantConfig === 'string' ? JSON.parse(category.variantConfig) : category.variantConfig) : null;

                if (!variantConfig || !Array.isArray(variantConfig) || variantConfig.length === 0) return null;

                return (
                  <SectionCard
                    title="Product Variants"
                    icon="inventory_2"
                    className="overflow-visible animate-in zoom-in-95 duration-300"
                    action={
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-1.5 text-[10px] font-black text-[#171717] uppercase tracking-widest bg-white hover:bg-[#F1ECE5] border border-[#E4DED6] px-4 py-2 rounded-[10px] transition-all shadow-2xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Option
                      </button>
                    }
                  >
                    <div className="bg-white rounded-2xl border border-[#E4DED6] shadow-2xs overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-[#FAF8F5]">
                            {variantConfig.map(cfg => (
                              <th key={cfg.name} className="py-3 text-[10px] font-black text-[#5f5a53] uppercase tracking-widest px-4 border-b border-[#E4DED6]">
                                {cfg.name}
                              </th>
                            ))}
                            <th className="py-3 text-[10px] font-black text-[#5f5a53] uppercase tracking-widest px-4 border-b border-[#E4DED6]">Stock Level</th>
                            <th className="py-3 w-12 border-b border-[#E4DED6]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFEAE2]">
                          {variants.length === 0 ? (
                            <tr>
                              <td colSpan={variantConfig.length + 2} className="py-10 text-center text-[#77736E] text-[12px] font-medium italic">
                                No variants configured. Click "Add Option" to begin.
                              </td>
                            </tr>
                          ) : (
                            variants.map((v, i) => (
                              <tr key={i} className="group/row hover:bg-[#FAF8F5]/60 transition-colors">
                                {variantConfig.map(cfg => (
                                  <td key={cfg.name} className="py-3.5 px-3">
                                    {isColorAttribute(cfg.name) ? (
                                      <ColorAtelier
                                        value={v.attributes?.[cfg.name] || []}
                                        onChange={(val) => updateVariant(i, cfg.name, val)}
                                        options={cfg.options || []}
                                        synapticPalette={synapticPalette}
                                        syncNewTone={syncNewTone}
                                        resolveColorName={resolveColorName}
                                      />
                                    ) : (
                                      <select
                                        value={v.attributes?.[cfg.name] || ""}
                                        onChange={(e) => updateVariant(i, cfg.name, e.target.value)}
                                        className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] border border-[#E4DED6] rounded-[10px] px-3 py-2 text-[13px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] transition-all outline-none cursor-pointer h-[42px]"
                                      >
                                        <option value="" className="bg-white text-[#77736E]">Select {cfg.name}</option>
                                        {cfg.options?.map(opt => (
                                          <option key={opt} value={opt} className="bg-white text-[#171717]">{opt}</option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                ))}
                                <td className="py-3.5 px-3">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                                    className="w-24 bg-[#FAF8F5] focus:bg-white text-[#171717] border border-[#E4DED6] rounded-[10px] px-3 py-2 text-[13px] font-black focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] transition-all outline-none h-[42px]"
                                  />
                                </td>
                                <td className="py-3.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeVariant(i)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a857d] hover:text-red-600 hover:bg-red-50 transition-all opacity-70 group-hover/row:opacity-100"
                                    title="Remove variant"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {variants.length > 0 && (
                          <tfoot className="border-t border-[#E4DED6]">
                            <tr className="bg-[#FAF8F5]">
                              <td colSpan={variantConfig.length} className="py-3.5 px-4 text-right">
                                <span className="text-[10px] font-black text-[#77736E] uppercase tracking-[0.18em]">Total Products Count</span>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="w-24 h-[38px] flex items-center justify-center bg-[#171717] text-white rounded-[10px] text-[13px] font-black shadow-2xs">
                                  {watch("stock") || 0}
                                </div>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </SectionCard>
                );
              })()}
            </div>

            {/* Right Column: Imagery & Status */}
            <div className="lg:col-span-4 space-y-6">
              <ProductImageGallery
                images={images}
                maxImages={5}
                onFilesSelected={handleImageChange}
                onSetMainImage={setMainImage}
                onRemoveImage={removeImage}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
        isDanger={true}
        confirmText="Delete Product"
      />

      {/* Publish Confirm Dialog */}
      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={() => {
          setShowPublishConfirm(false);
          handleSubmit(onSubmit)();
        }}
        title={modalMode === "create" ? "Confirm Publication" : "Confirm Updates"}
        message={modalMode === "create"
          ? "Are you sure you want to publish this product to the storefront?"
          : "Are you sure you want to commit these changes to the collection?"}
        loading={saving}
        isDanger={false}
        confirmText="Confirm"
        confirmVariant="dark"
      />

      {/* Collection Discard Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={closeModal}
        title="Unsaved Changes"
        message="You have unsaved changes in your workspace. Are you sure you want to discard them? This action cannot be undone."
        isDanger={true}
        confirmText="Discard"
      />

      {/* Variant Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={variantToDelete !== null}
        onClose={() => setVariantToDelete(null)}
        onConfirm={confirmRemoveVariant}
        title="Remove Variant"
        message="Are you sure you want to remove this variant from the collection? This will clear its specific stock and pricing."
        isDanger={true}
        confirmText="Remove Variant"
      />

      {/* Image Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={confirmRemoveImage}
        title="Delete Image"
        message="Are you sure you want to remove this image from the product gallery?"
        confirmVariant="dark"
        confirmText="Remove Image"
      />

      {/* Restock Request Modal */}
      <Modal
        isOpen={!!restockModalProduct}
        onClose={closeRestockModal}
        size={restockModalProduct?.variants?.length > 0 ? "lg" : "md"}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#77736E] uppercase tracking-widest mb-1.5">
              <span>Inventory</span>
              <span className="material-symbols-outlined text-[12px] mt-0.5">chevron_right</span>
              <span className="text-[#171717]">Restock Protocol</span>
            </div>
            <h2 className="text-[20px] font-headline font-black tracking-tight text-[#171717] leading-none">
              {restockModalProduct?.name}
            </h2>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={closeRestockModal}
              type="button"
              className="px-5 py-2 rounded-[12px] bg-white hover:bg-[#F1ECE5] border border-[#E4DED6] text-[#5f5a53] hover:text-[#171717] font-bold font-headline text-[12px] tracking-tight transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleRestockSubmit}
              type="button"
              disabled={restockLoading}
              className="px-6 py-2 rounded-[12px] bg-[#171717] hover:bg-[#292929] text-white font-bold font-headline text-[12px] tracking-tight shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {restockLoading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Submit Request</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="py-1 space-y-6">
          {/* Product Identity Card */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E4DED6] flex items-center justify-between group overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-white border border-[#E4DED6] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {restockModalProduct?.imageUrl ? (
                  <img
                    src={getFinalImageUrl(restockModalProduct.imageUrl)}
                    alt={restockModalProduct.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon size={24} className="text-[#8a857d]" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-0.5">Reference SKU</p>
                <p className="text-[14px] font-mono font-bold text-[#171717] uppercase">{restockModalProduct?.sku || 'N/A'}</p>
              </div>
            </div>

            <div className="text-right relative z-10">
              <p className="text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-0.5">Current Inventory</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`w-2 h-2 rounded-full ${restockModalProduct?.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <p className={`text-[18px] font-black font-headline ${restockModalProduct?.stock < 10 ? 'text-red-600' : 'text-[#171717]'}`}>
                  {restockModalProduct?.stock} Units
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Conditional Variant Table or Single Input */}
            {restockModalProduct?.variants && restockModalProduct.variants.length > 0 ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <label className="text-[10px] font-black text-[#77736E] uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#9A7B4A]">tune</span>
                    Variant Breakdown
                  </label>
                  <span className="text-[10px] font-black text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] px-2.5 py-1 rounded-full uppercase tracking-tighter">
                    {restockModalProduct.variants.length} Configs
                  </span>
                </div>

                <div className="border border-[#E4DED6] rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#FAF8F5]">
                        <th className="text-left py-3 px-4 text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest border-b border-[#E4DED6]">Configuration</th>
                        <th className="text-right py-3 px-4 text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest border-b border-[#E4DED6]">On Hand</th>
                        <th className="text-right py-3 px-4 text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest border-b border-[#E4DED6]">Request Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEAE2]">
                      {restockModalProduct.variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {v.attributes ? (
                                Object.entries(v.attributes).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 bg-[#F1ECE5] border border-[#E4DED6] text-[#171717] text-[10px] font-bold rounded-md uppercase tracking-tight flex items-center gap-1">
                                    <span className="text-[#77736E] font-medium lowercase italic">{key}:</span>
                                    <span>{typeof value === 'object' ? Object.values(value).filter(val => typeof val !== 'object').join(' / ') : String(value)}</span>
                                  </span>
                                ))
                              ) : (
                                Object.entries(v).map(([key, value]) => {
                                  if (['stock', 'priceAdj', 'price', 'quantity', 'attributes'].includes(key)) return null;
                                  return (
                                    <span key={key} className="px-2 py-0.5 bg-[#F1ECE5] border border-[#E4DED6] text-[#171717] text-[10px] font-bold rounded-md uppercase tracking-tight flex items-center gap-1">
                                      <span className="text-[#77736E] font-medium lowercase italic">{key}:</span>
                                      <span>{typeof value === 'object' ? Object.values(value).filter(val => typeof val !== 'object').join(' / ') : String(value)}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[12px] font-bold ${v.stock < 5 ? 'text-red-600' : 'text-[#5f5a53]'}`}>
                              {v.stock || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              value={variantQuantities[idx] || ""}
                              onChange={(e) => setVariantQuantities({
                                ...variantQuantities,
                                [idx]: Math.max(0, parseInt(e.target.value) || 0)
                              })}
                              className="w-20 bg-[#FAF8F5] focus:bg-white border border-[#E4DED6] focus:border-[#C9A77A] text-[#171717] rounded-lg px-2 py-1 text-[13px] font-bold text-right outline-none transition-all"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#171717] text-white">
                        <td colSpan={2} className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">Total Request Yield</td>
                        <td className="py-3 px-4 text-right font-headline font-black text-[16px]">
                          {Object.values(variantQuantities).reduce((a, b) => a + (b || 0), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1">Restock Quantity</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] group-focus-within:text-[#171717] transition-colors">inventory</span>
                  <input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                    className="w-full bg-white text-[#171717] border border-[#E4DED6] rounded-[14px] pl-12 pr-4 py-3 text-[14px] font-bold focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all h-[52px]"
                    placeholder="Enter quantity to request..."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-[#77736E] uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-[#9A7B4A]">notes</span>
                Collaborative Notes (Optional)
              </label>
              <textarea
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
                rows={3}
                className="w-full bg-white text-[#171717] border border-[#E4DED6] rounded-[14px] px-4 py-3 text-[14px] font-medium focus:ring-4 focus:ring-[#C9A77A]/15 focus:border-[#C9A77A] outline-none transition-all placeholder:text-[#9d978f] resize-none min-h-[100px]"
                placeholder="Mention specific requirements for the supplier..."
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Product Details Viewer */}
      <ModalPortal
        isOpen={!!viewProduct}
        onClose={closeViewModal}
        backdropClassName="bg-[#171717]/45 backdrop-blur-sm transition-all duration-500"
        containerClassName="p-4 md:p-8"
      >
        {viewProduct && (
          <div className="bg-white text-[#171717] w-full max-w-6xl h-full max-h-[85vh] rounded-[32px] border border-[#E4DED6] shadow-[0_40px_100px_rgba(23,23,23,0.22)] overflow-hidden flex flex-col md:flex-row relative animate-scale-up">
            {/* Close Button Pin */}
            <button
              onClick={closeViewModal}
              aria-label="Close product details"
              className="absolute top-6 right-6 z-[10] w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#F1ECE5] text-[#5f5a53] hover:text-[#171717] flex items-center justify-center transition-all active:scale-95 border border-[#E4DED6]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Left Column: Visuals (55%) */}
            <div className="w-full md:w-[55%] h-full bg-[#F4EFE8] border-b md:border-b-0 md:border-r border-[#E4DED6] flex flex-col relative group">
              <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
                {activeDetailPhoto ? (
                  <img
                    src={getFinalImageUrl(activeDetailPhoto)}
                    alt={viewProduct.name}
                    className="w-full h-full object-contain rounded-2xl transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-[#8a857d]">
                    <span className="material-symbols-outlined text-[64px]">image_not_supported</span>
                    <p className="text-[11px] font-black uppercase tracking-widest">No Visuals Available</p>
                  </div>
                )}
              </div>

              {/* Internal Gallery */}
              <div className="p-6 pt-0 flex justify-center">
                <div className="bg-white/95 backdrop-blur-md border border-[#E4DED6] p-2 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar max-w-full shadow-sm">
                  {[viewProduct.imageUrl, ...(viewProduct.images || [])]
                    .filter(Boolean)
                    .filter((url, index, self) => self.indexOf(url) === index)
                    .map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveDetailPhoto(url)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeDetailPhoto === url ? 'border-[#171717] scale-105 shadow-sm' : 'border-transparent opacity-55 hover:opacity-100'}`}
                      >
                        <img src={getFinalImageUrl(url)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: Information (45%) */}
            <div className="w-full md:w-[45%] h-full bg-white p-8 md:p-10 overflow-y-auto custom-scrollbar flex flex-col">
              {/* Header Info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  {viewProduct.stock === 0 ? (
                    <span className="px-3 py-1 bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-200">Draft / Out of Stock</span>
                  ) : viewProduct.stock <= 5 ? (
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200">Low Stock Alert</span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-200">Inventory Active</span>
                  )}
                </div>

                <h2 className="text-[28px] md:text-[34px] font-headline font-black text-[#171717] leading-tight mb-2.5 tracking-tight">{viewProduct.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-[#5f5a53]">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E4DED6] text-[#171717]">SKU: {viewProduct.sku}</span>
                  <div className="w-1 h-1 rounded-full bg-[#D6CDBF]" />
                  <span className="text-[12px] font-semibold text-[#5f5a53]">{categories.find(c => c.id === viewProduct.categoryId)?.name || 'General Category'}</span>
                </div>
              </div>

              {/* Finance Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#FAF8F5] border border-[#E4DED6] p-5 rounded-[22px]">
                  <p className="text-[10px] font-black text-[#77736E] uppercase tracking-[0.18em] mb-1.5">Retail Price</p>
                  <span className="text-[22px] font-headline font-black text-[#171717]">{formatPrice(viewProduct.price)}</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E4DED6] p-5 rounded-[22px]">
                  <p className="text-[10px] font-black text-[#77736E] uppercase tracking-[0.18em] mb-1.5">Profit Margin</p>
                  <div className="flex items-baseline gap-1.5">
                    {(() => {
                      const margin = viewProduct.price > 0 ? Math.round(((viewProduct.price - viewProduct.costPrice) / viewProduct.price) * 100) : 0;
                      return (
                        <span className={`text-[22px] font-headline font-black ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {margin}%
                        </span>
                      );
                    })()}
                    <span className="text-[11px] text-[#77736E] font-bold tracking-widest uppercase">Net</span>
                  </div>
                </div>
              </div>

              {/* Variant Specs */}
              <div className="mb-8 flex-1">
                <div className="flex items-center justify-between mb-4 border-b border-[#EFEAE2] pb-3">
                  <h3 className="text-[12px] font-black text-[#171717] uppercase tracking-[0.18em]">Variant Inventory</h3>
                  <span className="text-[10px] font-bold text-[#77736E] bg-[#FAF8F5] border border-[#E4DED6] px-2.5 py-0.5 rounded-full">{viewProduct.variants?.length || 0} Selections</span>
                </div>

                <div className="space-y-2.5">
                  {viewProduct.variants && viewProduct.variants.length > 0 ? (
                    viewProduct.variants.map((v, idx) => {
                      const resolveHexColorName = (val) => {
                        if (!val) return val;
                        if (Array.isArray(val)) return val.map(item => resolveHexColorName(item)).filter(item => item && !String(item).startsWith('#')).join(', ');
                        if (typeof val !== 'string' || !val.startsWith('#')) return val;
                        const found = synapticPalette.find(p => p.hex.toLowerCase() === val.toLowerCase());
                        return found ? found.name : val;
                      };

                      const attrDisplay = v.attributes
                        ? Object.entries(v.attributes)
                          .map(([, value]) => resolveHexColorName(value))
                          .filter(val => val && (typeof val !== 'string' || !val.startsWith('#')))
                          .filter(Boolean)
                          .join(' / ')
                        : `${v.size || ''} / ${v.color || ''}`.replace(/^ \/ | \/ $/, '');

                      const colorAttrValues = Object.entries(v.attributes || {})
                        .filter(([key]) => isColorAttribute(key))
                        .flatMap(([, val]) => (Array.isArray(val) ? val : [val]))
                        .filter((val) => typeof val === "string" && val.trim().length > 0);
                      const fallbackExplicitColors = Object.values(v.attributes || {})
                        .flat()
                        .filter((val) => typeof val === "string" && isExplicitColorCode(val));
                      const swatchColors = [...colorAttrValues, ...fallbackExplicitColors];
                      if (v.colorCode) swatchColors.unshift(v.colorCode);

                      const uniqueSwatches = Array.from(
                        new Map(
                          swatchColors.map((c) => [getDisplayColor(c).toLowerCase(), c])
                        ).values()
                      );

                      return (
                        <div key={idx} className="flex items-center justify-between bg-[#FAF8F5] border border-[#E4DED6] p-4 rounded-[18px] hover:border-[#C9A77A] transition-all">
                          <div className="flex items-center gap-3.5">
                            <div className="flex -space-x-1">
                              {uniqueSwatches.length > 0 ? (
                                uniqueSwatches.map((color, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white ring-1 ring-[#D6CDBF]"
                                    style={{ backgroundColor: getDisplayColor(color), zIndex: uniqueSwatches.length - cIdx }}
                                    title={color}
                                  />
                                ))
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#EFEAE2] border border-[#D6CDBF]" />
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-[#171717] uppercase tracking-wider">
                                {attrDisplay || 'Standard Variant'}
                              </p>
                              <p className="text-[10px] text-[#77736E] font-semibold">QTY: {v.stock} UNITS</p>
                            </div>
                          </div>
                          <p className="text-[13px] font-black text-[#171717]">
                            {v.priceAdj > 0 ? `+${formatPrice(v.priceAdj)}` : formatPrice(viewProduct.price + (v.priceAdj || 0))}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-[#FAF8F5] rounded-[18px] p-6 text-center border border-dashed border-[#D6CDBF]">
                      <p className="text-[#77736E] text-[11px] font-bold uppercase tracking-widest">No Variants Configured</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-[10px] font-black text-[#77736E] uppercase tracking-[0.18em] mb-3">Description</h3>
                <p className="text-[#3d3a36] text-[14px] leading-relaxed font-medium">
                  {viewProduct.description || 'No description provided for this collection item.'}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-6 border-t border-[#EFEAE2] flex items-center justify-between mt-auto gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-black text-[#8a857d] uppercase tracking-widest">Acquisition</p>
                  <p className="text-[12px] text-[#171717] font-bold truncate">{suppliers.find(s => s.id === viewProduct.supplierId)?.name || 'Direct Procurement'}</p>
                </div>
                <div className="flex gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      navigate(`/admin/products/${viewProduct.id}/print`);
                    }}
                    className="h-11 px-5 rounded-2xl bg-[#171717] hover:bg-[#292929] flex items-center justify-center gap-2 transition-all text-white shadow-sm active:scale-95"
                    title="Print Barcode Tags"
                  >
                    <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Print Tags</span>
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal();
                      openEditModal(viewProduct);
                    }}
                    className="w-11 h-11 rounded-2xl bg-white hover:bg-[#F1ECE5] flex items-center justify-center transition-all border border-[#E4DED6] text-[#171717]"
                    title="Edit Product"
                  >
                    <span className="material-symbols-outlined text-[19px]">edit</span>
                  </button>
                  <button
                    onClick={() => { closeViewModal(); setDeleteTarget(viewProduct); }}
                    className="w-11 h-11 rounded-2xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all border border-red-200 text-red-600"
                    title="Delete Product"
                  >
                    <span className="material-symbols-outlined text-[19px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Send Replacement Product Modal */}
      <Modal
        isOpen={isSendProductModalOpen}
        onClose={() => {
          setIsSendProductModalOpen(false);
          setSelectedProductForVariant(null);
        }}
        title={selectedProductForVariant ? `Select Variant: ${selectedProductForVariant.name}` : "Select Replacement Product"}
        size="2xl"
      >
        <div className="space-y-4">
          {parseNotesMeta(selectedRequestForSend?.notes)?.originalItemPrice && (
            <div className="p-4 bg-[#F4EFE8] border border-[#C9A77A]/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#171717]">
                <span className="material-symbols-outlined text-[20px] text-[#9A7B4A]">account_balance_wallet</span>
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">Available Exchange Credit</p>
              </div>
              <p className="text-[16px] font-black text-[#171717]">
                {parseNotesMeta(selectedRequestForSend.notes).originalItemPrice} LKR
              </p>
            </div>
          )}

          <div className="space-y-5">
            {!selectedProductForVariant ? (
              <>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#77736E] text-[20px] group-focus-within:text-[#171717] transition-colors">search</span>
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full bg-[#FAF8F5] focus:bg-white text-[#171717] placeholder:text-[#9d978f] border border-[#E4DED6] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-2xl py-3 pl-12 pr-4 text-[13px] font-bold outline-none transition-all"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    .map((product) => {
                      const meta = parseNotesMeta(selectedRequestForSend?.notes);
                      const isBaseOverpriced = !product.variants?.length && meta?.originalItemPrice && product.price > meta.originalItemPrice;

                      return (
                        <div key={product.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all border group ${isBaseOverpriced ? 'bg-red-50 border-red-200 opacity-85' : 'bg-[#FAF8F5] border-[#E4DED6] hover:bg-white hover:border-[#C9A77A]'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E4DED6] overflow-hidden shrink-0">
                              <img src={getFinalImageUrl(product.imageUrl)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13px] font-bold text-[#171717] leading-tight">{product.name}</h4>
                                {isBaseOverpriced && <span className="text-[9px] font-black text-red-700 uppercase tracking-tighter px-1.5 py-0.5 bg-red-100 rounded border border-red-200">Exceeds Credit</span>}
                              </div>
                              <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-widest mt-0.5">
                                SKU: {product.sku} | STOCK: {product.stock} | <span className={isBaseOverpriced ? 'text-red-600' : 'text-[#8A6D3F]'}>{product.price} LKR</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (product.variants?.length > 0) {
                                setSelectedProductForVariant(product);
                              } else {
                                handleSendProduct(product);
                              }
                            }}
                            disabled={submittingReplacement || isBaseOverpriced}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 ${isBaseOverpriced ? 'bg-[#F1ECE5] text-[#8a857d] cursor-not-allowed' : 'bg-[#171717] text-white hover:bg-[#292929]'}`}
                          >
                            {isBaseOverpriced ? "Unavailable" : (product.variants?.length > 0 ? "Select Variant" : "Select")}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => setSelectedProductForVariant(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#77736E] hover:text-[#171717] transition-colors mb-2"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back to Product List
                </button>

                <div className="flex items-center justify-between p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4DED6] mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-[#E4DED6] overflow-hidden shrink-0">
                      <img src={getFinalImageUrl(selectedProductForVariant.imageUrl)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-headline font-bold text-[#171717]">{selectedProductForVariant.name}</h4>
                      <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-widest">Select the specific item variant to send</p>
                    </div>
                  </div>
                  {parseNotesMeta(selectedRequestForSend?.notes)?.originalItemPrice && (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-[#77736E] tracking-widest">Original Credit</p>
                      <p className="text-[14px] font-black text-[#8A6D3F] leading-none mt-0.5">
                        {parseNotesMeta(selectedRequestForSend.notes).originalItemPrice} LKR
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                  {selectedProductForVariant.variants.map((v, idx) => {
                    const meta = parseNotesMeta(selectedRequestForSend?.notes);
                    const isOverpriced = meta?.originalItemPrice && v.price > meta.originalItemPrice;

                    return (
                      <div key={idx} className={`flex items-center justify-between p-4 border rounded-2xl transition-all shadow-2xs group ${isOverpriced ? 'bg-red-50 border-red-200 opacity-85' : 'bg-white border-[#E4DED6] hover:border-[#C9A77A]'}`}>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(v.attributes || {}).map(([key, val]) => (
                              <span key={key} className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-colors ${isOverpriced ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[#FAF8F5] text-[#171717] border-[#E4DED6]'}`}>
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${v.stock > 0 ? 'text-[#77736E]' : 'text-red-600'}`}>
                              {v.stock > 0 ? `Stock: ${v.stock} Units` : 'Out of Stock'}
                            </p>
                            <p className={`text-[11px] font-black tracking-widest ${isOverpriced ? 'text-red-600' : 'text-[#8A6D3F]'}`}>
                              {v.price} LKR {isOverpriced && <span className="text-[9px] font-black text-red-600 uppercase ml-1">(Price Exceeded)</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendProduct(selectedProductForVariant, v)}
                          disabled={submittingReplacement || v.stock <= 0 || isOverpriced}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${isOverpriced ? 'bg-[#F1ECE5] text-[#8a857d] cursor-not-allowed' : 'bg-[#171717] text-white hover:bg-[#292929]'}`}
                        >
                          {isOverpriced ? 'Unavailable' : 'Confirm Replacement'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#EFEAE2] flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsSendProductModalOpen(false);
                  setSelectedProductForVariant(null);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
