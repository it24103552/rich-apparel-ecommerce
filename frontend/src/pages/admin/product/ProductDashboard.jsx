import { useState, useEffect } from "react";
import { dashboardService } from "../../../services";
import { formatPrice } from "../../../utils/formatters";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const ProductDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getFinalImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `http://localhost:5001${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  useEffect(() => {
    dashboardService
      .getDashboardData()
      .then((res) => {
        setData(res.data.data);
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in relative pb-12 space-y-8 pt-2">
      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="admin-card p-5 rounded-[22px] group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex justify-between items-center relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <span className="text-[10px] font-bold font-headline uppercase tracking-widest text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] px-3 py-1 rounded-full">Inventory</span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77736E]">Total Products</p>
            <div className="text-[24px] font-headline font-extrabold text-[#171717] leading-none">
              {loading ? "..." : (data?.totalProducts || "1,248")}
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="admin-card p-5 rounded-[22px] group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape-alt absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex justify-between items-center relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live
            </span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77736E]">Active Products</p>
            <div className="text-[24px] font-headline font-extrabold text-[#171717] leading-none">
              {loading ? "..." : (data?.activeProducts || "1,102")}
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="admin-card p-5 rounded-[22px] group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex justify-between items-center relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-800 uppercase tracking-wider">Warning</span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77736E]">Low Stock</p>
            <div className="text-[24px] font-headline font-extrabold text-[#171717] leading-none">
              {loading ? "..." : (data?.lowStockProducts || "24")}
            </div>
          </div>
        </div>

        {/* Total Categories */}
        <div className="admin-card p-5 rounded-[22px] group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape-alt absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex justify-between items-center relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </div>
            <span className="text-[10px] font-bold font-headline uppercase tracking-widest text-[#5f5a53] bg-[#F1ECE5] border border-[#E4DED6] px-3 py-1 rounded-full">Structure</span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77736E]">Total Categories</p>
            <div className="text-[24px] font-headline font-extrabold text-[#171717] leading-none">
              {loading ? "..." : (data?.totalCategories || "12")}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: SALES OVERVIEW */}
      <div className="admin-card p-6 md:p-8 rounded-[24px] mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
          <div>
            <h3 className="text-xl font-headline font-bold text-[#171717] tracking-tight mb-1">Production Velocity</h3>
            <p className="text-sm text-[#77736E]">Daily product creation count for the current cycle.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E4DED6]">
              <span className="w-2 h-2 rounded-full bg-[#C9A77A]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5a53]">Generated Items</span>
            </div>
          </div>
        </div>
        <div className="admin-section rounded-[18px] p-4 md:p-5">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A77A" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#C9A77A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DED6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77736E', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77736E', fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E4DED6', boxShadow: '0 12px 32px rgba(23,23,23,0.1)', backgroundColor: '#FFFFFF', padding: '12px 18px' }}
                  cursor={{ stroke: '#C9A77A', strokeWidth: 1, strokeDasharray: '4 4' }}
                  labelStyle={{ fontWeight: 800, color: '#77736E', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.2px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 800, color: '#171717' }}
                />
                <Area type="monotone" dataKey="products" stroke="#171717" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 5, fill: '#171717', stroke: '#FAF8F5', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM: TOP SELLING PRODUCTS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-headline font-bold text-[#171717] tracking-tight">Top Selling Products</h3>
          <Link to="/admin/products" className="text-[10px] font-bold uppercase tracking-widest text-[#171717] border-b border-[#171717] pb-0.5 hover:text-[#8A6D3F] hover:border-[#C9A77A] transition-colors">View All Archive</Link>
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 gap-5 no-scrollbar">
          {data?.topSellingProducts?.length > 0 ? (
            data.topSellingProducts.map((product, index) => (
              <div key={product.id || index} className="flex-none w-72 snap-start group cursor-pointer relative overflow-hidden bg-white border border-[#E4DED6] p-3 rounded-2xl shadow-[0_2px_12px_rgba(23,23,23,0.03)] hover:shadow-[0_14px_32px_rgba(23,23,23,0.08)] hover:-translate-y-1 transition-all duration-300 z-10">
                <div className="relative aspect-[4/5] bg-[#FAF8F5] rounded-xl mb-4 overflow-hidden border border-[#EFEAE2]">
                  <img
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={getFinalImageUrl(product.imageUrl)}
                  />
                  {index < 3 && (
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 ${index === 0 ? 'bg-[#171717] text-white border-[#171717]' : 'bg-white/95 text-[#171717] border-[#E4DED6]'} border text-[9px] font-bold uppercase tracking-wider rounded-full shadow-xs`}>
                        {index === 0 ? 'Top' : 'Trending'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-2 pb-2">
                  <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-widest mb-1">{product.category}</p>
                  <h4 className="text-lg font-headline font-bold text-[#171717] leading-tight mb-1 group-hover:underline underline-offset-4 decoration-1">{product.name}</h4>
                  <p className="text-sm font-semibold text-[#5f5a53]">{product.totalSales} Sales</p>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#E4DED6]">
              <p className="text-[#77736E] font-medium">No sales data available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contextual FAB (Only on relevant screens) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#171717] text-white rounded-full flex items-center justify-center shadow-[0_10px_28px_rgba(23,23,23,0.22)] hover:bg-[#292929] hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
};
