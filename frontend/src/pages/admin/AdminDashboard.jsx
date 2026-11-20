import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { dashboardService } from "../../services";
import { AdminPageSkeleton } from "../../components/common/AdminPageSkeleton";
import { formatPrice } from "../../utils/formatters";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getAdminOverallData()
      .then((res) => {
        setData(res.data.data);
      })
      .catch((error) => {
        console.error("Failed to fetch admin dashboard data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <AdminPageSkeleton dark={false} />;

  const { metrics, revenueChart, recentActivities } = data || {};

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in">
      {/* Top Action Bar (Platform status & Refresh control) */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <div className="h-11 px-5 admin-card rounded-2xl flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[12px] font-headline font-bold text-[#171717] uppercase tracking-widest">Platform Live</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          title="Refresh System Metrics"
          className="h-11 px-5 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-headline font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(23,23,23,0.18)] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/60"
        >
          <span className="material-symbols-outlined text-[19px]">refresh</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Primary KPI Grid (Revenue, Orders, Products, Users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="admin-card rounded-[22px] p-5 group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Gross
            </span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1.5 relative z-10">
            <h3 className="text-[#77736E] text-[10px] font-bold uppercase tracking-[0.16em] leading-none">Net Revenue</h3>
            <p className="text-[22px] xl:text-[24px] font-headline font-extrabold text-[#171717] tracking-tight leading-none truncate">
              {formatPrice(metrics?.sales?.totalRevenue || 0)}
            </p>
          </div>
        </div>

        {/* Sales Volume */}
        <div className="admin-card rounded-[22px] p-5 group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape-alt absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
              Orders
            </span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1.5 relative z-10">
            <h3 className="text-[#77736E] text-[10px] font-bold uppercase tracking-[0.16em] leading-none">Total Orders</h3>
            <p className="text-[22px] xl:text-[24px] font-headline font-extrabold text-[#171717] tracking-tight leading-none">
              {metrics?.sales?.totalOrders?.toLocaleString() || "0"}
            </p>
          </div>
        </div>

        {/* Inventory Check */}
        <div className="admin-card rounded-[22px] p-5 group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
            {metrics?.inventory?.lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {metrics.inventory.lowStockCount} Low
              </span>
            )}
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1.5 relative z-10">
            <h3 className="text-[#77736E] text-[10px] font-bold uppercase tracking-[0.16em] leading-none">Products Live</h3>
            <p className="text-[22px] xl:text-[24px] font-headline font-extrabold text-[#171717] tracking-tight leading-none">
              {metrics?.inventory?.totalProducts?.toLocaleString() || "0"}
            </p>
          </div>
        </div>

        {/* User Statistics */}
        <div className="admin-card rounded-[22px] p-5 group flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="admin-organic-shape-alt absolute -top-10 -right-10 w-28 h-28 bg-[#F4EDE3]/60 opacity-75" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] border border-[#E4DED6] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1ECE5] border border-[#E4DED6] text-[#292929] text-[10px] font-mono font-semibold uppercase tracking-wider">
              Active
            </span>
          </div>
          <div className="mt-5 admin-section rounded-[16px] p-4 space-y-1.5 relative z-10">
            <h3 className="text-[#77736E] text-[10px] font-bold uppercase tracking-[0.16em] leading-none">Total Users</h3>
            <p className="text-[22px] xl:text-[24px] font-headline font-extrabold text-[#171717] tracking-tight leading-none">
              {metrics?.platform?.totalUsers?.toLocaleString() || "0"}
            </p>
          </div>
        </div>
      </div>

      {/* Centerpiece Analysis: Revenue Velocity & High-Level Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart */}
        <div className="lg:col-span-2 admin-card rounded-[24px] p-6 md:p-7 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[19px] font-headline font-bold text-[#171717] leading-tight tracking-tight">Revenue Velocity</h3>
              <p className="text-[11px] text-[#77736E] font-bold uppercase tracking-[0.16em] mt-1">Daily gross revenue trend</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E4DED6] self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#C9A77A]"></span>
              <span className="text-[10px] font-bold text-[#5f5a53] uppercase tracking-widest">7-Day Cycle</span>
            </div>
          </div>

          <div className="admin-section rounded-[18px] p-4 md:p-5 mt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A77A" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#C9A77A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DED6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#77736E' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#77736E' }}
                    tickFormatter={(val) => `LKR ${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #E4DED6',
                      boxShadow: '0 12px 32px rgba(23,23,23,0.1)',
                      padding: '12px 18px',
                      backgroundColor: '#FFFFFF',
                    }}
                    itemStyle={{ fontSize: '14px', fontWeight: 800, color: '#171717' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '4px', color: '#77736E' }}
                    cursor={{ stroke: '#C9A77A', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value) => [formatPrice(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#171717"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 5, fill: '#171717', stroke: '#FAF8F5', strokeWidth: 2 }}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side Panel: Departments Overview */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Marketplace Health */}
          <div className="admin-card rounded-[24px] p-6 flex-1 relative overflow-hidden">
            <div aria-hidden="true" className="admin-organic-shape absolute -bottom-12 -right-12 w-40 h-40 bg-[#F4EDE3]/60 opacity-75" />
            <h3 className="relative z-10 text-[12px] font-headline font-bold text-[#171717] border-b border-[#EFEAE2] pb-4 uppercase tracking-[0.18em] mb-4">Ecosystem Pulse</h3>

            <div className="space-y-3 relative z-10">
              {/* Reviews */}
              <div className="flex items-center justify-between p-3.5 rounded-[16px] admin-section hover:border-[#D6CDBF] transition-all group cursor-default">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined text-[18px]">star</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-headline font-bold text-[#171717] leading-none">Reviews</p>
                    <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-wider mt-1">{metrics?.engagement?.totalReviews} Submissions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-headline font-extrabold text-[#171717]">{metrics?.engagement?.avgRating?.toFixed(1) || "0.0"}</p>
                  <p className="text-[9px] text-[#8a857d] uppercase tracking-widest font-bold">Score</p>
                </div>
              </div>

              {/* Loyalty */}
              <div className="flex items-center justify-between p-3.5 rounded-[16px] admin-section hover:border-[#D6CDBF] transition-all group cursor-default">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                    <span className="material-symbols-outlined text-[18px]">redeem</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-headline font-bold text-[#171717] leading-none">Loyalty</p>
                    <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-wider mt-1">{metrics?.marketing?.activeCoupons} Coupons</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-headline font-extrabold text-[#171717]">{metrics?.marketing?.netLoyaltyPoints?.toLocaleString()}</p>
                  <p className="text-[9px] text-[#8a857d] uppercase tracking-widest font-bold">Points</p>
                </div>
              </div>

              {/* Logistics */}
              <div className="flex items-center justify-between p-3.5 rounded-[16px] admin-section hover:border-[#D6CDBF] transition-all group cursor-default">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-headline font-bold text-[#171717] leading-none">Logistics</p>
                    <p className="text-[10px] text-[#77736E] font-bold uppercase tracking-wider mt-1">{metrics?.platform?.totalSuppliers} Partners</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-headline font-extrabold text-[#171717]">{metrics?.sales?.pendingReturns}</p>
                  <p className="text-[9px] text-[#8a857d] uppercase tracking-widest font-bold">Returns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="admin-card rounded-[24px] p-5 relative overflow-hidden">
            <div className="admin-header-gradient rounded-[16px] p-4 relative overflow-hidden">
              <div aria-hidden="true" className="admin-organic-shape absolute -top-8 -right-8 w-28 h-28 bg-white/45" />
              <h4 className="relative z-10 text-[10px] font-bold text-[#77736E] uppercase tracking-[0.2em] mb-3">Operations</h4>
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-headline font-extrabold text-[#171717] leading-none">{metrics?.platform?.staffCount}</p>
                  <p className="text-[10px] font-bold text-[#77736E] uppercase tracking-widest mt-1.5">Staff Members</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#171717] flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-[19px]">badge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="admin-card rounded-[24px] overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-[#EFEAE2] admin-table-header flex items-center justify-between">
          <div>
            <h3 className="text-[19px] font-headline font-bold text-[#171717] tracking-tight">Audit Trail</h3>
            <p className="text-[11px] text-[#77736E] font-bold uppercase tracking-[0.18em] mt-1">Real-time system events</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-2.5">
          {recentActivities?.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 md:gap-5 p-4 rounded-[16px] bg-[#FAF8F5] border border-[#EFEAE2] hover:bg-white hover:border-[#D6CDBF] transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all border ${
                    activity.type === 'ALERT'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-[#F1ECE5] border-[#E4DED6] text-[#292929] group-hover:bg-[#171717] group-hover:text-white group-hover:border-[#171717]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {activity.type === 'ALERT' ? 'warning' : 'history_edu'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[13px] font-headline font-bold text-[#171717] uppercase tracking-tight truncate">
                      {activity.action.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-[#5f5a53] bg-white border border-[#E4DED6] px-2.5 py-0.5 rounded-md font-mono font-semibold uppercase tracking-wider shrink-0">
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#77736E] truncate font-medium">{activity.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 px-6 text-center rounded-[16px] bg-[#FAF8F5] border border-[#EFEAE2] text-[#77736E] font-medium text-[13px]">
              No system logs found for this cycle.
            </div>
          )}
        </div>

        <div className="bg-[#FAF8F5] px-6 py-4 text-center border-t border-[#EFEAE2]">
          <button className="text-[10px] font-headline font-bold text-[#77736E] hover:text-[#171717] uppercase tracking-[0.2em] transition-colors">
            View Expanded Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
