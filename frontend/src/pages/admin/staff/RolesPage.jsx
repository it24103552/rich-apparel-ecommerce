import { AdminPageSkeleton } from "../../../components/common/AdminPageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { rolesService } from "../../../services";
import { Table } from "../../../components/common/Table";
import { Modal } from "../../../components/common/Modal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { SearchBar } from "../../../components/common/SearchBar";
import { Pagination } from "../../../components/common/Pagination";
import { Spinner } from "../../../components/common/Spinner";
import { roleRules } from "../../../validations/role.validation";
import { filterBySearch, paginateData } from "../../../utils/tableHelpers";
import { exportTablePDF } from "../../../utils/pdfExport";

const PAGE_SIZE = 10;

export const RolesPage = () => {
  // Data
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedRole, setSelectedRole] = useState(null);
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
    return filterBySearch(roles, searchTerm, ["name"]);
  }, [roles, searchTerm]);

  const paginated = useMemo(() => paginateData(filtered, page, PAGE_SIZE), [filtered, page]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await rolesService.getAll(0, 1000);
        setRoles(res.data.data.roles || []);
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
    setSelectedRole(null);
    reset({
      name: "",
    });
  };

  const openEditModal = (role) => {
    setModalMode("edit");
    setSelectedRole(role);
    reset({
      name: role.name,
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRole(null);
    reset();
  };

  // Submit form
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await rolesService.create(data);
        toast.success("Role created successfully");
      } else {
        await rolesService.update(selectedRole.id, data);
        toast.success("Role updated successfully");
      }

      // Re-fetch roles
      const res = await rolesService.getAll(0, 1000);
      setRoles(res.data.data.roles || []);
      setPage(1);
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save role";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const openDeleteDialog = (role) => {
    setDeleteTarget(role);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await rolesService.delete(deleteTarget.id);
      setRoles(roles.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Role deleted successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete role";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    try {
      const dataForPdf = filtered.map((r) => ({
        ...r,
        _userCount: r.users?.length ?? 0,
      }));

      exportTablePDF(
        "Roles Report",
        [
          { label: "Role Name", key: "name" },
          { label: "Users", key: "_userCount" },
        ],
        dataForPdf,
        "roles-report"
      );
    } catch (err) {
      alert("Failed to export PDF");
    }
  };

  // Table columns
  const columns = [
    { key: "name", label: "Role Name" },
    {
      key: "users",
      label: "Users",
      render: (row) => row.users?.length ?? 0,
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
            <span>Add Role</span>
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
          placeholder="Search by role name..."
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
        emptyMessage="No roles found"
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
        title={modalMode === "create" ? "Add Role" : "Edit Role"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            dark={false}
            label="Role Name"
            placeholder="Enter role name"
            {...register("name", roleRules.name)}
            error={errors.name?.message}
          />

          <div className="flex gap-3 justify-end pt-5 border-t border-[#E4DED6]">
            <Button dark={false} variant="secondary" type="button" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button dark={false} type="submit" loading={saving}>
              {modalMode === "create" ? "Create Role" : "Update Role"}
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
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
        isDanger={true}
      />
    </div>
  );
};
