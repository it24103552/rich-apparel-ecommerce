import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import { productsService } from "../../../services";
import { formatPrice } from "../../../utils/formatters";
import { Loader2, ArrowLeft, Printer, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export const BarcodePrintPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        productsService.getById(id)
            .then(res => {
                setProduct(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch product for printing:", err);
                toast.error("Failed to load product details");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (product && !loading) {
            const svgs = document.querySelectorAll(".barcode-svg");
            svgs.forEach(svg => {
                JsBarcode(svg, product.sku || product.id, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: false,
                    margin: 0
                });
            });
        }
    }, [product, loading, quantity]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#171717]" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-white border border-[#E4DED6] rounded-[24px]">
                <h2 className="text-xl font-headline font-bold text-[#171717] mb-4">Product Not Found</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[#171717] hover:bg-[#292929] text-white rounded-2xl font-headline font-bold text-sm transition-all">Back to Inventory</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16 print:pb-0 print:bg-white">
            {/* Interaction Header (Hide on Print) */}
            <div className="bg-white border border-[#E4DED6] rounded-[24px] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)] print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E4DED6] flex items-center justify-center text-[#292929] hover:text-[#171717] hover:bg-[#F1ECE5] transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-[20px] font-headline font-extrabold text-[#171717] tracking-tight leading-none">Barcode Printing Suite</h1>
                        <p className="text-[11px] font-bold text-[#77736E] uppercase tracking-widest">{product.name} • {product.sku}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col sm:items-end">
                        <label className="text-[10px] font-bold text-[#77736E] uppercase tracking-[0.18em] mb-1.5">Sheet Quantity</label>
                        <div className="flex items-center gap-2.5">
                            <input
                                type="number"
                                value={quantity}
                                min="1"
                                max={product.stock}
                                onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="w-24 bg-white border border-[#E4DED6] text-[#171717] rounded-xl px-3 py-2 text-[14px] font-bold focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 outline-none text-center"
                            />
                            <span className="text-[11px] font-bold text-[#77736E] uppercase">/ {product.stock} Available</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="h-11 px-7 bg-[#171717] hover:bg-[#292929] text-white rounded-2xl font-headline font-bold text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] flex items-center gap-2.5 transition-all active:scale-95 group"
                    >
                        <Printer className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Launch Print
                    </button>
                </div>
            </div>

            {/* Sheet Preview Container */}
            <div className="max-w-[210mm] mx-auto mt-8 mb-16 bg-white text-black shadow-[0_12px_36px_rgba(23,23,23,0.08)] border border-[#E4DED6] p-[15mm] min-h-[297mm] rounded-[16px] relative overflow-hidden print:m-0 print:shadow-none print:border-none print:p-[10mm] print:rounded-none">

                {/* A4 Content Grid */}
                <div className="grid grid-cols-5 gap-y-8 gap-x-4">
                    {Array.from({ length: quantity }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center justify-between border border-neutral-200 rounded-lg p-3 h-[45mm] bg-white group hover:border-neutral-400 transition-colors print:border-neutral-300">
                            <div className="w-full text-center overflow-hidden">
                                <p className="text-[9px] font-black text-neutral-900 uppercase tracking-tighter truncate leading-tight mb-1">{product.name}</p>
                            </div>

                            <div className="flex-1 flex items-center justify-center w-full min-h-[20mm]">
                                <svg className="barcode-svg w-full"></svg>
                            </div>

                            <div className="w-full text-center mt-auto">
                                <p className="text-[8px] font-bold text-neutral-500 tracking-[0.1em]">{product.sku}</p>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <span className="text-[9px] font-black text-neutral-900">{formatPrice(product.price)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State / Guidance (Hide on print) */}
                {quantity === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 print:hidden">
                        <RefreshCw className="w-12 h-12 mb-4 animate-spin-slow opacity-30" />
                        <p className="font-bold uppercase tracking-widest text-xs">Awaiting Quantity Definition...</p>
                    </div>
                )}
            </div>

            {/* Global CSS for Print Overrides */}
            <style>{`
        @media print {
          body { 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, aside, header, .print-hidden, [role="navigation"], [role="banner"] { 
            display: none !important; 
          }
          .min-h-screen { min-h: 0 !important; }
          .bg-neutral-50/50 { background: white !important; }
          .pb-20 { padding-bottom: 0 !important; }
          .max-w-[210mm] { 
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
