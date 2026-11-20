import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usersService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { Badge } from "../../../components/common/Badge";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";
import { formatDate } from "../../../utils/formatters";

const PAGE_SIZE = 10;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filtered = useMemo(() => {
    const customerUsers = users.filter(
      (u) => u.role?.name?.toLowerCase() === "customer" && !u.isDeleted
    );
    return filterBySearch(customerUsers, searchTerm, ["name", "email", "phone"]);
  }, [users, searchTerm]);

  const paginated = useMemo(
    () => paginateData(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const usersRes = await usersService.getAll(0, 1000);
      setUsers(usersRes.data.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (user) => {
    setSelectedUser(user);
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    reset();
  };

  const onEditSubmit = async (data) => {
    setSaving(true);
    try {
      await usersService.update(selectedUser.id, data);
      toast.success("Customer updated successfully");
      await fetchData();
      closeEditModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (user) => {
    setDeleteTarget(user);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await usersService.delete(deleteTarget.id);
      toast.success("Customer deleted successfully");
      setUsers(users.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((u) => ({
        ...u,
        _roleName: u.role?.name || "-",
      }));

      exportTablePDF(
        "Customers Report",
        [
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Role", key: "_roleName" },
          { label: "Loyalty Points", key: "loyaltyPoints" },
          { label: "Joined", key: "createdAt", format: "date" },
        ],
        dataForPdf,
        "customers-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <Badge dark={false} color="gray">{row.role?.name || "-"}</Badge>
      ),
    },
    { key: "loyaltyPoints", label: "Loyalty Points" },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => formatDate(row.createdAt),
    },
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
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Export PDF
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="admin-card rounded-[24px] p-3">
        <SearchBar
          dark={false}
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, email, or phone..."
        />
      </div>

      <Table
        dark={false}
        columns={columns}
        data={paginated.data}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
        emptyMessage="No customers found"
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

      {/* Edit Modal */}
      <Modal
        dark={false}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Customer"
        size="lg"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-5">
          <Input
            dark={false}
            label="Full Name"
            placeholder="Enter name"
            {...register("name", { required: "Name is required" })}
            error={errors.name?.message}
          />
          <Input
            dark={false}
            label="Email"
            type="email"
            placeholder="Enter email"
            {...register("email", { 
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
            })}
            error={errors.email?.message}
          />
          <Input
            dark={false}
            label="Phone"
            placeholder="07XXXXXXXX"
            {...register("phone", { 
              required: "Phone is required",
              pattern: { value: /^(0)\d{9}$/, message: "Invalid phone number (10 digits starting with 0)" }
            })}
            error={errors.phone?.message}
            maxLength={10}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
            }}
          />

          <div className="flex gap-3 justify-end pt-5 border-t border-[#E4DED6]">
            <Button dark={false} variant="secondary" type="button" onClick={closeEditModal} disabled={saving}>
              Cancel
            </Button>
            <Button dark={false} type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently erase their account data.`}
        loading={deleteLoading}
        isDanger={true}
      />
    </div>
  );
};
