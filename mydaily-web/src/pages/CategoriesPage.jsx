import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../api/category";
import { AppIcon } from "../icons"; // ✅ NEW
import "../CategoriesPage.css";

function CategoryForm({ mode, initialValue, submitting, onSubmit, onCancel }) {
  const [name, setName] = useState(initialValue?.name || "");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(initialValue?.name || "");
    setErr("");
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const v = String(name || "").trim();
    if (!v) return setErr("Tên category không được để trống.");
    if (v.length < 2) return setErr("Tên category phải >= 2 ký tự.");

    onSubmit?.({ name: v });
  };

  return (
    <form onSubmit={handleSubmit} className="catForm">
      <div className="catField">
        <label className="catLabel">Tên loại chi phí</label>
        <input
          className="catInput"
          placeholder="Ví dụ: Food, Transport, Bills..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="catHint">Gợi ý: dùng tên ngắn, nhất quán để báo cáo đẹp hơn.</div>
      </div>

      {err ? <div className="catAlert catAlert--danger">{err}</div> : null}

      <div className="catForm__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>
          Hủy
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Saving…" : mode === "edit" ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}

function Pill({ tone = "neutral", children }) {
  return <span className={`catPill catPill--${tone}`}>{children}</span>;
}

function EmptyState({ onCreate }) {
  return (
    <div className="catEmpty">
      <div className="catEmpty__icon">
        <AppIcon name="categories" size={26} />
      </div>
      <div className="catEmpty__title">Chưa có danh mục</div>
      <div className="catEmpty__subtitle">Tạo category mới để nhập chi tiêu nhanh hơn và báo cáo chính xác hơn.</div>
      <button className="btn btn--primary" type="button" onClick={onCreate}>
        <AppIcon name="add" size={16} /> Thêm danh mục đầu tiên
      </button>
    </div>
  );
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((c) => String(c.name || "").toLowerCase().includes(query));
  }, [items, q]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCategories();
      setItems(data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load categories.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (cat) => {
    setMode("edit");
    setEditing(cat);
    setOpen(true);
  };

  const onSave = async (payload) => {
    setSubmitting(true);
    setError("");
    try {
      if (mode === "edit" && editing?.id) {
        const updated = await updateCategory(editing.id, payload);
        setItems((prev) => prev.map((x) => (x.id === editing.id ? updated : x)));
      } else {
        const created = await createCategory(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Save category failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (cat) => {
    setPendingDelete({ id: cat.id, name: cat.name });
    setConfirmOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) return;

    setError("");
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      setItems((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      closeDeleteModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete category failed.";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="catPage">
      <div className="dashContainer catContainer">
        {/* Header */}
        <div className="dashHeader catHeader">
          <div className="dashHeader__greeting">
            <div className="dashHeader__wave">🗂️</div>
            <div>
              <div className="dashHeader__title">Danh mục</div>
              <div className="dashHeader__subtitle">
                Quản lý danh mục chi tiêu để nhập liệu nhanh và báo cáo chính xác.
              </div>
            </div>
          </div>

          <div className="catHeader__actions">
            <button className="btn btn--secondary" onClick={load} disabled={loading} type="button">
              <AppIcon name="reload" size={16} /> Tải lại
            </button>
            <button className="btn btn--primary" onClick={openCreate} type="button">
              <AppIcon name="add" size={16} /> Thêm mới
            </button>
          </div>
        </div>

        {error ? <div className="catAlert catAlert--danger">{error}</div> : null}

        {/* KPI + Search */}
        <div className="catTopGrid">
          <div className="catKpi catKpi--purple">
            <div className="catKpi__label">Tổng danh mục</div>
            <div className="catKpi__value">{items.length}</div>
            <div className="catKpi__hint">Số category đang có</div>
          </div>

          <div className="catKpi catKpi--pink">
            <div className="catKpi__label">Khớp tìm kiếm</div>
            <div className="catKpi__value">{filtered.length}</div>
            <div className="catKpi__hint">Theo từ khóa hiện tại</div>
          </div>

          <div className="catSearchCard">
            <div className="catSearchCard__head">
              <div className="catSearchCard__title">
                <AppIcon name="search" size={18} /> Tìm nhanh
              </div>
              <Pill tone={q.trim() ? "ok" : "neutral"}>{q.trim() ? "Filtering" : "All"}</Pill>
            </div>

            <div className="catSearchRow">
              <input
                className="catSearchInput"
                placeholder="Tìm theo tên category…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setQ("")}
                disabled={!q.trim()}
              >
                <AppIcon name="clear" size={16} /> Xóa
              </button>
            </div>

            <div className="catSearchHint">
              Tip: đặt tên ngắn như <b>Food</b>, <b>Rent</b>, <b>Transport</b> để biểu đồ đẹp và dễ đọc.
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="catLoading">
            <div className="skeleton skeleton--hero" />
            <div className="catLoading__grid">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <div className="catTableCard">
            <div className="catTableCard__head">
              <div>
                <div className="catTableCard__title">
                  <AppIcon name="pin" size={18} /> Danh sách danh mục
                </div>
                <div className="catTableCard__sub">Chỉnh sửa / xoá để giữ dữ liệu gọn và chuẩn.</div>
              </div>
              <div className="catTableCard__meta">
                <Pill tone="neutral">Total: {items.length}</Pill>
                <Pill tone="ok">Match: {filtered.length}</Pill>
              </div>
            </div>

            <div className="catTableWrap">
              <table className="catTable">
                <thead>
                  <tr>
                    <th>Tên loại chi phí</th>
                    <th style={{ width: 220, textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="catNameCell">
                        <span className="catName">{c.name}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="catRowActions">
                          <button className="btn btn--secondary catBtnSm" onClick={() => openEdit(c)} type="button">
                            <AppIcon name="edit" size={16} /> Chỉnh sửa
                          </button>
                          <button className="btn btn--danger catBtnSm" onClick={() => onDelete(c)} type="button">
                            <AppIcon name="delete" size={16} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="catTableFooter">
              <div className="catFooterHint">
                <AppIcon name="sparkles" size={16} /> Gợi ý: tránh tạo trùng tên để báo cáo không bị “loãng”.
              </div>
              <button className="btn btn--primary" type="button" onClick={openCreate}>
                <AppIcon name="add" size={16} /> Thêm mới
              </button>
            </div>
          </div>
        )}

        {/* Create/Edit modal */}
        <Modal
          open={open}
          title={mode === "edit" ? "Edit category" : "Thêm danh mục"}
          onClose={() => (submitting ? null : setOpen(false))}
        >
          <CategoryForm
            mode={mode}
            initialValue={editing}
            submitting={submitting}
            onSubmit={onSave}
            onCancel={() => setOpen(false)}
          />
        </Modal>

        {/* Confirm delete modal */}
        <ConfirmDialog
          open={confirmOpen}
          title="Xoá danh mục"
          message={
            pendingDelete?.name
              ? `Bạn có muốn xoá category "${pendingDelete.name}" không?`
              : "Bạn có muốn xoá category này không?"
          }
          confirmText="Có, xoá"
          cancelText="Không"
          loading={deleting}
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
