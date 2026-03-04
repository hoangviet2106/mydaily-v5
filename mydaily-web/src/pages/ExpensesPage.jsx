import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { fetchCategories, createCategory } from "../api/category";
import { fetchBudgetByMonthYear } from "../api/budgets"; // ✅ NEW
import { createExpense, deleteExpense, fetchExpenses, updateExpense } from "../api/expenses";
import { AppIcon } from "../icons";
import "../ExpensesPage.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthStartYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}
function formatMoney(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("vi-VN");
}
function toMonthYear(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/* ======================= UI bits ======================= */
function Pill({ tone = "neutral", children }) {
  return <span className={`exPill exPill--${tone}`}>{children}</span>;
}

function AlertBanner({ alert }) {
  if (!alert) return null;

  const { status, totalExpense, budgetLimit, percentUsed, month, year } = alert;

  const meta =
    status === "NO_BUDGET"
      ? `Chưa có budget cho ${pad2(month)}/${year}. Tổng chi: ${formatMoney(totalExpense)}`
      : `Tháng ${pad2(month)}/${year}: ${formatMoney(totalExpense)} / ${formatMoney(budgetLimit)} (${percentUsed ?? 0
      }%)`;

  const tone =
    status === "OVER" ? "danger" : status === "WARNING" ? "warn" : status === "OK" ? "ok" : "neutral";

  const label =
    status === "OVER"
      ? "Vượt ngân sách"
      : status === "WARNING"
        ? "Sắp vượt ngân sách"
        : status === "OK"
          ? "Trong ngưỡng"
          : "Chưa thiết lập budget";

  return (
    <div className={`exBanner exBanner--${tone}`}>
      <div>
        <div className="exBanner__title">{label}</div>
        <div className="exBanner__sub">{meta}</div>
      </div>
      <Pill tone={tone}>{tone === "danger" ? "Over" : tone === "warn" ? "Warning" : tone === "ok" ? "OK" : "Info"}</Pill>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" className={active ? "exChip exChip--active" : "exChip"} onClick={onClick}>
      {children}
    </button>
  );
}

/* ======================= Form ======================= */
function ExpenseForm({
  mode,
  categories,
  initialValue,
  submitting,
  onSubmit,
  onCancel,
  onGoCategories,
  onQuickCreateCategory,
  creatingCategory,
}) {
  const [amount, setAmount] = useState(initialValue?.amount ? String(initialValue.amount) : "");
  const [expenseDate, setExpenseDate] = useState(
    initialValue?.expense_date ? initialValue.expense_date.slice(0, 10) : todayISO()
  );
  const [categoryId, setCategoryId] = useState(initialValue?.category_id || "");
  const [note, setNote] = useState(initialValue?.note || "");
  const [err, setErr] = useState("");

  useEffect(() => {
    setAmount(initialValue?.amount ? String(initialValue.amount) : "");
    setExpenseDate(initialValue?.expense_date ? initialValue.expense_date.slice(0, 10) : todayISO());
    setCategoryId(initialValue?.category_id || "");
    setNote(initialValue?.note || "");
    setErr("");
  }, [initialValue]);

  const preview = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return `${formatMoney(n)} VNĐ`;
  }, [amount]);

  const suggestedCats = useMemo(
    () => [
      { key: "food", label: "🍜 Ăn uống" },
      { key: "move", label: "🚗 Đi lại" },
      { key: "study", label: "🏠 Học tập" },
    ],
    []
  );

  const goCreateCategory = (presetName) => {
    onCancel?.();
    onGoCategories?.(presetName || "");
  };

  const handleQuickCreate = async (presetName) => {
    setErr("");
    try {
      const cat = await onQuickCreateCategory?.(presetName);
      if (cat?.id) setCategoryId(cat.id);
    } catch (e) {
      setErr(e?.message || "Tạo danh mục thất bại.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setErr("Amount phải là số > 0.");
    if (!expenseDate) return setErr("Vui lòng chọn ngày.");

    if (categories?.length && !categoryId) return setErr("Vui lòng chọn category.");
    if (!categories?.length) return setErr("Bạn chưa có danh mục. Hãy tạo nhanh bằng các nút gợi ý hoặc tạo mới.");

    onSubmit?.({
      amount: n,
      expense_date: expenseDate,
      category_id: categoryId,
      note: note?.trim() ? note.trim() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="exForm exForm--modal">
      {/* Amount + Date */}
      <div className="exForm__grid2 exForm__grid2--modal">
        <div className="exField exField--amount">
          <label className="exLabel">Số tiền</label>
          <div className="exAmount">
            <span className="exAmount__prefix">VNĐ</span>
            <input
              className="exAmount__input"
              inputMode="decimal"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="exHint exHint--row">
            <span>Preview</span>
            <span className="exPreviewPill">{preview}</span>
          </div>
        </div>

        <div className="exField">
          <label className="exLabel">Ngày chi</label>
          <input
            className="exInput exInput--date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
          <div className="exHint">Chọn đúng ngày phát sinh giao dịch</div>
        </div>
      </div>

      {/* Category */}
      <div className="exField">
        <label className="exLabel">Loại chi tiêu</label>

        {(!categories || categories.length === 0) ? (
          <div className="exQuickCatBox">
            <div className="exHint" style={{ marginBottom: 10 }}>
              Bạn chưa có danh mục nào. Bấm 1 gợi ý để tạo nhanh, hoặc tự tạo danh mục mới.
            </div>

            <div className="exQuickCatRow">
              {suggestedCats.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleQuickCreate(x.label)}
                  disabled={submitting || creatingCategory}
                >
                  {creatingCategory ? "Đang tạo..." : ` ${x.label}`}
                </button>
              ))}

              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => goCreateCategory("")}
                disabled={submitting || creatingCategory}
              >
                Tạo danh mục mới
              </button>
            </div>

            <div className="exHint" style={{ marginTop: 10, opacity: 0.9 }}>
              Tip: Nếu bạn là Free, có giới hạn số danh mục. Khi chạm giới hạn, app sẽ báo để bạn nâng cấp.
            </div>
          </div>
        ) : (
          <>
            <select
              className="exInput exInput--select"
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__GO_CATEGORIES__") {
                  goCreateCategory("");
                  return;
                }
                setCategoryId(v);
              }}
            >
              <option value=""> Loại chi tiêu</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__GO_CATEGORIES__">Tạo danh mục mới</option>
            </select>
            <div className="exHint">Tip: chọn loại giúp báo cáo phân tích chuẩn hơn</div>
          </>
        )}
      </div>

      {/* Note */}
      <div className="exField">
        <label className="exLabel">Ghi chú (chi tiết)</label>
        <textarea
          className="exInput exTextarea exTextarea--modal"
          rows={4}
          placeholder="VD: ăn trưa, đổ xăng, mua đồ học..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {err ? <div className="exAlert exAlert--danger exAlert--modal">{err}</div> : null}

      <div className="exForm__actions exForm__actions--modal">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting || creatingCategory}>
          Hủy
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting || creatingCategory}>
          {creatingCategory ? "Đang tạo danh mục..." : submitting ? "Saving…" : mode === "edit" ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}

