/**
 * Route-aware, layout-preserving skeleton components for the Rich Apparel customer storefront.
 * All skeletons render inline on light surfaces (#fafafa / #ffffff) without blocking or blurring
 * the viewport or navigation bar.
 */

export const OrdersGridSkeleton = () => (
  <div aria-busy="true" aria-label="Loading orders">
    {/* Summary Stats Strip */}
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#e9e1d6] px-4 sm:px-5 py-4 shadow-[0_2px_10px_rgba(32,25,18,0.03)] flex items-center justify-between"
        >
          <div>
            <div className="skeleton-box h-2.5 w-20 rounded mb-2.5" />
            <div className="skeleton-box h-7 w-12 rounded-md" />
          </div>
          <div className="hidden sm:block skeleton-box w-10 h-10 rounded-xl" />
        </div>
      ))}
    </div>

    {/* Section Label */}
    <div className="flex items-center justify-between mb-4">
      <div className="skeleton-box h-3 w-28 rounded" />
      <div className="skeleton-box h-2.5 w-24 rounded" />
    </div>

    {/* Wide Order History Card Skeletons */}
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden"
        >
          {/* Card Header Bar */}
          <div className="px-5 sm:px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center justify-between">
            <div className="skeleton-box h-4 w-28 rounded" />
            <div className="flex items-center gap-3">
              <div className="skeleton-box h-3.5 w-24 rounded" />
              <div className="skeleton-box h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Product Summary Row */}
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="skeleton-box w-[96px] h-[112px] sm:w-[124px] sm:h-[136px] rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton-box h-5 w-2/3 rounded" />
              <div className="skeleton-box h-3.5 w-1/3 rounded" />
              <div className="pt-3 border-t border-[#f2ece3] flex items-center gap-5">
                <div className="skeleton-box h-3 w-16 rounded" />
                <div className="skeleton-box h-3 w-28 rounded" />
              </div>
            </div>
            <div className="sm:pl-6 sm:border-l sm:border-[#f0e9df] space-y-2 sm:text-right">
              <div className="skeleton-box h-2.5 w-20 rounded sm:ml-auto" />
              <div className="skeleton-box h-6 w-28 rounded sm:ml-auto" />
            </div>
          </div>

          {/* Delivery Progress Bar */}
          <div className="px-5 sm:px-6 py-4 bg-[#fcfaf7] border-t border-[#f0e9df]">
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="skeleton-box w-5 h-5 rounded-full shrink-0" />
                  <div className="skeleton-box h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#efe8de] flex items-center justify-between">
            <div className="skeleton-box h-3 w-44 rounded" />
            <div className="flex items-center gap-2.5">
              <div className="skeleton-box h-10 w-32 rounded-xl" />
              <div className="skeleton-box h-10 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const OrderDetailsSkeleton = () => (
  <div
    className="min-h-screen bg-[#fafafa]"
    style={{ fontFamily: "'Montserrat', sans-serif" }}
    aria-busy="true"
    aria-label="Loading order details"
  >
    <div className="max-w-[1320px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">
      {/* Back & Breadcrumb Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="skeleton-box h-9 w-36 rounded-full" />
        <div className="hidden sm:block skeleton-box h-3 w-48 rounded" />
      </div>

      {/* Order Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-8 border-b border-neutral-200/70">
        <div className="flex items-start gap-4">
          <div className="w-1.5 h-10 md:h-12 bg-neutral-200 rounded-full mt-1 shrink-0" />
          <div>
            <div className="skeleton-box h-9 w-56 rounded-lg mb-2.5" />
            <div className="skeleton-box h-3 w-48 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="skeleton-box h-8 w-24 rounded-full" />
          <div className="skeleton-box h-10 w-36 rounded-full" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Order Items (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-100">
              <div className="skeleton-box h-3.5 w-28 rounded" />
              <div className="skeleton-box h-3 w-16 rounded" />
            </div>
            <div className="divide-y divide-neutral-100 px-6">
              {[0, 1].map((i) => (
                <div key={i} className="py-5 flex items-center gap-5">
                  <div className="skeleton-box w-16 h-20 sm:w-20 sm:h-24 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton-box h-4 w-2/3 rounded" />
                    <div className="skeleton-box h-3 w-1/3 rounded" />
                    <div className="skeleton-box h-4 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary & Delivery (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="skeleton-box h-4 w-32 rounded mb-4" />
            <div className="skeleton-box h-3 w-full rounded" />
            <div className="skeleton-box h-3 w-5/6 rounded" />
            <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
              <div className="skeleton-box h-4 w-20 rounded" />
              <div className="skeleton-box h-6 w-28 rounded" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-3">
            <div className="skeleton-box h-4 w-36 rounded mb-2" />
            <div className="skeleton-box h-3 w-3/4 rounded" />
            <div className="skeleton-box h-3 w-1/2 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CartSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" aria-busy="true" aria-label="Loading shopping bag">
    <div className="lg:col-span-8 space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="skeleton-box w-24 h-28 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton-box h-5 w-1/2 rounded" />
              <div className="skeleton-box h-4 w-1/3 rounded" />
              <div className="skeleton-box h-6 w-28 rounded" />
            </div>
            <div className="flex sm:flex-col items-end justify-between gap-4">
              <div className="skeleton-box h-10 w-28 rounded-xl" />
              <div className="skeleton-box h-7 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="lg:col-span-4">
      <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-7 space-y-5">
        <div className="skeleton-box h-5 w-36 rounded" />
        <div className="space-y-3 py-4 border-y border-neutral-100">
          <div className="skeleton-box h-3.5 w-full rounded" />
          <div className="skeleton-box h-3.5 w-full rounded" />
        </div>
        <div className="skeleton-box h-8 w-1/2 rounded ml-auto" />
        <div className="skeleton-box h-12 w-full rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div
    className="bg-white min-h-screen pt-8 md:pt-12 pb-24"
    style={{ fontFamily: "'Montserrat', sans-serif" }}
    aria-busy="true"
    aria-label="Loading product"
  >
    <div className="max-w-[1400px] mx-auto px-[5%] lg:px-[6%]">
      {/* Breadcrumb */}
      <div className="skeleton-box h-3 w-48 rounded mb-8 md:mb-10" />

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 xl:gap-16 items-start">
        {/* Left: Gallery */}
        <div className="w-full lg:w-[54%] xl:w-[52%]">
          <div className="flex flex-col md:flex-row gap-3.5 md:gap-4">
            <div className="order-2 md:order-1 flex md:flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-box w-16 sm:w-20 aspect-[4/5] rounded-xl shrink-0" />
              ))}
            </div>
            <div className="order-1 md:order-2 flex-1 aspect-[4/5] max-h-[680px] rounded-2xl overflow-hidden border border-neutral-100">
              <div className="skeleton-box w-full h-full" />
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="w-full lg:w-[46%] xl:w-[48%] space-y-6 pt-2">
          <div className="skeleton-box h-3 w-24 rounded" />
          <div className="skeleton-box h-10 w-3/4 rounded-lg" />
          <div className="skeleton-box h-8 w-36 rounded-lg" />
          <div className="space-y-2.5 pt-4 border-t border-neutral-100">
            <div className="skeleton-box h-3 w-full rounded" />
            <div className="skeleton-box h-3 w-5/6 rounded" />
            <div className="skeleton-box h-3 w-2/3 rounded" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="skeleton-box h-3 w-20 rounded" />
            <div className="flex gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-box h-11 w-16 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="pt-4">
            <div className="skeleton-box h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div
    className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10"
    aria-busy="true"
    aria-label="Loading products"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col"
      >
        <div className="skeleton-box aspect-[4/5] w-full" />
        <div className="p-4 space-y-2.5">
          <div className="skeleton-box h-2.5 w-16 rounded" />
          <div className="skeleton-box h-4 w-3/4 rounded" />
          <div className="skeleton-box h-4 w-1/2 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const NewArrivalsSkeleton = () => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5"
    aria-busy="true"
    aria-label="Loading new arrivals"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-[#fcfaf7] rounded-[16px] border border-[#ebe4da] shadow-[0_2px_10px_rgba(32,25,18,0.035)] overflow-hidden flex flex-col p-2"
      >
        <div className="skeleton-box rounded-[11px] aspect-square w-full" />
        <div className="pt-2.5 px-1 pb-0.5 space-y-2">
          <div className="skeleton-box h-3.5 w-4/5 rounded" />
          <div className="skeleton-box h-3 w-1/3 rounded" />
          <div className="skeleton-box h-4 w-1/2 rounded" />
          <div className="skeleton-box h-8 w-full rounded-[10px] mt-1.5" />
        </div>
      </div>
    ))}
  </div>
);
