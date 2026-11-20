import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { reviewsService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Spinner } from "../../../components/common/Spinner";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatDate, truncate } from "../../../utils/formatters";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { Star, MessageSquare } from "lucide-react";

import { resolveImageUrl } from "../../../utils/imageHelpers";

const PAGE_SIZE = 10;


const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating
            ? "fill-[#C9A77A] text-[#C9A77A]"
            : "text-[#DDD5C9]"
          }`}
      />
    ))}
  </div>
);

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reviewsService.getAll(0, 1000);
      setReviews(res.data.data.reviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  // Search filters by user name or product name
  const filtered = useMemo(() => {
    return filterBySearch(reviews, searchTerm, ["user.name", "product.name", "comment"]);
  }, [reviews, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => row.user?.name || "Unknown",
    },
    {
      key: "product",
      label: "Product",
      render: (row) => row.product?.name || "Unknown",
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => <StarRating rating={row.rating} />,
    },
    {
      key: "comment",
      label: "Comment",
      render: (row) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#77736E] flex-shrink-0" />
          <span className="text-sm text-[#292929]">{truncate(row.comment, 60)}</span>
        </div>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (row) => {
        if (!row.imageUrl) return <span className="text-[#9d978f]">–</span>;
        const fullUrl = resolveImageUrl(row.imageUrl);

        return (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <img
              src={fullUrl}
              alt="Review"
              className="h-10 w-10 object-cover rounded-lg cursor-pointer border border-[#E4DED6] shadow-2xs"
            />
          </a>
        );
      }
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.createdAt || new Date()),
    },
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

      {/* Toolbar */}
      <div className="admin-card rounded-[24px] p-3">
        <SearchBar dark={false} value={searchTerm} onChange={setSearchTerm} placeholder="Search by user, product, or comment..." />
      </div>

      {/* Reviews Table or Empty State */}
      {reviews.length === 0 ? (
        <div className="admin-card rounded-[24px]">
          <EmptyState
            dark={false}
            title="No reviews yet"
            description="Reviews from customers will appear here once they're submitted."
          />
        </div>
      ) : (
        <>
          <Table
            dark={false}
            columns={columns}
            data={paginated.data}
            loading={loading}
            emptyMessage="No reviews found"
          />

          {/* Pagination */}
          {paginated.pages > 1 && (
            <div className="pt-2">
              <Pagination dark={false} currentPage={page} totalPages={paginated.pages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