/* ======================= Page ======================= */
export default function ExpensesPage() {
  const { month: nowMonth, year: nowYear } = monthStartYear();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // filters
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");

  // alert from backend (after mutations)
  const [alert, setAlert] = useState(null);

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // confirm delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // creating category state
  const [creatingCategory, setCreatingCategory] = useState(false);

  // ✅ Budget gate modal
  const [budgetGateOpen, setBudgetGateOpen] = useState(false);
  const [budgetGateLoading, setBudgetGateLoading] = useState(false);

  const catMap = useMemo(() => {
    const m = new Map();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return expenses.filter((e) => {
      const my = toMonthYear(e.expense_date);
      if (my.month !== Number(month) || my.year !== Number(year)) return false;
      if (categoryId && e.category_id !== categoryId) return false;

      if (query) {
        const note = (e.note || "").toLowerCase();
        const catName = (catMap.get(e.category_id)?.name || "").toLowerCase();
        if (!note.includes(query) && !catName.includes(query)) return false;
      }
      return true;
    });
  }, [expenses, month, year, categoryId, q, catMap]);

  const total = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount || 0), 0), [filtered]);
  const count = filtered.length;

  const topCats = useMemo(() => {
    const sums = new Map();
    for (const e of filtered) sums.set(e.category_id, (sums.get(e.category_id) || 0) + Number(e.amount || 0));
    const rows = [...sums.entries()]
      .map(([cid, amt]) => ({ cid, name: catMap.get(cid)?.name || "Unknown", amt }))
      .sort((a, b) => b.amt - a.amt);
    const top = rows.slice(0, 6);
    const max = Math.max(1, ...top.map((x) => x.amt));
    return top.map((x) => ({ ...x, pct: clamp((x.amt / max) * 100, 0, 100) }));
  }, [filtered, catMap]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [cats, exps] = await Promise.all([fetchCategories(), fetchExpenses()]);
      setCategories(cats || []);
      setExpenses(exps || []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to load expenses.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quick create category (create + insert + return)
  const quickCreateCategory = async (name) => {
    const normalized = String(name || "").trim();
    if (!normalized) throw new Error("Tên danh mục không hợp lệ.");

    const existed = categories.find(
      (c) => String(c.name || "").trim().toLowerCase() === normalized.toLowerCase()
    );
    if (existed) return existed;

    setCreatingCategory(true);
    try {
      const created = await createCategory({ name: normalized });
      setCategories((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      if (err?.response?.status === 409) {
        const cats = await fetchCategories();
        setCategories(cats || []);
        const found = (cats || []).find(
          (c) => String(c.name || "").trim().toLowerCase() === normalized.toLowerCase()
        );
        if (found) return found;
      }

      if (err?.response?.status === 403) {
        const msg =
          err?.response?.data?.message ||
          "Bạn đã đạt giới hạn danh mục của gói Free. Vui lòng nâng cấp để tạo thêm.";
        throw new Error(msg);
      }

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Tạo danh mục thất bại.";
      throw new Error(msg);
    } finally {
      setCreatingCategory(false);
    }
  };

  // ✅ check budget then open create modal OR show gate
  const requestOpenCreate = async () => {
    // nếu đang edit thì cứ mở luôn (thực tế bạn chỉ gọi create ở button)
    setError("");
    setBudgetGateLoading(true);
    try {
      const res = await fetchBudgetByMonthYear(Number(month), Number(year));

      // cố gắng đoán cấu trúc response: có thể là null / {} / {budget:null} / {id...}
      const budgetObj = res?.budget ?? res?.data ?? res ?? null;
      const hasBudget =
        !!(budgetObj && (budgetObj.id || budgetObj.limit_amount || budgetObj.limitAmount || budgetObj.month));

      if (!hasBudget) {
        setBudgetGateOpen(true);
        return;
      }

      setMode("create");
      setEditing(null);
      setOpen(true);
    } catch (e) {
      // nếu check budget lỗi -> vẫn cho tạo chi tiêu (đỡ block user)
      setMode("create");
      setEditing(null);
      setOpen(true);
    } finally {
      setBudgetGateLoading(false);
    }
  };

  const openEdit = (exp) => {
    setMode("edit");
    setEditing(exp);
    setOpen(true);
  };

  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      if (mode === "edit" && editing?.id) {
        const res = await updateExpense(editing.id, payload);
        setExpenses((prev) => prev.map((x) => (x.id === editing.id ? res.expense : x)));
        setAlert(res.alert || null);
      } else {
        const res = await createExpense(payload);
        setExpenses((prev) => [res.expense, ...prev]);
        setAlert(res.alert || null);
      }
      setOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Save failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (exp) => {
    setPendingDelete(exp);
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
      const res = await deleteExpense(pendingDelete.id);
      setExpenses((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setAlert(res.alert || null);
      closeDeleteModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Delete failed.";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const periodLabel = `${pad2(Number(month))}/${year}`;

  return (
    <div className="exPage">
      <div className="dashContainer exContainer">
        {/* HERO */}
        <div className="exHero">
          <div className="exHero__left">
            <div className="exHero__title">
              <span className="dashHeader__wave">🧾</span>{" "}
              Chi tiêu <span className="exHero__grad">gọn gàng</span>
            </div>
            <div className="exHero__sub">
              Theo dõi theo tháng/danh mục, tìm kiếm theo ghi chú, và nhận cảnh báo ngân sách ngay sau mỗi lần nhập.
            </div>

            <div className="exHero__chips">
              <Pill tone="neutral">Period: {periodLabel}</Pill>
              <Pill tone="neutral">Count: {count}</Pill>
              <Pill tone="ok">Total: {formatMoney(total)} VNĐ</Pill>
            </div>
          </div>

          <div className="exHero__right">
            <button className="btn btn--secondary" onClick={load} disabled={loading} type="button">
              <AppIcon name="reload" size={18} /> Tải lại
            </button>

            <Link to="/categories" className="btn btn--secondary">
              <AppIcon name="categories" size={18} /> Danh mục
            </Link>

            {/* ✅ use budget gate */}
            <button className="btn btn--primary" onClick={requestOpenCreate} type="button" disabled={budgetGateLoading}>
              <AppIcon name="addExpense" size={18} /> {budgetGateLoading ? "Đang kiểm tra..." : "Thêm chi tiêu"}
            </button>
          </div>
        </div>

        <AlertBanner alert={alert} />

        {error ? <div className="exAlert exAlert--danger">{error}</div> : null}

        {/* FILTERS */}
        <div className="exFilters">
          <div className="exFilters__group">
            <label className="exLabel exLabel--inline">Tháng</label>
            <select className="exInput exInput--sm" value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                return (
                  <option key={m} value={m}>
                    {pad2(m)}
                  </option>
                );
              })}
            </select>

            <label className="exLabel exLabel--inline">Năm</label>
            <input
              className="exInput exInput--sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              style={{ width: 130 }}
            />
          </div>

          <div className="exFilters__group exFilters__group--grow">
            <label className="exLabel exLabel--inline">Loại</label>
            <select
              className="exInput exInput--sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.8,
                  pointerEvents: "none",
                }}
              >
                <AppIcon name="search" size={18} />
              </span>
              <input
                className="exInput exInput--sm"
                placeholder="Tìm theo ghi chú hoặc category…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ paddingLeft: 34, width: "100%" }}
              />
            </div>

            <button className="btn btn--secondary btn--sm" type="button" onClick={() => setQ("")} disabled={!q.trim()}>
              <AppIcon name="clear" size={18} />
            </button>
          </div>

          <div className="exFilters__meta">
            <div className="exStat">
              <div className="exStat__label">Tổng tiền</div>
              <div className="exStat__value">{formatMoney(total)} VNĐ</div>
            </div>
            <div className="exStat">
              <div className="exStat__label">Số lượng</div>
              <div className="exStat__value">{count}</div>
            </div>
          </div>
        </div>

        {/* BODY */}
        {loading ? (
          <div className="exLoading">
            <div className="skeleton skeleton--hero" />
            <div className="exLoading__grid">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
          </div>
        ) : count === 0 ? (
          <div className="exEmpty">
            <div className="exEmpty__title">Chưa có giao dịch trong tháng này</div>
            <div className="exEmpty__sub">Thử đổi Tháng/Năm, Loại chi phí hoặc tạo chi phí mới.</div>
            {/* ✅ use budget gate */}
            <button className="btn btn--primary" onClick={requestOpenCreate} type="button" disabled={budgetGateLoading}>
              <AppIcon name="addExpense" size={18} /> {budgetGateLoading ? "Đang kiểm tra..." : "Tạo chi tiêu đầu tiên"}
            </button>
          </div>
        ) : (
          <>
            {/* Insights */}
            <div className="exInsights">
              <div className="exKpi exKpi--purple">
                <div className="exKpi__label">Kỳ đang xem</div>
                <div className="exKpi__value">{periodLabel}</div>
                <div className="exKpi__hint">Đổi filter ở thanh phía trên</div>
              </div>

              <div className="exKpi exKpi--blue">
                <div className="exKpi__label">Top categories</div>
                <div className="exTop">
                  {topCats.length ? (
                    topCats.slice(0, 4).map((x) => (
                      <div key={x.cid} className="exTop__row">
                        <span className="exTag">{x.name}</span>
                        <div className="exTop__right">
                          <span className="exMoney">
                            {formatMoney(x.amt)} <span className="exMoney__unit">VNĐ</span>
                          </span>
                          <span className="exPctPill">{Math.round(x.pct)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="exMuted">—</div>
                  )}
                </div>
              </div>

              <div className="exKpi exKpi--green">
                <div className="exKpi__label">Quick actions</div>
                <div className="exQuick">
                  <Chip active={false} onClick={() => setCategoryId("")}>
                    All
                  </Chip>
                  {topCats.slice(0, 3).map((x) => (
                    <Chip
                      key={x.cid}
                      active={categoryId === x.cid}
                      onClick={() => setCategoryId(categoryId === x.cid ? "" : x.cid)}
                    >
                      {x.name}
                    </Chip>
                  ))}
                </div>
                <div className="exKpi__hint">Chạm để filter nhanh theo top categories</div>
              </div>
            </div>

            {/* Table */}
            <div className="exTableCard">
              <div className="exTableCard__head">
                <div>
                  <div className="exTableCard__title">📒 Danh sách chi tiêu</div>
                  <div className="exTableCard__sub">Sắp xếp theo dữ liệu backend (mặc định). Dùng search để lọc nhanh.</div>
                </div>
                <div className="exTableCard__meta">
                  <Pill tone="neutral">Rows: {count}</Pill>
                  <Pill tone="ok">Total: {formatMoney(total)} VNĐ</Pill>
                </div>
              </div>

              <div className="exTableWrap">
                <table className="exTable">
                  <thead>
                    <tr>
                      <th style={{ width: 150 }}>Ngày</th>
                      <th style={{ width: 180 }}>Loại</th>
                      <th>Ghi chú</th>
                      <th style={{ width: 180, textAlign: "right" }}>Số tiền</th>
                      <th style={{ width: 210, textAlign: "right" }}>Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id}>
                        <td className="exMono">{String(e.expense_date).slice(0, 10)}</td>
                        <td>
                          <span className="exTag exTag--soft">{catMap.get(e.category_id)?.name || "Unknown"}</span>
                        </td>
                        <td className="exMuted">{e.note || "—"}</td>
                        <td className="exMono exStrong" style={{ textAlign: "right" }}>
                          {formatMoney(e.amount)} VNĐ
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="exRowActions">
                            <button className="btn btn--secondary btn--sm" onClick={() => openEdit(e)} type="button">
                              <AppIcon name="edit" size={16} /> Chỉnh sửa
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => handleDelete(e)} type="button">
                              <AppIcon name="delete" size={16} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ✅ Budget Gate Modal */}
        <Modal open={budgetGateOpen} title="Bạn chưa có ngân sách" onClose={() => setBudgetGateOpen(false)} footer={null}>
          <div style={{ lineHeight: 1.6 }}>
            <div style={{ opacity: 0.9, marginBottom: 12 }}>
              Để theo dõi chi tiêu tốt hơn,  hãy tạo ngân sách trước. 👌
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn--secondary" type="button" onClick={() => setBudgetGateOpen(false)}>
                Bỏ qua
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  setBudgetGateOpen(false);
                  navigate(`/budgets?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
                }}
              >
                Tạo ngân sách
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Expense */}
        <Modal
          open={open}
          title={mode === "edit" ? "Chỉnh sửa chi tiêu" : "Thêm chi tiêu"}
          onClose={() => (submitting ? null : setOpen(false))}
          footer={null}
        >
          <ExpenseForm
            mode={mode}
            categories={categories}
            initialValue={editing}
            submitting={submitting}
            onSubmit={handleSave}
            onCancel={() => setOpen(false)}
            onGoCategories={(presetName) => {
              const qs = presetName ? `?preset=${encodeURIComponent(presetName)}` : "";
              navigate(`/categories${qs}`);
            }}
            onQuickCreateCategory={quickCreateCategory}
            creatingCategory={creatingCategory}
          />
        </Modal>

        {/* Confirm Delete */}
        <ConfirmDialog
          open={confirmOpen}
          title="Xoá chi tiêu"
          message={
            pendingDelete
              ? `Bạn có muốn xoá chi tiêu "${catMap.get(pendingDelete.category_id)?.name || "Unknown"}" - ${formatMoney(
                pendingDelete.amount
              )} VNĐ không?`
              : "Bạn có muốn xoá chi tiêu này không?"
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