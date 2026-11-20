import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { staffService, rolesService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { Select } from "../../../components/common/Select";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { staffRules } from "../../../validations/staff.validation";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";

const PAGE_SIZE = 10;

export const StaffPage = () => {
  // Data
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  // Computed data
  const filtered = useMemo(() => {
    return filterBySearch(staff, searchTerm, ["name", "email"]);
  }, [staff, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [staffRes, rolesRes] = await Promise.all([
          staffService.getAll(0, 1000),
          rolesService.getAll(0, 1000),
        ]);

        setStaff(staffRes.data.data.staff || []);
        setRoles(rolesRes.data.data.roles.filter((role) => role.name !== "Customer") || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Modal handlers
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedStaff(null);
    reset({
      name: "",
      email: "",
      roleId: "",
    });
  };

  const openEditModal = (staffMember) => {
    setModalMode("edit");
    setSelectedStaff(staffMember);
    reset({
      name: staffMember.name,
      email: staffMember.email,
      roleId: staffMember.roleId,
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedStaff(null);
    reset();
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await staffService.create(data);
        toast.success("Staff member created successfully");
      } else {
        await staffService.update(selectedStaff.id, data);
        toast.success("Staff member updated successfully");
      }

      // Re-fetch staff
      const res = await staffService.getAll(0, 1000);
      setStaff(res.data.data.staff || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save staff";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const openDeleteDialog = (staffMember) => {
    setDeleteTarget(staffMember);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await staffService.delete(deleteTarget.id);
      setStaff(staff.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Staff member deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete staff";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((s) => ({
        ...s,
        _roleName: roles.find((r) => r.id === s.roleId)?.name || "-",
      }));

      exportTablePDF(
        "Staff Report",
        [
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Role", key: "_roleName" },
        ],
        dataForPdf,
        "staff-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  // Table columns
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "roleId",
      label: "Role",
      render: (row) => roles.find((r) => r.id === row.roleId)?.name || "-",
    },
  ];

  if (loading) {
    return <AdminPageSkeleton dark={false} />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-end pt-1">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleExportPDF}
            className="h-11 px-6 rounded-2xl bg-white hover:bg-[#F1ECE5] text-[#171717] font-semibold font-headline text-[13px] transition-all border border-[#171717]/80 active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={openCreateModal}
            className="h-11 px-7 rounded-2xl bg-[#171717] hover:bg-[#292929] text-white font-semibold font-headline text-[13px] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/70 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] font-semibold">add</span>
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-card rounded-[24px] p-3">
        <SearchBar
          dark={false}
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name or email..."
        />
      </div>

      {/* Table */}
      <Table
        dark={false}
        columns={columns}
        data={paginated.data}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
        emptyMessage="No staff found"
      />

      {/* Pagination */}
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

      {/* Create/Edit Modal */}
      <Modal
        dark={false}
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === "create" ? "Add Staff" : "Edit Staff"}
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            dark={false}
            label="Name"
            placeholder="Enter staff name"
            {...register("name", staffRules.name)}
            error={errors.name?.message}
          />

          <Input
            dark={false}
            label="Email"
            type="email"
            placeholder="Enter email address"
            {...register("email", staffRules.email)}
            error={errors.email?.message}
          />

          <Select
            dark={false}
            label="Role"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            {...register("roleId", staffRules.roleId)}
            error={errors.roleId?.message}
          />

          <div className="flex gap-3 justify-end pt-5 border-t border-[#E4DED6]">
            <Button dark={false} variant="secondary" type="button" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button dark={false} type="submit" loading={saving}>
              {modalMode === "create" ? "Create Staff" : "Update Staff"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        dark={false}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Staff"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
        isDanger={true}
      />
    </div>
  );
};
