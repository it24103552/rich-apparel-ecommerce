import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
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
import { Modal } from "../../../components/common/Modal";
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
import { getDisplayColor } from "../../../utils/colorUtils";
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

  // Ensure value is always an array for multi-tone
  const currentTones = Array.isArray(value) ? value : (value ? [value] : []);

  const toggleTone = (tone) => {
    const isSelected = currentTones.includes(tone);
    const next = isSelected
      ? currentTones.filter(t => t !== tone)
      : [...currentTones, tone];
    onChange(next);
  };

  const handleApplyCustom = () => {
    if (!currentTones.includes(customColor)) {
      syncNewTone(customColor, customName);
      toggleTone(customColor);
    }
    setCustomName("");
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsPickerOpen(!isPickerOpen)}
        className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 border border-neutral-100 rounded-[10px] min-h-[42px] min-w-[140px] cursor-pointer hover:border-black/20 transition-all items-center"
      >
        {currentTones.length === 0 ? (
          <span className="text-neutral-400 text-[11px] font-black uppercase tracking-widest pl-1">Pick Color</span>
        ) : (
          currentTones.map(t => (
            <div key={t} className="group/chip flex items-center gap-1.5 bg-white border border-neutral-100 rounded-[6px] pl-1 pr-1.5 py-0.5 shadow-sm">
              <div
                className="w-3 h-3 rounded-full border border-neutral-300"
                style={{ backgroundColor: getDisplayColor(t) }}
              />
              <span className="text-[9px] font-black text-neutral-900 uppercase truncate max-w-[60px]">{resolveColorName(t)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTone(t);
                }}
                className="w-3 h-3 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-all"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          ))
        )}
      </div>

      {isPickerOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsPickerOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-[70] bg-white border border-neutral-100 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] rounded-[18px] pt-4 px-4 pb-2 w-[280px] animate-in slide-in-from-bottom-2 duration-300 origin-bottom-left max-h-[480px] overflow-y-auto custom-scrollbar">
            <div className="mb-4">
              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-2.5">Colour Picker</h4>
              <div className="grid grid-cols-5 gap-2">
                {options.map(opt => {
                  const colorVal = getDisplayColor(opt);
                  const isSelected = currentTones.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleTone(opt)}
                      className={`w-9 h-9 rounded-[10px] border-2 transition-all duration-300 ${isSelected ? 'border-black scale-110 shadow-lg ring-4 ring-black/5' : 'border-neutral-200 hover:scale-105 hover:border-neutral-400'}`}
                      style={{ backgroundColor: colorVal }}
                      title={opt}
                    />
                  );
                })}
              </div>
            </div>

            {synapticPalette?.length > 0 && (
              <div className="mb-4 pt-4 border-t border-neutral-50/50">
                <h4 className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-2.5">Recent Colours</h4>
                <div className="grid grid-cols-5 gap-2">
                  {synapticPalette.slice(-10).map(t => {
                    const isSelected = currentTones.includes(t.hex);
                    return (
                      <button
                        key={t.hex}
                        type="button"
                        onClick={() => toggleTone(t.hex)}
                        className={`w-9 h-9 rounded-[10px] border-2 transition-all duration-300 ${isSelected ? 'border-black scale-110 shadow-lg ring-4 ring-black/5' : 'border-transparent hover:scale-105 hover:bg-neutral-50 hover:border-neutral-100'}`}
                        style={{ backgroundColor: t.hex }}
                        title={t.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-50/50 mb-2">
              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-3">New Colour Discovery</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-[10px] border border-neutral-100 p-0.5 bg-neutral-50 shadow-sm relative overflow-hidden flex-shrink-0 group/picker hover:border-black/10 transition-all">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Colour Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-100 rounded-[10px] px-3.5 h-10 text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-black transition-all shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-[10px] hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Add Colour
                </button>
              </div>
            </div>
          </div>
        </>
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

    // Check Synaptic Palette first (manual names)
    const synapticTone = synapticPalette.find(t => t.hex.toUpperCase() === hex.toUpperCase());
    if (synapticTone) return synapticTone.name;

    const names = {
      "#000000": "Black", "#FFFFFF": "White", "#FF0000": "Red", "#00FF00": "Lime",
      "#0000FF": "Blue", "#FFFF00": "Yellow", "#FFA500": "Orange", "#800080": "Purple",
      "#FFC0CB": "Pink", "#A52A2A": "Brown", "#808080": "Gray", "#008080": "Teal",
      "#4B0082": "Indigo", "#EE82EE": "Violet", "#FF00FF": "Magenta", "#00FFFF": "Cyan",
      "#F5F5DC": "Beige", "#98FB98": "Pale Green", "#E6E6FA": "Lavender", "#FFD700": "Gold"
    };
    return names[hex.toUpperCase()] || `Tone ${hex.toUpperCase()}`;
  };

  const syncNewTone = (hex, name) => {
    if (!hex) return;
    setSynapticPalette(prev => {
      // Don't add duplicates
      if (prev.some(t => t.hex.toUpperCase() === hex.toUpperCase())) return prev;
      const toneName = name?.trim() || resolveColorName(hex);
      return [...prev, { hex: hex.toUpperCase(), name: toneName }];
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
    setVariants(freshProduct.variants || []);
    setSynapticPalette([]);
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
    return <AdminPageSkeleton dark />;
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
                          <div className="mx-6 p-6 bg-neutral-950 rounded-[28px] border border-white/10 flex flex-col md:flex-row gap-8 animate-fade-in shadow-2xl mt-3 mb-6 relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/5 blur-[80px] rounded-full pointer-events-none" />

                            {!meta && !fulfillment && request.notes && (
                              <div className="flex-1 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Sourcing Notes & Rationale</p>
                                <div className="bg-white/5 backdrop-blur-md p-5 rounded-[22px] border border-white/10 shadow-lg group/notes hover:border-white/20 transition-all">
                                  <p className="text-[13px] text-white/80 font-medium leading-relaxed italic">
                                    "{request.notes.split('||META||')[0].split('||FULFILLMENT||')[0]}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {meta && (
                              <div className="flex-[1.4] space-y-5">
                                <div>
                                  <div className="flex items-center gap-2 mb-4 ml-1">
                                    <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[14px] text-white/60">person_search</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Customer Context</p>
                                  </div>
                                  
                                  <div className="bg-white/[0.03] backdrop-blur-xl p-5 rounded-[24px] border border-white/10 shadow-xl">
                                    <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">Full Name</p>
                                        <p className="text-[14px] font-black text-white leading-tight truncate">{meta.customerName}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">Direct Email</p>
                                        <p className="text-[12px] font-bold text-white/60 truncate lowercase tracking-wide">{meta.customerEmail}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">Mobile Contact</p>
                                        <p className="text-[13px] font-black text-white tracking-widest">{meta.customerPhone}</p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">Shipping Address</p>
                                        <p className="text-[11px] font-bold text-neutral-400 line-clamp-2 leading-relaxed uppercase tracking-tight">
                                          {meta.customerAddress || 'Direct Pickup/N/A'}
                                        </p>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">Delivery Method</p>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                          <p className="text-[12px] font-black text-white uppercase tracking-widest">{meta.deliveryMethod || 'Standard'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-indigo-500/5 p-4 rounded-[20px] border border-indigo-500/10 group/reason hover:bg-indigo-500/10 transition-all cursor-default">
                                  <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-[0.2em] mb-2">Return Rationale</p>
                                  <p className="text-[12px] text-indigo-100/90 font-bold italic leading-relaxed">
                                    "{meta.reason}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {meta?.returnImage && (
                              <div className="flex-none w-[130px] self-start">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 ml-1">Asset Verification</p>
                                <div className="bg-white/5 p-1.5 rounded-[22px] border border-white/10 shadow-xl group/img hover:border-white/30 transition-all">
                                  <a href={getFinalImageUrl(meta.returnImage)} target="_blank" rel="noreferrer" className="block relative overflow-hidden rounded-[18px]">
                                    <img
                                      src={getFinalImageUrl(meta.returnImage)}
                                      alt="Proof"
                                      className="w-full h-[90px] object-cover group-hover/img:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                      <span className="material-symbols-outlined text-white text-[18px]">fullscreen</span>
                                    </div>
                                  </a>
                                </div>
                              </div>
                            )}

                            {fulfillment && (
                              <div className="flex-1 bg-black rounded-[28px] p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col justify-center relative">
                                <div className="absolute top-4 right-6 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Fulfilment</span>
                                </div>

                                <div className="flex items-center gap-2 mb-5">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-400">local_shipping</span>
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Replacement Dispatched</p>
                                </div>
                                <div className="flex items-center gap-5">
                                  <div className="w-20 h-20 rounded-[22px] bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-2xl group/sub-img">
                                    <img src={getFinalImageUrl(fulfillment.imageUrl)} className="w-full h-full object-cover group-hover/sub-img:scale-110 transition-transform duration-500" alt="" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-[15px] font-black text-white truncate leading-tight mb-1">{fulfillment.name}</h5>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">SKU ID: {fulfillment.sku}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {Object.entries(fulfillment.variantAttributes || {}).map(([k, v]) => (
                                        <span key={k} className="px-2.5 py-1 bg-white/5 text-white/70 rounded-[10px] text-[8px] font-black uppercase tracking-widest border border-white/10 shadow-sm">
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
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              <span>Products</span>
              <span className="material-symbols-outlined text-[12px] mt-0.5">chevron_right</span>
              <span className="text-white">{modalMode === "create" ? "Add New Product" : "Edit Item"}</span>
            </div>
            <h2 className="text-[26px] font-headline font-black tracking-tight text-white leading-none">
              {modalMode === "create" ? "New Product Item" : "Refine Collection Item"}
            </h2>
          </div>
        }
        actions={
          <div className="flex items-center gap-4">
            <div
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] cursor-pointer transition-all mr-2 group/status"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-neutral-500 group-hover/status:text-white transition-colors">public</span>
                <span className="text-[11px] font-black text-neutral-300 uppercase tracking-widest hidden sm:block">Public</span>
              </div>
              <button
                type="button"
                className={`w-8 h-4.5 rounded-full relative transition-[background-color] duration-300 ${isActive ? 'bg-white' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-[#141414] rounded-full transition-all duration-300 ${isActive ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseAttempt}
                type="button"
                className="px-6 py-2.5 rounded-[14px] bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold font-headline text-[13px] tracking-tight transition-all active:scale-95"
              >
                Discard
              </button>
              <button
                onClick={handlePublishRequest}
                type="button"
                disabled={saving}
                className="px-8 py-2.5 rounded-[14px] bg-white hover:bg-neutral-200 text-black font-black font-headline text-[13px] tracking-tight shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all flex items-center gap-2 group active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{modalMode === "create" ? "Publish Product" : "Commit Changes"}</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <form id="product-architect-form" onSubmit={handleSubmit(onSubmit)} className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Information & Variants */}
            <div className="lg:col-span-8 space-y-6">

              {/* Essential Information Section */}
              <div className="bg-white/[0.03] rounded-[24px] p-6 border border-white/[0.06] relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-neutral-500">info</span>
                  <h3 className="text-[16px] font-bold text-white font-headline">Essential Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Product Name</label>
                      <input
                        placeholder="e.g. Minimalist Cashmere Overcoat"
                        {...register("name", productRules.name)}
                        className={`w-full bg-[#141414] border ${errors.name ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all placeholder:text-neutral-600 h-[52px]`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductName(val);
                          if (modalMode === 'create' && (!sku || sku.startsWith('RA-'))) {
                            setSku(generateSKU(val));
                          }
                        }}
                      />
                      {errors.name && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">SKU Identification</label>
                        <button
                          type="button"
                          onClick={() => setSku(generateSKU(productName))}
                          className="text-[10px] font-black text-white hover:underline uppercase tracking-widest transition-all"
                        >
                          Regenerate
                        </button>
                      </div>
                      <input
                        placeholder="e.g. RA-MCO-1234"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        className="w-full bg-[#141414] border border-white/10 rounded-[14px] px-4 py-3.5 text-[14px] font-black tracking-widest focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all placeholder:text-neutral-600 h-[52px]"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Description</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingDesc || !productName}
                        className="flex items-center gap-1 text-[10px] font-bold text-white hover:opacity-70 disabled:opacity-30 transition-opacity"
                      >
                        {generatingDesc ? 'Neural Processing...' : '✨ Generate with AI'}
                      </button>
                    </div>
                    <textarea
                      placeholder="Describe the silhouette, materials, and artisan techniques used..."
                      {...register("description", productRules.description)}
                      rows={4}
                      className={`w-full bg-[#141414] border ${errors.description ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] px-4 py-3.5 text-[14px] font-medium focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all placeholder:text-neutral-600 resize-none`}
                    />
                    {errors.description && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 text-left">Actual Cost (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-[14px]">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("costPrice", productRules.costPrice)}
                          className={`w-full bg-white/[0.03] border ${errors.costPrice ? 'border-red-500/40' : 'border-white/[0.06]'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px]`}
                        />
                      </div>
                      {errors.costPrice && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.costPrice.message}</p>}
                      {watch("price") && watch("costPrice") && (
                        <p className="text-[10px] font-bold text-neutral-500 mt-1.5 ml-1 text-left">
                          Est. Profit: <span className="text-white">Rs. {(Number(watch("price")) - Number(watch("costPrice"))).toLocaleString()}</span>
                        </p>
                      )}
                    </div>

                    <div className="relative group/price">
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest text-left">Retail Price (LKR)</label>
                        {watch("price") && watch("costPrice") && (
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${Number(watch("price")) - Number(watch("costPrice")) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {Math.round(((Number(watch("price")) - Number(watch("costPrice"))) / Number(watch("price"))) * 100)}% Margin
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-[14px]">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("price", productRules.price)}
                          className={`w-full bg-[#141414] border ${errors.price ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] pl-11 pr-4 py-3.5 text-[14px] font-black focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px]`}
                        />
                      </div>
                      {errors.price && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.price.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 text-left">Collection Category</label>
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
                          style={{ colorScheme: "dark" }}
                          className={`w-full bg-[#141414] text-white border ${errors.categoryId ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px] appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-[#141414] text-neutral-400">Select Collection</option>
                          {categories.filter(c => c.isActive !== false).map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#141414] text-white">{c.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">unfold_more</span>
                      </div>
                      {errors.categoryId && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1">{errors.categoryId.message}</p>}
                    </div>

                    <div className="relative text-left">
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 text-left">Supplier Source</label>
                      <div className="relative text-left">
                        <select
                          {...register("supplierId", productRules.supplierId)}
                          style={{ colorScheme: "dark" }}
                          className={`w-full bg-[#141414] text-white border ${errors.supplierId ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] px-4 py-3.5 text-[14px] font-bold focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px] appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-[#141414] text-neutral-400">Select Supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#141414] text-white">{s.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">factory</span>
                      </div>
                      {errors.supplierId && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.supplierId.message}</p>}
                    </div>

                    {/* Conditional Stock Input for Simple Items */}
                    {(() => {
                      const catId = watch("categoryId");
                      const category = categories.find(c => c.id === catId);
                      const variantConfig = category?.variantConfig ? (typeof category.variantConfig === 'string' ? JSON.parse(category.variantConfig) : category.variantConfig) : null;

                      if (variantConfig && Array.isArray(variantConfig) && variantConfig.length > 0) return null;

                      return (
                        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Total Available Stock</label>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            {...register("stock", { ...productRules.stock, min: { value: 0, message: "Stock cannot be negative" } })}
                            className={`w-full bg-[#141414] border ${errors.stock ? 'border-red-500/40' : 'border-white/10'} rounded-[14px] px-4 py-3.5 text-[14px] font-black focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px]`}
                          />
                          {errors.stock && <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1 text-left">{errors.stock.message}</p>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Product Variants Section - Autonomous Discovery */}
              {(() => {
                const catId = watch("categoryId");
                const category = categories.find(c => c.id === catId);
                const variantConfig = category?.variantConfig ? (typeof category.variantConfig === 'string' ? JSON.parse(category.variantConfig) : category.variantConfig) : null;

                if (!variantConfig || !Array.isArray(variantConfig) || variantConfig.length === 0) return null;

                return (
                  <div className="bg-[#141414] rounded-[24px] p-6 border border-white/[0.06] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-visible group animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px] text-white">inventory_2</span>
                        </div>
                        <h3 className="text-[15px] font-black text-white font-headline uppercase tracking-tight">Product Variants</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-widest bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 rounded-[10px] transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Option
                      </button>
                    </div>

                    <div className="pt-2 pb-6">
                      <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                          <tr>
                            {variantConfig.map(cfg => (
                              <th key={cfg.name} className="pb-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3 border-b border-white/[0.06]">
                                {cfg.name}
                              </th>
                            ))}
                            <th className="pb-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3 border-b border-white/[0.06]">Stock Level</th>
                            <th className="pb-3 w-10 border-b border-white/[0.06]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {variants.length === 0 ? (
                            <tr>
                              <td colSpan={variantConfig.length + 2} className="py-10 text-center text-neutral-600 text-[12px] font-medium italic">
                                No variants configured. Click "Add Option" to begin.
                              </td>
                            </tr>
                          ) : (
                            variants.map((v, i) => (
                              <tr key={i} className="group/row">
                                {variantConfig.map(cfg => (
                                  <td key={cfg.name} className="py-4 px-2">
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
                                        style={{ colorScheme: "dark" }}
                                        className="w-full bg-white/[0.03] text-white border border-white/[0.06] rounded-[10px] px-3 py-2 text-[13px] font-bold focus:ring-4 focus:ring-white/10 focus:border-white/40 transition-all outline-none cursor-pointer h-[42px]"
                                      >
                                        <option value="" className="bg-[#141414] text-neutral-400">Select {cfg.name}</option>
                                        {cfg.options?.map(opt => (
                                          <option key={opt} value={opt} className="bg-[#141414] text-white">{opt}</option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                ))}
                                <td className="py-4 px-2">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                                    className="w-24 bg-white/[0.03] border border-white/[0.06] rounded-[10px] px-3 py-2 text-[13px] font-black focus:ring-4 focus:ring-white/10 focus:border-white/40 transition-all outline-none h-[42px]"
                                  />
                                </td>
                                <td className="py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeVariant(i)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/row:opacity-100"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {variants.length > 0 && (
                          <tfoot className="border-t border-white/[0.06]">
                            <tr className="bg-white/[0.03]">
                              <td colSpan={variantConfig.length} className="py-4 px-6 text-right">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Total Products Count</span>
                              </td>
                              <td className="py-4 px-2">
                                <div className="w-24 h-[42px] flex items-center justify-center bg-[#141414] border border-white/10 rounded-[10px] text-[14px] font-black text-white shadow-sm animate-in fade-in zoom-in duration-300">
                                  {watch("stock") || 0}
                                </div>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Imagery & Status */}
            <div className="lg:col-span-4 space-y-6">

              {/* Product Imagery Section */}
              <div className="bg-[#0a0a0a] rounded-[28px] p-7 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] group overflow-hidden">
                <div className="flex items-center gap-3 mb-8 border-b border-white/[0.05] pb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-white/60">image</span>
                  </div>
                  <h3 className="text-[17px] font-black text-white font-headline tracking-tight uppercase">Product Imagery</h3>
                </div>

                <div className="space-y-6">
                  <div
                    className={`relative aspect-[4/5] rounded-[24px] border-2 border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group/upload ${images.length > 0 ? 'border-none' : 'hover:border-white/[0.08] hover:bg-white/[0.03]'}`}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    {images.length > 0 ? (
                      <img src={images[0].url} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/upload:scale-110" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-white/[0.05] shadow-2xl flex items-center justify-center mb-5 transition-transform group-hover/upload:scale-110 backdrop-blur-md border border-white/10">
                          <span className="material-symbols-outlined text-white/50 text-[26px]">cloud_upload</span>
                        </div>
                        <p className="text-[14px] font-black text-white leading-tight">Drop images here</p>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-2">OR CLICK TO BROWSE GALLERY (MAX 5)</p>
                      </>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files.length > 0) handleImageChange(files);
                      }}
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto py-2 hide-scrollbar">
                      {images.map((img, index) => (
                        <div
                          key={img.id}
                          onClick={(e) => { e.stopPropagation(); setMainImage(img.id); }}
                          className={`w-16 h-16 rounded-[14px] overflow-hidden shrink-0 relative group/thumb shadow-lg cursor-pointer transition-all duration-200 ${index === 0 ? 'border-2 border-amber-400 ring-2 ring-amber-400/30' : 'border border-white/10 hover:border-white/[0.08]'}`}
                        >
                          <img src={img.url} className="w-full h-full object-cover" />
                          {index === 0 && (
                            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-md bg-amber-400 flex items-center justify-center shadow-md">
                              <span className="material-symbols-outlined text-white text-[12px]">star</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="text-white hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {images.length < 5 && (
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload').click()}
                          className="w-16 h-16 rounded-[14px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 border-dashed flex items-center justify-center transition-all shrink-0 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-white/30">add</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="bg-white/[0.02] rounded-[20px] p-5 flex gap-3.5 items-start border border-white/[0.03]">
                    <span className="material-symbols-outlined text-[20px] text-neutral-400 mt-0.5">info</span>
                    <div>
                      <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1.5">UPLOAD GUIDELINES</h4>
                      <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
                        High-resolution JPG/PNG. 4:5 aspect ratio recommended. Max 5 images per product.
                      </p>
                    </div>
                  </div>
                </div>
              </div>


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
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              <span>Inventory</span>
              <span className="material-symbols-outlined text-[12px] mt-0.5">chevron_right</span>
              <span className="text-white">Restock Protocol</span>
            </div>
            <h2 className="text-[20px] font-headline font-black tracking-tight text-white leading-none">
              {restockModalProduct?.name}
            </h2>
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={closeRestockModal}
              type="button"
              className="px-6 py-2 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold font-headline text-[12px] tracking-tight transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleRestockSubmit}
              type="button"
              disabled={restockLoading}
              className="px-8 py-2 rounded-[12px] bg-white hover:bg-neutral-200 text-black font-black font-headline text-[12px] tracking-tight shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
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
        <div className="py-2 space-y-6">
          {/* Product Identity Card */}
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] flex items-center justify-between group overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {restockModalProduct?.imageUrl ? (
                  <img
                    src={getFinalImageUrl(restockModalProduct.imageUrl)}
                    alt={restockModalProduct.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon size={24} className="text-neutral-600" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Reference SKU</p>
                <p className="text-[14px] font-mono font-bold text-white uppercase">{restockModalProduct?.sku || 'N/A'}</p>
              </div>
            </div>

            <div className="text-right relative z-10">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Current Inventory</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`w-2 h-2 rounded-full ${restockModalProduct?.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                <p className={`text-[18px] font-black font-headline ${restockModalProduct?.stock < 10 ? 'text-red-400' : 'text-white'}`}>
                  {restockModalProduct?.stock} Units
                </p>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">package_2</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Conditional Variant Table or Single Input */}
            {restockModalProduct?.variants && restockModalProduct.variants.length > 0 ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    Variant Breakdown
                  </label>
                  <span className="text-[10px] font-black text-neutral-400 bg-white/[0.06] px-2.5 py-1 rounded-full uppercase tracking-tighter">
                    {restockModalProduct.variants.length} Configs
                  </span>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse bg-[#141414]">
                    <thead>
                      <tr className="bg-white/[0.03] border-bottom border-white/[0.06]">
                        <th className="text-left py-3 px-4 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-white/[0.06]">Configuration</th>
                        <th className="text-right py-3 px-4 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-white/[0.06]">On Hand</th>
                        <th className="text-right py-3 px-4 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-white/[0.06]">Request Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {restockModalProduct.variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.05] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {v.attributes ? (
                                Object.entries(v.attributes).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 bg-white/[0.06] text-neutral-300 text-[10px] font-bold rounded-md uppercase tracking-tight flex items-center gap-1">
                                    <span className="text-neutral-500 font-medium lowercase italic">{key}:</span>
                                    <span>{typeof value === 'object' ? Object.values(value).filter(val => typeof val !== 'object').join(' / ') : String(value)}</span>
                                  </span>
                                ))
                              ) : (
                                Object.entries(v).map(([key, value]) => {
                                  if (['stock', 'priceAdj', 'price', 'quantity', 'attributes'].includes(key)) return null;
                                  return (
                                    <span key={key} className="px-2 py-0.5 bg-white/[0.06] text-neutral-300 text-[10px] font-bold rounded-md uppercase tracking-tight flex items-center gap-1">
                                      <span className="text-neutral-500 font-medium lowercase italic">{key}:</span>
                                      <span>{typeof value === 'object' ? Object.values(value).filter(val => typeof val !== 'object').join(' / ') : String(value)}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[12px] font-bold ${v.stock < 5 ? 'text-red-400' : 'text-neutral-400'}`}>
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
                              className="w-20 bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-white/40 rounded-lg px-2 py-1 text-[13px] font-bold text-right outline-none transition-all"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-white text-black">
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
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Restock Quantity</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors">inventory</span>
                  <input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                    className="w-full bg-[#141414] border border-white/10 rounded-[14px] pl-12 pr-4 py-3 text-[14px] font-bold focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all h-[52px] shadow-sm"
                    placeholder="Enter quantity to request..."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">notes</span>
                Collaborative Notes (Optional)
              </label>
              <textarea
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#141414] border border-white/10 rounded-[14px] px-4 py-3 text-[14px] font-medium focus:ring-4 focus:ring-white/10 focus:border-white/40 outline-none transition-all placeholder:text-neutral-600 resize-none shadow-sm min-h-[100px]"
                placeholder="Mention specific requirements for the supplier..."
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Product Details Viewer (Crystal Clear Edit) */}
      {viewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl transition-all duration-700" onClick={closeViewModal} />

          <div className="bg-[#141414] text-white w-full max-w-6xl h-full max-h-[85vh] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row relative animate-scale-up">
            {/* Close Button Pin */}
            <button
              onClick={closeViewModal}
              className="absolute top-6 right-6 z-[10] w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 flex items-center justify-center transition-all active:scale-95 border border-white/10 backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Left Column: Visuals (55%) */}
            <div className="w-full md:w-[55%] h-full bg-white flex flex-col relative group">
              <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
                {activeDetailPhoto ? (
                  <img
                    src={getFinalImageUrl(activeDetailPhoto)}
                    alt="Product"
                    className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-neutral-300">
                    <span className="material-symbols-outlined text-[64px]">image_not_supported</span>
                    <p className="text-[11px] font-black uppercase tracking-widest">No Visuals Available</p>
                  </div>
                )}
              </div>

              {/* Internal Gallery */}
              <div className="p-8 pt-0 flex justify-center">
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar max-w-full shadow-2xl">
                  {[viewProduct.imageUrl, ...(viewProduct.images || [])]
                    .filter(Boolean)
                    .filter((url, index, self) => self.indexOf(url) === index)
                    .map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveDetailPhoto(url)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeDetailPhoto === url ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <img src={getFinalImageUrl(url)} className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: Information (45%) */}
            <div className="w-full md:w-[45%] h-full bg-[#141414] p-10 overflow-y-auto no-scrollbar flex flex-col">
              {/* Header Info */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  {viewProduct.stock === 0 ? (
                    <span className="px-3 py-1 bg-red-500/15 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-500/25">Draft / Out of Stock</span>
                  ) : viewProduct.stock <= 5 ? (
                    <span className="px-3 py-1 bg-amber-500/15 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/25">Low Stock Alert</span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/25">Inventory Active</span>
                  )}
                </div>

                <h2 className="text-[32px] md:text-[42px] font-headline font-black text-white leading-tight mb-2 tracking-tight">{viewProduct.name}</h2>
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="text-[11px] font-black tracking-widest uppercase bg-white/[0.06] px-2.5 py-1 rounded-md border border-white/10">SKU: {viewProduct.sku}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[12px] font-medium text-neutral-300">{categories.find(c => c.id === viewProduct.categoryId)?.name || 'General Category'}</span>
                </div>
              </div>

              {/* Finance Grid */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-[24px] hover:bg-white/[0.08] transition-colors group">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">RETAIL PRICE</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-headline font-black text-white">{formatPrice(viewProduct.price)}</span>
                    <span className="text-[12px] text-neutral-500 font-medium tracking-widest">USD</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-[24px] hover:bg-white/[0.08] transition-colors group">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">PROFIT MARGIN</p>
                  <div className="flex items-baseline gap-1">
                    {(() => {
                      const margin = viewProduct.price > 0 ? Math.round(((viewProduct.price - viewProduct.costPrice) / viewProduct.price) * 100) : 0;
                      return (
                        <span className={`text-[24px] font-headline font-black ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {margin}%
                        </span>
                      );
                    })()}
                    <span className="text-[12px] text-neutral-500 font-medium tracking-widest">NET</span>
                  </div>
                </div>
              </div>

              {/* Variant Specs */}
              <div className="mb-10 flex-1">
                <div className="flex items-center justify-between mb-6 border-b border-white/[0.06] pb-4">
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Variant Inventory</h3>
                  <span className="text-[11px] font-bold text-neutral-500">{viewProduct.variants?.length || 0} SELECTIONS</span>
                </div>

                <div className="space-y-3">
                  {viewProduct.variants && viewProduct.variants.length > 0 ? (
                    viewProduct.variants.map((v, idx) => {
                      // Helper to resolve color name from hex (handles strings and arrays)
                      const resolveColorName = (val) => {
                        if (!val) return val;
                        if (Array.isArray(val)) return val.map(v => resolveColorName(v)).filter(v => v && !String(v).startsWith('#')).join(', ');
                        if (typeof val !== 'string' || !val.startsWith('#')) return val;
                        const found = synapticPalette.find(p => p.hex.toLowerCase() === val.toLowerCase());
                        return found ? found.name : val;
                      };

                      // Extract attributes properly, flattening arrays and filtering hex codes
                      const attrDisplay = v.attributes
                        ? Object.entries(v.attributes)
                          .map(([key, value]) => resolveColorName(value))
                          .filter(val => val && (typeof val !== 'string' || !val.startsWith('#')))
                          .filter(Boolean)
                          .join(' / ')
                        : `${v.size || ''} / ${v.color || ''}`.replace(/^ \/ | \/ $/, '');

                      // Find all actual color codes for the multi-tone swatch
                      const allAttrValues = Object.values(v.attributes || {}).flat();
                      const swatchColors = allAttrValues.filter(val => typeof val === 'string' && val.startsWith('#'));
                      if (v.colorCode) swatchColors.unshift(v.colorCode);

                      const uniqueSwatches = [...new Set(swatchColors)];

                      return (
                        <div key={idx} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] p-4 rounded-[18px] hover:border-white/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-1">
                              {uniqueSwatches.length > 0 ? (
                                uniqueSwatches.map((color, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="w-3 h-3 rounded-full shadow-sm border border-white ring-1 ring-white/10"
                                    style={{ backgroundColor: color, zIndex: uniqueSwatches.length - cIdx }}
                                  />
                                ))
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-white/10 border border-white ring-1 ring-white/10" />
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-neutral-100 uppercase tracking-wider">
                                {attrDisplay || 'Standard Variant'}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-medium">QTY: {v.stock} UNITS</p>
                            </div>
                          </div>
                          <p className="text-[13px] font-black text-white">
                            {v.priceAdj > 0 ? `+${formatPrice(v.priceAdj)}` : formatPrice(viewProduct.price + (v.priceAdj || 0))}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white/[0.03] rounded-[20px] p-8 text-center border border-dashed border-white/10">
                      <p className="text-neutral-500 text-[11px] font-black uppercase tracking-widest">No Variants Configured</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-10">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Description</h3>
                <p className="text-neutral-300 text-[14px] leading-relaxed font-medium">
                  {viewProduct.description || 'No description provided for this collection item.'}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-10 border-t border-white/[0.06] flex items-center justify-between mt-auto">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">ACQUISITION</p>
                  <p className="text-[11px] text-neutral-300 font-medium">{suppliers.find(s => s.id === viewProduct.supplierId)?.name || 'Direct Procurement'}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      navigate(`/admin/products/${viewProduct.id}/print`);
                    }}
                    className="h-12 px-6 rounded-2xl bg-white hover:bg-neutral-200 flex items-center justify-center gap-2 transition-all text-black shadow-lg active:scale-95"
                    title="Print Barcode Tags"
                  >
                    <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
                    <span className="text-[11px] font-black uppercase tracking-widest hidden sm:block">Print Tags</span>
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal();
                      openEditModal(viewProduct);
                    }}
                    className="w-12 h-12 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all border border-white/10 text-neutral-200 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => { closeViewModal(); setDeleteTarget(viewProduct); }} className="w-12 h-12 rounded-2xl bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center transition-all border border-red-500/25 text-red-400 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
            <div className="mx-0.5 p-3 bg-indigo-600 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-500/20">
              <div className="flex items-center gap-3 text-white">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">Available Exchange Credit</p>
              </div>
              <p className="text-[16px] font-black text-white">
                {parseNotesMeta(selectedRequestForSend.notes).originalItemPrice} LKR
              </p>
            </div>
          )}

          <div className="space-y-6">
            {!selectedProductForVariant ? (
              <>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-[20px] group-focus-within:text-indigo-400 transition-colors">search</span>
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-600 rounded-2xl py-3 pl-12 pr-4 text-[13px] font-bold outline-none transition-all"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    .map((product) => {
                      const meta = parseNotesMeta(selectedRequestForSend?.notes);
                      // If no variants, check base price. If variants, we check in sub-view.
                      const isBaseOverpriced = !product.variants?.length && meta?.originalItemPrice && product.price > meta.originalItemPrice;

                      return (
                        <div key={product.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all border group ${isBaseOverpriced ? 'bg-red-500/10 border-red-500/20 opacity-80' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08]'
                          }`}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#141414] border border-white/10 overflow-hidden shrink-0">
                              <img src={getFinalImageUrl(product.imageUrl)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13px] font-black text-neutral-100 leading-tight">{product.name}</h4>
                                {isBaseOverpriced && <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">Exceeds Credit</span>}
                              </div>
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                                SKU: {product.sku} | STOCK: {product.stock} | <span className={isBaseOverpriced ? 'text-red-400' : 'text-indigo-400'}>{product.price} LKR</span>
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
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 ${isBaseOverpriced ? 'bg-white/10 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'
                              }`}
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
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors mb-2"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back to Product List
                </button>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#141414] border border-white/10 overflow-hidden shrink-0">
                      <img src={getFinalImageUrl(selectedProductForVariant.imageUrl)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-black text-white">{selectedProductForVariant.name}</h4>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Select the specific item variant to send</p>
                    </div>
                  </div>
                  {parseNotesMeta(selectedRequestForSend?.notes)?.originalItemPrice && (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">Original Credit</p>
                      <p className="text-[14px] font-black text-indigo-400 leading-none mt-0.5">
                        {parseNotesMeta(selectedRequestForSend.notes).originalItemPrice} LKR
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {selectedProductForVariant.variants.map((v, idx) => {
                    const meta = parseNotesMeta(selectedRequestForSend?.notes);
                    const isOverpriced = meta?.originalItemPrice && v.price > meta.originalItemPrice;

                    return (
                      <div key={idx} className={`flex items-center justify-between p-4 border rounded-2xl transition-all shadow-sm group ${isOverpriced ? 'bg-red-500/10 border-red-500/20 opacity-80' : 'bg-[#141414] border-white/[0.06] hover:border-indigo-600'
                        }`}>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(v.attributes || {}).map(([key, val]) => (
                              <span key={key} className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-colors ${isOverpriced ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/[0.06] text-neutral-300 border-white/10 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-400'
                                }`}>
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${v.stock > 0 ? 'text-neutral-500' : 'text-red-400'}`}>
                              {v.stock > 0 ? `Stock: ${v.stock} Units` : 'Out of Stock'}
                            </p>
                            <p className={`text-[11px] font-black tracking-widest ${isOverpriced ? 'text-red-400' : 'text-indigo-400'}`}>
                              {v.price} LKR {isOverpriced && <span className="text-[9px] font-black text-red-400 uppercase ml-1">(Price Exceeded)</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendProduct(selectedProductForVariant, v)}
                          disabled={submittingReplacement || v.stock <= 0 || isOverpriced}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${isOverpriced ? 'bg-white/[0.06] text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'
                            }`}
                        >
                          {isOverpriced ? 'Unavailable' : 'Confirm Replacement'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.06] flex justify-end">
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
