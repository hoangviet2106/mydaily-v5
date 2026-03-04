import { useEffect, useMemo, useRef, useState } from "react";
import { fetchExpenses } from "../api/expenses";
import { fetchBudgetByMonthYear, upsertBudget } from "../api/budgets";
import { AppIcon } from "../icons"; // ✅ NEW
import "../BudgetsPage.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function monthStartYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}
function formatMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN");
}
function toMonthYear(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** ✅ format input có dấu phẩy, chỉ cho phép số */
function formatNumberInput(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/** ✅ bỏ dấu phẩy để parse number */
function unformatNumberInput(value) {
  return String(value ?? "").replace(/,/g, "");
}

/** ✅ caret helpers (giữ con trỏ không bị nhảy) */
function countDigitsBeforePos(str, pos) {
  return (str.slice(0, pos).match(/\d/g) || []).length;
}
function posAfterNDigits(formattedStr, nDigits) {
  if (nDigits <= 0) return 0;
  let count = 0;
  for (let i = 0; i < formattedStr.length; i++) {
    if (/\d/.test(formattedStr[i])) count++;
    if (count === nDigits) return i + 1;
  }
  return formattedStr.length;
}

function Pill({ tone = "neutral", children }) {
  return <span className={`budPill budPill--${tone}`}>{children}</span>;
}

function StatusBanner({ budget, actual }) {
  const limit = Number(budget?.limit_amount || 0);
  const spent = Number(actual || 0);

  if (!budget) {
    return (
      <div className="budBanner budBanner--neutral">
        <div className="budBanner__title">Chưa thiết lập ngân sách</div>
        <div className="budBanner__sub">
          Tạo Budget để hệ thống cảnh báo khi chi tiêu tăng cao và giúp bạn giữ nhịp tài chính.
        </div>
        <Pill tone="neutral">No Budget</Pill>
      </div>
    );
  }

  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  let cls = "budBanner budBanner--ok";
  let label = "Trong ngưỡng";
  let pill = "ok";
  if (percent >= 100) {
    cls = "budBanner budBanner--danger";
    label = "Vượt ngân sách";
    pill = "danger";
  } else if (percent >= 80) {
    cls = "budBanner budBanner--warn";
    label = "Sắp vượt ngân sách";
    pill = "warn";
  }

  return (
    <div className={cls}>
      <div>
        <div className="budBanner__title">{label}</div>
        <div className="budBanner__sub">
          Tổng chi: <b>{formatMoney(spent)}</b> / Budget: <b>{formatMoney(limit)}</b>{" "}
          <span className="budMono">({percent}%)</span>
        </div>
      </div>
      <Pill tone={pill}>{pill === "danger" ? "Over" : pill === "warn" ? "Warning" : "OK"}</Pill>
    </div>
  );
}

function ProgressRing({ percent = 0 }) {
  const p = clamp(Number(percent || 0), 0, 100);
  return (
    <div className="budRing" aria-label={`Budget usage ${p}%`}>
      <div className="budRing__inner">
        <div className="budRing__value">{p}%</div>
        <div className="budRing__label">Đã dùng</div>
      </div>
      <div className="budRing__track" style={{ "--p": `${p}%` }} />
    </div>
  );
}

export default function BudgetsPage() {
  const { month: nowMonth, year: nowYear } = monthStartYear();

  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [budget, setBudget] = useState(null);
  const [draftAmount, setDraftAmount] = useState("");

  const budgetInputRef = useRef(null);

  const [expenses, setExpenses] = useState([]);

  const actual = useMemo(() => {
    return expenses
      .filter((e) => {
        const my = toMonthYear(e.expense_date);
        return my.month === Number(month) && my.year === Number(year);
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [expenses, month, year]);

  const limit = useMemo(() => Number(budget?.limit_amount || 0), [budget]);

  const remaining = useMemo(() => {
    return budget ? Math.max(limit - actual, 0) : 0;
  }, [budget, limit, actual]);

  const percentUsed = useMemo(() => {
    if (!budget || limit <= 0) return 0;
    return clamp(Math.round((actual / limit) * 100), 0, 100);
  }, [budget, limit, actual]);

  const handleDraftAmountChange = (e) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;

    const digitsBefore = countDigitsBeforePos(raw, caret);
    const formatted = formatNumberInput(raw);

    setDraftAmount(formatted);

    requestAnimationFrame(() => {
      const el = budgetInputRef.current;
      if (!el) return;
      const nextCaret = posAfterNDigits(formatted, digitsBefore);
      el.setSelectionRange(nextCaret, nextCaret);
    });
  };

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [exps, b] = await Promise.all([fetchExpenses(), fetchBudgetByMonthYear(month, year)]);
      setExpenses(exps || []);

      const normalized = b?.budget ?? b?.data ?? b ?? null;

      const amt =
        normalized?.limit_amount ??
        normalized?.amount ??
        normalized?.limit ??
        normalized?.budget_limit ??
        normalized?.budgetLimit ??
        null;

      setBudget(normalized ? { ...normalized, limit_amount: amt } : null);

      setDraftAmount(amt !== null && amt !== undefined ? formatNumberInput(String(amt)) : "");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load budgets.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const onSave = async () => {
    setError("");

    const trimmed = unformatNumberInput(draftAmount).trim();
    const n = Number(trimmed);

    if (!trimmed || !Number.isFinite(n) || n <= 0) {
      setError("Budget amount phải là số > 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await upsertBudget({
        month: Number(month),
        year: Number(year),
        limit_amount: n,
      });

      const normalized = res?.budget ?? res?.data ?? res ?? null;

      const amt =
        normalized?.limit_amount ??
        normalized?.amount ??
        normalized?.limit ??
        normalized?.budget_limit ??
        normalized?.budgetLimit ??
        n;

      setBudget(normalized ? { ...normalized, limit_amount: amt } : { month, year, limit_amount: amt });

      setDraftAmount(formatNumberInput(String(amt)));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Save budget failed.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onResetDraft = () => {
    setDraftAmount(
      budget?.limit_amount !== undefined && budget?.limit_amount !== null
        ? formatNumberInput(String(budget.limit_amount))
        : ""
    );
    setError("");
  };

  const periodLabel = `${pad2(Number(month))}/${year}`;

  return (
    <div className="budPage">
      <div className="dashContainer budContainer">
        {/* HERO */}
        <div className="budHero">
          <div className="budHero__left">
            <div>
              <div className="budHero__title">
                <span className="dashHeader__wave">💸</span>{" "}
                Ngân sách <span className="budHero__grad">thông minh</span>{" "}
              </div>
              <div className="budHero__sub">
                Thiết lập ngân sách theo tháng, theo dõi <b>Budget vs Chi tiêu</b>, nhận cảnh báo sớm khi sắp vượt ngưỡng.
              </div>
            </div>

            <div className="budHero__chips">
              <Pill tone="neutral">Period: {periodLabel}</Pill>
              <Pill tone={budget ? "ok" : "neutral"}>{budget ? "Budget Active" : "No Budget"}</Pill>
              <Pill tone={percentUsed >= 80 ? (percentUsed >= 100 ? "danger" : "warn") : "ok"}>
                Usage: {budget ? `${percentUsed}%` : "—"}
              </Pill>
            </div>
          </div>

          <div className="budHero__right">
            <button className="btn btn--secondary" onClick={load} disabled={loading} type="button">
              <AppIcon name="reload" size={16} /> Tải lại
            </button>
          </div>
        </div>

        {error ? <div className="budAlert budAlert--danger">{error}</div> : null}

        {/* EDITOR (glass) */}
        <div className="budEditor">
          <div className="budEditor__group">
            <label className="budLabel">Month</label>
            <select className="budInput" value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                return (
                  <option key={m} value={m}>
                    {pad2(m)}
                  </option>
                );
              })}
            </select>

            <label className="budLabel">Year</label>
            <input
              className="budInput"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              style={{ width: 140 }}
            />
          </div>

          <div className="budEditor__group budEditor__group--grow">
            <label className="budLabel">Ngân sách</label>
            <input
              ref={budgetInputRef}
              className="budInput"
              placeholder="Ví dụ: 3,000,000"
              value={draftAmount}
              onChange={handleDraftAmountChange}
              inputMode="numeric"
            />

            <button className="btn btn--primary" onClick={onSave} disabled={saving || loading} type="button">
              {saving ? "Saving…" : budget ? "Cập nhật" : "Tạo mới"}
            </button>

            <button className="btn btn--secondary" onClick={onResetDraft} disabled={saving || loading} type="button">
              Cài lại
            </button>
          </div>
        </div>

        {/* STATUS */}
        <StatusBanner budget={budget} actual={actual} />

        {/* BODY */}
        {loading ? (
          <div className="budLoading">
            <div className="skeleton skeleton--hero" />
            <div className="budLoading__grid">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
          </div>
        ) : (
          <>
            <div className="budGrid">
              {/* KPI */}
              <div className="budCard budCard--purple">
                <div className="budCard__label">Ngân sách tháng</div>
                <div className="budCard__value">
                  {budget ? formatMoney(limit) : "—"} <span className="budUnit">VNĐ</span>
                </div>
                <div className="budCard__hint">Áp dụng cho {periodLabel}</div>
              </div>

              <div className="budCard budCard--blue">
                <div className="budCard__label">Chi tiêu thực tế</div>
                <div className="budCard__value">
                  {formatMoney(actual)} <span className="budUnit">VNĐ</span>
                </div>
                <div className="budCard__hint">Tổng chi đã ghi nhận</div>
              </div>

              <div className="budCard budCard--green">
                <div className="budCard__label">Còn lại</div>
                <div className="budCard__value">
                  {budget ? formatMoney(remaining) : "—"} <span className="budUnit">VNĐ</span>
                </div>
                <div className="budCard__hint">Buffer cho chi phí phát sinh</div>
              </div>

              {/* Ring + tips */}
              <div className="budPanel">
                <div className="budPanel__head">
                  <div className="budPanel__title">
                    <AppIcon name="target" size={18} /> Mức độ sử dụng
                  </div>
                  <Pill tone={percentUsed >= 80 ? (percentUsed >= 100 ? "danger" : "warn") : "ok"}>
                    {budget ? `${percentUsed}%` : "—"}
                  </Pill>
                </div>

                <div className="budPanel__content">
                  <ProgressRing percent={budget ? percentUsed : 0} />

                  <div className="budTips">
                    <div className="budTips__title">Gợi ý nhanh</div>
                    <ul className="budTips__list">
                      <li>
                        Giữ usage dưới <b>80%</b> để có buffer.
                      </li>
                      <li>Nếu tháng này biến động, hãy cập nhật budget để phản ánh thực tế.</li>
                      <li>Budget ổn định giúp báo cáo và insight “đáng tin” hơn.</li>
                    </ul>
                  </div>
                </div>

                <div className="budBar">
                  <div className="budBar__track">
                    <div className="budBar__fill" style={{ width: `${budget ? percentUsed : 0}%` }} />
                  </div>
                  <div className="budBar__labels">
                    <span>0%</span>
                    <span>80%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary table */}
            <div className="budTableCard">
              <div className="budTableCard__head">
                <div>
                  <div className="budTableCard__title">
                    <AppIcon name="pin" size={18} /> Tóm tắt kỳ
                  </div>
                  <div className="budTableCard__sub">Một dòng nhìn ra trạng thái tài chính của {periodLabel}.</div>
                </div>
                <div className="budTableCard__meta">
                  <Pill tone="neutral">Period: {periodLabel}</Pill>
                  <Pill tone={budget ? "ok" : "neutral"}>{budget ? "Active" : "None"}</Pill>
                </div>
              </div>

              <div className="budTableWrap">
                <table className="budTable">
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>Thời gian</th>
                      <th style={{ width: 220 }}>Ngân sách</th>
                      <th style={{ width: 220 }}>Chi tiêu</th>
                      <th style={{ width: 220 }}>Còn lại</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="budMono">{periodLabel}</td>
                      <td className="budMono budStrong">{budget ? formatMoney(limit) : "—"}</td>
                      <td className="budMono budStrong">{formatMoney(actual)}</td>
                      <td className="budMono budStrong">{budget ? formatMoney(remaining) : "—"}</td>
                      <td className="budMuted">
                        {budget
                          ? "Bạn có thể chỉnh budget ở khu vực nhập phía trên."
                          : "Chưa có budget — hãy tạo để theo dõi & nhận cảnh báo."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}