// src/pages/TasksPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "../TasksPage.css";
import { AppIcon } from "../icons"; // ✅ Iconify AppIcon
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  completeTask,
} from "../api/tasks";

/* =========================
   Helpers
   ========================= */
function normalizeDateInput(v) {
  return v ? v : null;
}

function formatDateVi(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function isOverdue(task) {
  if (task.is_completed) return false;
  if (!task.due_date) return false;
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function bangkokYMD(date = new Date()) {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysBkk(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return bangkokYMD(d);
}

/* =========================
   Inline UI Components
   ========================= */

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="md-modalBackdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="md-modal">
        <div className="md-modalHeader">
          <div className="md-modalTitle">{title}</div>
          <button className="btn btn-sm btn-ghost" type="button" onClick={onClose}>
            <AppIcon name="clear" size={18} tone="neutral" />
          </button>
        </div>
        <div className="md-modalBody">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={loading ? undefined : onCancel}>
      <div style={{ opacity: 0.92, lineHeight: 1.6 }}>{message}</div>
      <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={loading}>
          {cancelText}
        </button>
        <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={loading}>
          {loading ? "Đang xử lý..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}

function StreakWidget({ streak }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const todayDone = !!streak?.today_done;

  return (
    <div className="streak-card tz-panel" style={{ height: "100%", padding: 14 }}>
      <div className="tz-row" style={{ alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: "-0.01em", fontSize: 13.5, opacity: 0.8 }}>
            🔥 Streak
          </div>
          <div className="streak-main" style={{ marginTop: 8 }}>
            <span className="streak-count">{current}</span> ngày liên tiếp
          </div>
          <div className="streak-sub" style={{ marginTop: 6 }}>
            Kỷ lục: <b>{longest}</b> ngày
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            className="tag"
            style={{
              borderColor: todayDone ? "rgba(47,232,157,0.35)" : "rgba(255,207,90,0.35)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {todayDone ? (
                <>
                  <AppIcon name="checkCircle" size={16} tone="ok" /> Today: done
                </>
              ) : (
                <>
                  <AppIcon name="warning" size={16} tone="warn" /> Today: pending
                </>
              )}
            </span>
          </div>

          <div style={{ marginTop: 8, fontSize: 12.5, opacity: 0.75, maxWidth: 200 }}>
            {todayDone ? "Giữ phong độ nhé!" : "Làm 1 task nhỏ để giữ streak."}
          </div>
        </div>
      </div>

      {!streak ? (
        <div className="streak-warning" style={{ marginTop: 12 }}>
          ⏳ Đang tải streak...
        </div>
      ) : !todayDone ? (
        <div className="streak-warning" style={{ marginTop: 12 }}>
          ⚡ Tip: chọn 1 task “5 phút” → tick xong là streak được cứu.
        </div>
      ) : (
        <div className="streak-ok" style={{ marginTop: 12 }}>
          🎉 Nice! Hôm nay bạn đã giữ streak rồi.
        </div>
      )}
    </div>
  );
}

function TaskDrawer({ open, mode, initialValue, submitting, onSubmit, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setTitle(initialValue?.title || "");
    setDescription(initialValue?.description || "");
    setDueDate(initialValue?.due_date ? String(initialValue.due_date).slice(0, 10) : "");
  }, [open, initialValue]);

  const header = mode === "edit" ? "Chỉnh sửa task" : "Tạo task mới";
  const helper =
    mode === "edit" ? "Sửa gọn gàng thôi — đừng overthink." : "Tip: đặt task nhỏ + deadline nhẹ → dễ giữ streak.";

  const setPreset = (daysToAdd) => {
    setDueDate(addDaysBkk(daysToAdd));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const t = String(title || "").trim();
    if (!t) return setErr("Tiêu đề không được trống.");
    if (t.length < 2) return setErr("Tiêu đề tối thiểu 2 ký tự.");

    onSubmit?.({
      title: t,
      description: String(description || "").trim() || "",
      due_date: dueDate || "",
    });
  };

  return (
    <Modal
      open={open}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <AppIcon name="taskHub" size={18} tone={mode === "edit" ? "blue" : "purple"} />
          <span>{header}</span>
        </span>
      }
      onClose={submitting ? undefined : onClose}
    >
      <div className="tz-helper">{helper}</div>

      {err ? (
        <div className="alert" style={{ marginTop: 12 }}>
          {err}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div className="field">
          <label className="label">Tiêu đề</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Hoàn thành slide Outcome 1"
            autoFocus
            maxLength={80}
          />
          <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.7 }}>{title.trim().length}/80</div>
        </div>

        <div className="field">
          <label className="label">Mô tả (optional)</label>
          <textarea
            className="input tz-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Done criteria / link tài liệu / checklist..."
          />
        </div>

        <div className="field">
          <label className="label">Deadline</label>
          <div className="tz-row tz-wrap" style={{ gap: 10, alignItems: "center" }}>
            <input
              className="input input--sm"
              style={{ maxWidth: 220 }}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <button className="btn btn-sm" type="button" onClick={() => setPreset(0)}>
              <AppIcon name="today" size={16} tone="blue" /> Hôm nay
            </button>
            <button className="btn btn-sm" type="button" onClick={() => setPreset(1)}>
              <AppIcon name="calendar" size={16} tone="purple" /> Mai
            </button>
            <button className="btn btn-sm" type="button" onClick={() => setPreset(7)}>
              <AppIcon name="week" size={16} tone="pink" /> +7 ngày
            </button>

            {dueDate ? (
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => setDueDate("")}>
                <AppIcon name="clear" size={16} tone="neutral" /> Clear
              </button>
            ) : null}
          </div>

          <div style={{ marginTop: 8, fontSize: 12.5, opacity: 0.75 }}>
            Deadline giúp ưu tiên — không phải để stress.
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={submitting}>
            Huỷ
          </button>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskFilters({ value, onChange, onReset }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const apply = () => onChange?.({ ...local, page: 1 });

  const setToday = () => {
    const today = bangkokYMD();
    setLocal((p) => ({ ...p, dueFrom: today, dueTo: today }));
  };

  const setNext7Days = () => {
    const from = bangkokYMD();
    const to = addDaysBkk(6);
    setLocal((p) => ({ ...p, dueFrom: from, dueTo: to }));
  };
  
  const setLast7Days = () => {
  const to = bangkokYMD();        // hôm nay
  const from = addDaysBkk(-6);    // 7 ngày trước
  setLocal((p) => ({ ...p, dueFrom: from, dueTo: to }));
};

  const SegBtn = ({ active, children, onClick }) => (
    <button type="button" className={`tz-segBtn ${active ? "isActive" : ""}`} onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div className="tz-filterBar">
      {/* ===== Row 1: Search + Tabs + Actions ===== */}
      <div className="tz-filterRow tz-filterRow--top">
        <div className="tz-search tz-filterItem tz-filterItem--grow">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppIcon name="search" size={18} tone="neutral" />
            <input
              className="input tz-searchInput"
              placeholder="Tìm nhanh: title / keyword..."
              value={local.q}
              onChange={(e) => setLocal((p) => ({ ...p, q: e.target.value }))}
            />
          </div>
        </div>

        <div className="tz-seg tz-filterItem">
          <SegBtn active={local.status === "all"} onClick={() => setLocal((p) => ({ ...p, status: "all" }))}>
            All
          </SegBtn>
          <SegBtn active={local.status === "open"} onClick={() => setLocal((p) => ({ ...p, status: "open" }))}>
            Open
          </SegBtn>
          <SegBtn
            active={local.status === "completed"}
            onClick={() => setLocal((p) => ({ ...p, status: "completed" }))}
          >
            Done
          </SegBtn>
          <SegBtn active={local.status === "overdue"} onClick={() => setLocal((p) => ({ ...p, status: "overdue" }))}>
            Overdue
          </SegBtn>
        </div>

        <div className="tz-filterActions tz-filterItem">
          <button className="btn btn-primary" type="button" onClick={apply}>
            <AppIcon name="filter" size={16} tone="purple" /> Apply
          </button>
          <button className="btn btn-ghost" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {/* ===== Row 2: Date + Presets + Sort + Page size ===== */}
      <div className="tz-filterRow tz-filterRow--bottom">
        <div className="tz-filterGroup tz-filterItem">
          <input
            className="input input--sm"
            type="date"
            value={local.dueFrom || ""}
            onChange={(e) => setLocal((p) => ({ ...p, dueFrom: e.target.value }))}
            title="Due from"
          />
          <span style={{ opacity: 0.65 }}>→</span>
          <input
            className="input input--sm"
            type="date"
            value={local.dueTo || ""}
            onChange={(e) => setLocal((p) => ({ ...p, dueTo: e.target.value }))}
            title="Due to"
          />

          <button className="btn btn-sm" type="button" onClick={setToday}>
            <AppIcon name="today" size={16} tone="blue" /> Today
          </button>
          
          <button className="btn btn-sm" type="button" onClick={setLast7Days}>
            <AppIcon name="week" size={16} tone="neutral" /> 7 ngày trước
          </button>

          <button className="btn btn-sm" type="button" onClick={setNext7Days}>
            <AppIcon name="week" size={16} tone="pink" /> 7 ngày sau
          </button>
        </div>

        <div className="tz-filterGroup tz-filterItem">
          <select
            className="input input--sm"
            value={local.sort}
            onChange={(e) => setLocal((p) => ({ ...p, sort: e.target.value }))}
            style={{ width: 180 }}
          >
            <option value="created_desc">Newest</option>
            <option value="created_asc">Oldest</option>
            <option value="due_asc">Due soon</option>
            <option value="due_desc">Due late</option>
          </select>

          <select
            className="input input--sm"
            value={local.pageSize}
            onChange={(e) => setLocal((p) => ({ ...p, pageSize: Number(e.target.value) }))}
            style={{ width: 120 }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* =========================
   GenZ Task Card List (replaces table)
   ========================= */
function TaskList({ loading, items, onEdit, onDelete, onToggleComplete }) {
  if (loading) {
    return (
      <div className="tz-list">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="tz-card tz-skeleton">
            <div className="tz-skelLine w70" />
            <div className="tz-skelLine w95" />
            <div className="tz-skelLine w55" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="tz-list">
      {items.map((t) => {
        const overdue = isOverdue(t);
        const status = t.is_completed ? "done" : overdue ? "overdue" : "open";

        const badge = t.is_completed
          ? { text: "Done", icon: <AppIcon name="checkCircle" size={16} tone="ok" /> }
          : overdue
            ? { text: "Overdue", icon: <AppIcon name="warning" size={16} tone="danger" /> }
            : { text: "Open", icon: <AppIcon name="dot" size={12} tone="purple" /> };

        return (
          <div key={t.id} className={`tz-card tz-task ${status}`}>
            <div className="tz-taskTop">
              <label className="tz-check">
                <input
                  type="checkbox"
                  checked={!!t.is_completed}
                  disabled={!!t.is_completed}
                  onChange={() => onToggleComplete?.(t)}
                  title={t.is_completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                />
                <span className="tz-checkUI" />
              </label>

              <div className="tz-taskMeta">
                <div className={`tz-title ${t.is_completed ? "isDone" : ""}`}>{t.title}</div>

                <div className="tz-subRow">
                  <span className={`tz-pill tz-pill--${status}`}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {badge.icon} {badge.text}
                    </span>
                  </span>

                  <span className="tz-dot">•</span>

                  <span className={`tz-deadline ${overdue ? "isOverdue" : ""}`}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <AppIcon name="calendar" size={16} tone={overdue ? "danger" : "neutral"} />
                      {t.due_date ? formatDateVi(t.due_date) : "No deadline"}
                    </span>
                  </span>
                </div>

                <div className="tz-desc">
                  {t.description ? t.description : <span className="tz-muted">— Không có mô tả —</span>}
                </div>
              </div>

              <div className="tz-actions">
                <button className="btn btn-sm" type="button" onClick={() => onEdit?.(t)}>
                  <AppIcon name="edit" size={16} tone="blue" /> Edit
                </button>
                <button className="btn btn-sm btn-danger" type="button" onClick={() => onDelete?.(t)}>
                  <AppIcon name="trash" size={16} tone="danger" /> Delete
                </button>
              </div>
            </div>

            {/* micro footer */}
            <div className="tz-taskBottom">
              {overdue && !t.is_completed ? (
                <div className="tz-warnLine">⚡ Trễ hạn — ưu tiên xử lý để giữ nhịp!</div>
              ) : t.is_completed ? (
                <div className="tz-okLine">🎉 Done! Nice work.</div>
              ) : (
                <div className="tz-muted2">Tip: Thêm thời gian cho task để hiệu quả hơn!.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================
   TasksPage
   ========================= */
export default function TasksPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(null);
  

  const [filters, setFilters] = useState({
    status: "all",
    q: "",
    dueFrom: "",
    dueTo: "",
    sort: "created_desc",
    page: 1,
    pageSize: 20,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const params = useMemo(() => {
    return {
      status: filters.status,
      q: filters.q,
      dueFrom: filters.dueFrom || undefined,
      dueTo: filters.dueTo || undefined,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchTasks(params);
      setItems(data.items || []);
      setTotal(Number(data.total || 0));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch tasks";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const res = await api.get("/dashboard/basic");
      setStreak(res.data?.streak ?? null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    loadStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setDrawerMode("create");
    setSelected(null);
    setDrawerOpen(true);
  };

  const openEdit = (task) => {
    setDrawerMode("edit");
    setSelected(task);
    setDrawerOpen(true);
  };

  const onSubmitDrawer = async (values) => {
    setSubmitting(true);
    setErr("");
    try {
      if (drawerMode === "create") {
        await createTask({
          title: values.title,
          description: values.description || null,
          due_date: normalizeDateInput(values.due_date),
        });
      } else {
        await updateTask(selected.id, {
          title: values.title,
          description: values.description || null,
          due_date: normalizeDateInput(values.due_date),
        });
      }
      setDrawerOpen(false);
      await load();
      await loadStreak();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Submit failed";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleComplete = async (task) => {
    if (task.is_completed) return;

    const snapshot = items;
    setItems((prev) => prev.map((x) => (x.id === task.id ? { ...x, is_completed: true } : x)));

    try {
      const result = await completeTask(task.id);
      setItems((prev) => prev.map((x) => (x.id === task.id ? result.task : x)));
      setStreak(result.streak);
    } catch (err) {
      setItems(snapshot);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed";
      setErr(msg);
    }
  };

  const onDelete = (task) => {
    setPendingDelete({ id: task.id, title: task.title });
    setConfirmOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) return;
    setErr("");
    setDeleting(true);
    try {
      await deleteTask(pendingDelete.id);
      closeDeleteModal();
      await load();
      await loadStreak();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed";
      setErr(msg);
    } finally {
      setDeleting(false);
    }
  };

  const completedCount = items.filter((x) => x.is_completed).length;
  const openCount = items.filter((x) => !x.is_completed).length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="tasksScope tz tz-full">
      {/* Hero */}
      <div className="tz-hero">
        <div className="tz-heroLeft">
          <div className="tz-h1" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppIcon name="taskHub" size={22} tone="purple" />
            <span>
              Công việc <span className="tz-h1Sub"> tốt hơn mọi ngày</span>
            </span>
          </div>
          <div className="tz-heroMeta">
            <div className="tz-progress">
              <div className="tz-progressTop">
                <span className="tz-muted2">Tiến độ</span>
                <b>{progress}%</b>
              </div>
              <div className="tz-progressBar">
                <div className="tz-progressFill" style={{ width: `${progress}%` }} />
              </div>
              <div className="tz-muted2" style={{ marginTop: 6 }}>
                {completedCount}/{total} tasks hoàn thành
              </div>
            </div>

            <div className="tz-quick">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setFilters((p) => ({ ...p, q: "", status: "open", page: 1 }))}
              >
                <AppIcon name="focus" size={16} tone="blue" /> Focus mode
              </button>
              <button className="btn btn-primary" onClick={openCreate} type="button">
                <AppIcon name="add" size={18} tone="pink" /> Tạo task mới
              </button>
            </div>
          </div>
        </div>

        <div className="tz-heroRight">
          <div className="tz-statGrid">
            <div className="tz-stat">
              <div className="tz-statLabel">Tổng</div>
              <div className="tz-statValue mono">{total}</div>
              <div className="tz-statHint">Theo filter hiện tại</div>
            </div>

            <div className="tz-stat">
              <div className="tz-statLabel">Open</div>
              <div className="tz-statValue mono">
                <AppIcon name="dot" size={12} tone="purple" /> {openCount}
              </div>
              <div className="tz-statHint">Việc đang chờ xử lý</div>
            </div>

            <div className="tz-stat">
              <div className="tz-statLabel">Done</div>
              <div className="tz-statValue mono">
                <AppIcon name="checkCircle" size={16} tone="ok" /> {completedCount}
              </div>
              <div className="tz-statHint">Bạn đang “on fire”</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="tz-layout">
        {/* MAIN */}
        <div className="tz-main">
          <div className="tz-panel tz-filters">
            <TaskFilters
              value={filters}
              onChange={(next) => setFilters((prev) => ({ ...prev, ...next, page: 1 }))}
              onReset={() =>
                setFilters({
                  status: "all",
                  q: "",
                  dueFrom: "",
                  dueTo: "",
                  sort: "created_desc",
                  page: 1,
                  pageSize: 20,
                })
              }
            />
          </div>

          {err ? <div className="alert tz-alert">{err}</div> : null}

          {!loading && items.length === 0 ? (
            <div className="tz-empty tz-panel">
              <div className="tz-emptyEmoji">😮</div>
              <div className="tz-emptyTitle">Trống trơn luôn</div>
              <div className="tz-emptyDesc">Thử đổi filter hoặc tạo 1 task nhỏ 5 phút để “khởi động streak”.</div>
              <div className="tz-row tz-wrap" style={{ marginTop: 14, gap: 10 }}>
                <button className="btn btn-primary" type="button" onClick={openCreate}>
                  <AppIcon name="add" size={18} tone="pink" /> Tạo task đầu tiên
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, status: "all", q: "", page: 1 }))}
                >
                  Reset filter
                </button>
              </div>
            </div>
          ) : (
            <TaskList loading={loading} items={items} onEdit={openEdit} onDelete={onDelete} onToggleComplete={onToggleComplete} />
          )}
        </div>

        {/* SIDEBAR */}
        <div className="tz-side">
          <StreakWidget streak={streak} />

          <div className="tz-panel tz-tips" style={{ marginTop: 12 }}>
            <div className="tz-tipsTitle">⚡ Quick Tips</div>
            <ul className="tz-tipsList">
              <li>Chia task thành 5–15 phút để dễ bắt đầu.</li>
              <li>Deadline là “định hướng”, không phải “áp lực”.</li>
              <li>Thêm thời gian trong mô tả task để làm việc hiệu quả hơn!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="tz-fab btn btn-primary" type="button" onClick={openCreate} aria-label="Tạo task mới">
        <AppIcon name="add" size={22} tone="pink" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Xoá công việc"
        message={
          pendingDelete?.title ? `Bạn có muốn xoá task "${pendingDelete.title}" không?` : "Bạn có muốn xoá task này không?"
        }
        confirmText="Có, xoá"
        cancelText="Không"
        loading={deleting}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <TaskDrawer
        open={drawerOpen}
        mode={drawerMode}
        submitting={submitting}
        initialValue={selected}
        onClose={() => setDrawerOpen(false)}
        onSubmit={onSubmitDrawer}
      />
    </div>
  );
}
