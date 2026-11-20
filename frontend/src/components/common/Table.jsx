import { Spinner } from "./Spinner";
import { EmptyState } from "./EmptyState";
import { Edit2, Trash2, Eye } from "lucide-react";

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  onEdit = null,
  onDelete = null,
  onView = null,
  emptyMessage = "No data found",
  dark,
}) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  if (loading) {
    return (
      <div className={`${isDark ? "bg-[#141414] border-white/[0.08]" : "admin-card"} rounded-[22px] border p-12`}>
        <Spinner dark={isDark} color={isDark ? undefined : "black"} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`${isDark ? "bg-[#141414] border-white/[0.08]" : "admin-card"} rounded-[22px] border`}>
        <EmptyState dark={isDark} title={emptyMessage} description="Try adjusting your filters or search terms." />
      </div>
    );
  }

  return (
    <div className={`${isDark ? "bg-[#141414] border-white/[0.08] selection:bg-white selection:text-black" : "admin-card selection:bg-[#171717] selection:text-white"} rounded-[22px] border overflow-hidden`}>
      <div className={`overflow-x-auto custom-scrollbar ${isDark ? "custom-scrollbar-dark" : ""}`}>
        <table className="w-full">
          <thead className={`${isDark ? "bg-[#191919] border-b border-white/[0.07]" : "admin-table-header border-b border-[#E4DED6]"}`}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-[10px] font-bold font-headline uppercase tracking-[0.16em] whitespace-nowrap ${isDark ? "text-neutral-400" : "text-[#5f5a53]"}`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className={`px-6 py-4 text-right text-[10px] font-bold font-headline uppercase tracking-[0.16em] ${isDark ? "text-neutral-400" : "text-[#5f5a53]"}`}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody className={`font-body text-[13px] font-medium ${isDark ? "text-neutral-200 divide-y divide-white/[0.05]" : "text-[#171717] divide-y divide-[#EFEAE2]"}`}>
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className={
                  isDark
                    ? "hover:bg-white/[0.03] transition-colors"
                    : "hover:bg-[#FAF8F5] transition-colors"
                }
              >
                {columns.map((col) => (
                  <td key={`${rowIdx}-${col.key}`} className={`px-6 py-4 text-sm ${isDark ? "text-neutral-200" : "text-[#292929]"}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete || onView) && (
                  <td className={`px-6 py-4 text-sm ${isDark ? "text-neutral-200" : "text-[#292929]"}`}>
                    <div className="flex gap-1.5 justify-end">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className={isDark ? "h-8 w-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" : "h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-all"}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className={isDark ? "h-8 w-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" : "h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#F1ECE5] hover:border-[#D6CDBF] transition-all"}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className={isDark ? "h-8 w-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" : "h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#E4DED6] text-[#292929] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
