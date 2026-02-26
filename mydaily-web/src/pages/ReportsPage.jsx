import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchCategories } from "../api/category";
import {
  getBreakdownByCategory,
  getBudgetVsActual,
  getPeriodicTotals,
  getTopCategories,
  getTrendLastNMonths,
} from "../api/reports";
import { AppIcon } from "../icons"; // ✅ NEW

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import "../ReportsPage.css";

/* ===================== Utils ===================== */
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

/* ===================== Shared small UI ===================== */
function TabCard({ active, tone = "purple", iconName, title, desc, onClick }) {
  const cls = `rpTabCard rpTabCard--${tone} ${active ? "rpTabCard--active" : ""}`;
  return (
    <button className={cls} type="button" onClick={onClick}>
      <div className="rpTabCard__header">
        <div className="rpTabCard__icon">
          <AppIcon name={iconName} size={22} className={`appIcon icon--${tone}`} />
        </div>
        <div className="rpTabCard__title">{title}</div>
      </div>
      <div className="rpTabCard__desc">{desc}</div>
      <div className="rpTabCard__arrow">
        <AppIcon name="arrow" size={18} />
      </div>
    </button>
  );
}

function Pill({ tone = "neutral", children }) {
  return <span className={`rpPill rpPill--${tone}`}>{children}</span>;
}

function EmptyState({ icon = "🫧", title, desc }) {
  return (
    <div className="rpEmpty">
      <div className="rpEmpty__icon">{icon}</div>
      <div className="rpEmpty__title">{title}</div>
      <div className="rpEmpty__desc">{desc}</div>
    </div>
  );
}

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpTooltip">
      <div className="rpTooltip__label">{label}</div>
      {payload.map((p, idx) => (
        <div key={idx} className="rpTooltip__row">
          <span className="rpTooltip__k">{p.name}</span>
          <span className="rpTooltip__v">{formatMoney(p.value)} VNĐ</span>
        </div>
      ))}
    </div>
  );
}

/* ===================== Charts (styled for dark glass) ===================== */
function TrendChart({ rows }) {
  const data = (rows || []).map((r) => ({ month: r.key, total: Number(r.total || 0) }));
  if (!data.length) return null;

  return (
    <div className="rpChart">
      <div className="rpChart__canvas">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <Tooltip content={<GlassTooltip />} />
            <Line type="monotone" dataKey="total" strokeWidth={3} dot={false} stroke="rgba(102, 126, 234, 0.95)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rpChart__note">Xu hướng 6 tháng gần nhất.</div>
    </div>
  );
}

function BreakdownChart({ rows }) {
  const sorted = [...(rows || [])].sort((a, b) => Number(b.total) - Number(a.total));
  const top = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const othersTotal = rest.reduce((s, r) => s + Number(r.total || 0), 0);

  const data = [
    ...top.map((r) => ({ name: r.category, total: Number(r.total || 0) })),
    ...(othersTotal > 0 ? [{ name: "Others", total: othersTotal }] : []),
  ];
  if (!data.length) return null;

  return (
    <div className="rpChart">
      <div className="rpChart__canvas">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
            <XAxis dataKey="name" hide />
            <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <Tooltip content={<GlassTooltip />} />
            <Bar dataKey="total" fill="rgba(118, 75, 162, 0.85)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rpChart__note">Top 6 + Others để tránh biểu đồ quá dài.</div>
    </div>
  );
}

function TopCategoriesChart({ rows }) {
  const data = (rows || []).map((r, idx) => ({
    name: r.category,
    total: Number(r.total || 0),
    rank: idx + 1,
  }));
  if (!data.length) return null;

  const colors = [
    "rgba(102,126,234,0.95)",
    "rgba(118,75,162,0.95)",
    "rgba(236,72,153,0.92)",
    "rgba(59,130,246,0.92)",
    "rgba(34,197,94,0.90)",
  ];

  return (
    <div className="rpChart">
      <div className="rpChart__canvas">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
            <XAxis dataKey="name" hide />
            <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <Tooltip content={<GlassTooltip />} />
            <Bar dataKey="total" radius={[10, 10, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rpChart__note">Top 1 → Top 5 theo tổng tiền.</div>
    </div>
  );
}

function PeriodicChart({ rows, year }) {
  const raw = rows || [];

  const getQuarter = (period) => {
    const s = String(period || "").toUpperCase();
    const m = s.match(/Q([1-4])/);
    if (m) return `Q${m[1]}`;
    return null;
  };

  const map = new Map([
    ["Q1", 0],
    ["Q2", 0],
    ["Q3", 0],
    ["Q4", 0],
  ]);

  raw.forEach((r) => {
    const q = getQuarter(r.period);
    if (!q) return;
    map.set(q, Number(r.total || 0));
  });

  const data = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({ quarter: q, total: map.get(q) || 0 }));
  const hasAny = data.some((d) => d.total > 0);
  if (!hasAny) return null;

  return (
    <div className="rpChart">
      <div className="rpChart__canvas">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
            <XAxis dataKey="quarter" tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "rgba(255,255,255,.70)", fontSize: 12 }} />
            <Tooltip content={<GlassTooltip />} />
            <Bar dataKey="total" fill="rgba(59,130,246,0.85)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rpChart__note">Tổng hợp theo quý (Q1–Q4) năm {year}.</div>
    </div>
  );
}

/* ===================== Premium lock (dashboard style) ===================== */
function PremiumLockCard({ title }) {
  return (
    <div className="rpPremium">
      <div className="rpPremium__left">
        <div className="rpPremium__title">
          <AppIcon name="lock" size={20} /> {title}
        </div>
        <div className="rpPremium__desc">
          Biểu đồ là tính năng Premium. Nâng cấp để xem trực quan và nhận insight nhanh.
        </div>
        <button className="btn btn--primary" type="button">
          <AppIcon name="crown" size={18} /> Nâng cấp Premium
        </button>
        <div className="rpPremium__hint">* Demo Premium giúp “ăn điểm” khi trình bày báo cáo.</div>
      </div>
      <div className="rpPremium__mock" aria-hidden="true">
        <div className="rpSkel rpSkel--lg" />
        <div className="rpSkel rpSkel--md" />
        <div className="rpSkel rpSkel--sm" />
      </div>
    </div>
  );
}

/* ===================== Budget banner ===================== */
function BudgetBanner({ comparison }) {
  const limit = Number(comparison?.limit || 0);
  const actual = Number(comparison?.actual || 0);
  const percent = Number(comparison?.percent || 0);
  const hasBudget = Boolean(comparison?.budget) && limit > 0;

  if (!hasBudget) {
    return (
      <div className="rpBanner rpBanner--neutral">
        <div className="rpBanner__title">Chưa có ngân sách</div>
        <div className="rpBanner__sub">Tạo ngân sách cho tháng này để so sánh Budget vs Actual.</div>
        <Pill tone="neutral">No budget</Pill>
      </div>
    );
  }

  const band = percent >= 100 ? "danger" : percent >= 80 ? "warn" : "ok";
  const label = band === "danger" ? "Vượt ngân sách" : band === "warn" ? "Sắp vượt" : "Trong ngưỡng";
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className={`rpBanner rpBanner--${band}`}>
      <div>
        <div className="rpBanner__title">{label}</div>
        <div className="rpBanner__sub">
          Chi tiêu <b>{formatMoney(actual)}</b> / Ngân sách <b>{formatMoney(limit)}</b> ({percent}%)
        </div>
      </div>

      <div className="rpBanner__right">
        <Pill tone={band}>{band === "danger" ? "⛔" : band === "warn" ? "⚠️" : "✅"} {band.toUpperCase()}</Pill>
        <div className="rpMeter">
          <div className="rpMeter__track">
            <div className="rpMeter__fill" style={{ width: `${width}%` }} />
          </div>
          <div className="rpMeter__ticks">
            <span>0%</span><span>80%</span><span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Table ===================== */
function DataTable({ columns, rows, emptyText, dense = true }) {
  return (
    <div className={`rpTableWrap ${dense ? "rpTableWrap--dense" : ""}`}>
      <table className="rpTable">
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={c.colStyle || undefined} />
          ))}
        </colgroup>

        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.thStyle || undefined}
                className={c.align === "right" ? "rpTh--right" : c.align === "center" ? "rpTh--center" : "rpTh--left"}
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {!rows?.length ? (
            <tr>
              <td colSpan={columns.length} className="rpTdMuted">
                {emptyText || "Không có dữ liệu."}
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.key || idx}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={c.tdStyle || undefined}
                    className={c.align === "right" ? "rpTd--right" : c.align === "center" ? "rpTd--center" : "rpTd--left"}
                  >
                    {c.render ? c.render(r, idx) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== Page ===================== */
function PremiumGate({ isPremium, title, children }) {
  if (!isPremium) {
    return <PremiumLockCard title={title} />;
  }
  return children;
}

export default function ReportsPage() {
  const { accountType } = useOutletContext();
  const isPremium = accountType === "PREMIUM";

  const { month: nowMonth, year: nowYear } = monthStartYear();

  const [tab, setTab] = useState("breakdown");
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

  const [breakdown, setBreakdown] = useState({ rows: [], grandTotal: 0 });
  const [comparison, setComparison] = useState({ budget: null, actual: 0, limit: 0, percent: 0 });
  const [trend, setTrend] = useState({ rows: [] });
  const [periodic, setPeriodic] = useState({ rows: [], year: nowYear });
  const [topCats, setTopCats] = useState({ rows: [] });

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const cats = await fetchCategories();
      setCategories(cats || []);

      const [bd, comp, tr, per, top] = await Promise.all([
        getBreakdownByCategory({ month, year, categories: cats || [] }),
        getBudgetVsActual({ month, year }),
        getTrendLastNMonths({ n: 6 }),
        getPeriodicTotals({ year }),
        getTopCategories({ month, year, categories: cats || [], top: 5 }),
      ]);

      setBreakdown(bd);
      setComparison(comp);
      setTrend(tr);
      setPeriodic(per);
      setTopCats(top);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to load reports.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const mm = pad2(Number(month));
  const grandTotal = Number(breakdown?.grandTotal || 0);

  const kpis = useMemo(() => {
    const catsCount = breakdown?.rows?.length || 0;
    const last = trend?.rows?.length ? Number(trend.rows[trend.rows.length - 1].total || 0) : 0;
    const pct = comparison?.limit ? Number(comparison.percent || 0) : null;

    return [
      { tone: "purple", iconName: "money", title: "Tổng chi tháng", value: `${formatMoney(grandTotal)} VNĐ`, sub: "Tổng chi theo tháng đang chọn" },
      { tone: "blue", iconName: "categories", title: "Số loại chi", value: (
    <span className="rpKpiValue">
      <span className="rpKpiValue__num">{catsCount}</span>
      <span className="rpKpiValue__unit"> loại</span>
    </span>
  ),
  sub: "Số category có phát sinh chi tiêu",
},
      { tone: "pink", iconName: "trend", title: "Tháng gần nhất", value: trend?.rows?.length ? `${formatMoney(last)} VNĐ` : "—", sub: "Total tháng gần nhất trong trend" },
      { tone: "green", iconName: "target", title: "Budget usage", value: pct === null ? "—" : `${pct}%`, sub: "Tỷ lệ dùng ngân sách (nếu có)" },
    ];
  }, [breakdown, trend, comparison, grandTotal]);

  const sectionMeta = useMemo(() => {
    const map = {
      breakdown: { h: "Thông số", p: `Chi theo loại — tháng ${mm}/${year}` },
      comparison: { h: "So sánh", p: `Budget vs Actual — tháng ${mm}/${year}` },
      trend: { h: "Xu hướng", p: "6 tháng gần đây" },
      periodic: { h: "Chu kỳ", p: `Theo quý — năm ${year}` },
      analysis: { h: "Xếp hạng", p: `Top categories — tháng ${mm}/${year}` },
    };
    return map[tab] || { h: "Reports", p: "" };
  }, [tab, mm, year]);

  return (
    <div className="rpPage">
      <div className="dashContainer rpContainer">
        {/* HEADER */}
        {/* ✅ giữ icon nổi bật cố định */}
        <div className="dashHeader rpHeader">
          <div className="dashHeader__greeting">
            <div className="dashHeader__wave">📊</div>
            <div>
              <div className="dashHeader__title">Báo cáo tài chính</div>
              <div className="dashHeader__subtitle">
                Tổng hợp theo tháng {mm}/{year}: Thông số, ngân sách, xu hướng, theo quý và top chi phí.
              </div>
            </div>
          </div>

          <div className="rpHeader__tools">
            <div className="rpFilterCard">
              <div className="rpFilterCard__row">
                <div className="rpField">
                  <label className="rpField__label">Month</label>
                  <select className="rpField__input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const m = i + 1;
                      return (
                        <option key={m} value={m}>
                          {pad2(m)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="rpField">
                  <label className="rpField__label">Year</label>
                  <input
                    className="rpField__input"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    inputMode="numeric"
                  />
                </div>

                <button className="btn btn--secondary rpReload" onClick={loadAll} disabled={loading} type="button">
                  <AppIcon name="reload" size={18} /> Tải lại
                </button>
              </div>

              <div className="rpTotal">
                <div className="rpTotal__label">Tổng tiền tháng</div>
                {/* ✅ giữ emoji nổi bật */}
                <div className="rpTotal__value">💰 {formatMoney(grandTotal)} VNĐ</div>
              </div>
            </div>

          </div>
        </div>

        {error ? (
          <div className="errorCard rpError">
            <div className="errorCard__icon">⚠️</div>
            <div className="errorCard__message">{error}</div>
            <button className="btn btn--primary" onClick={loadAll} type="button">
              Thử tải lại
            </button>
          </div>
        ) : null}

        {/* KPI GRID */}
        <div className="heroGrid rpKpiGrid">
          {kpis.map((k, i) => (
            <div key={i} className={`heroCard heroCard--${k.tone} rpKpiCard`} role="button" tabIndex={0}>
              <div className="heroCard__header">
                <div className="heroCard__icon">
                  <AppIcon name={k.iconName} size={24} className={`appIcon icon--${k.tone}`} />
                </div>
                <div className="heroCard__title">{k.title}</div>
              </div>
              <div className="heroCard__value">{k.value}</div>
              <div className="heroCard__subtitle">{k.sub}</div>
              <div className="heroCard__arrow">
                <AppIcon name="arrow" size={18} />
              </div>
            </div>
          ))}
        </div>

        {/* TAB CARDS */}
        <div className="rpTabs">
          <TabCard active={tab === "breakdown"} tone="purple" iconName="puzzle" title="Thông số" desc="Chi theo loại" onClick={() => setTab("breakdown")} />
          <TabCard active={tab === "comparison"} tone="blue" iconName="balance" title="So sánh" desc="Budget vs Actual" onClick={() => setTab("comparison")} />
          <TabCard active={tab === "trend"} tone="pink" iconName="trend" title="Xu hướng" desc="6 tháng gần đây" onClick={() => setTab("trend")} />
          <TabCard active={tab === "periodic"} tone="blue" iconName="calendar" title="Chu kỳ" desc="Theo quý" onClick={() => setTab("periodic")} />
          <TabCard active={tab === "analysis"} tone="pink" iconName="trophy" title="Xếp hạng" desc="Top categories" onClick={() => setTab("analysis")} />
        </div>

        {/* SECTION HEADER */}
        <div className="sectionHeader rpSectionHeader">
          {/* ✅ giữ emoji nổi bật */}
          <div className="sectionHeader__title">⚡ {sectionMeta.h}</div>
          <div className="rpSectionSub">{sectionMeta.p}</div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="rpLoading">
            <div className="skeleton skeleton--hero" />
            <div className="rpLoading__grid">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
            <div className="skeleton skeleton--hero" />
          </div>
        ) : (
          <>
            {/* BREAKDOWN */}
            {tab === "breakdown" ? (
              <div className="rpSplit">
                <div className="statsCard statsCard--purple rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">📊 Biểu đồ Breakdown</div>
                  </div>

                  {isPremium ? (
                    breakdown.rows?.length ? (
                      <BreakdownChart rows={breakdown.rows} />
                    ) : (
                      <EmptyState title="Chưa có dữ liệu tháng này" desc="Hãy thêm chi tiêu và gán category để hệ thống tổng hợp breakdown." />
                    )
                  ) : (
                    <PremiumLockCard title="Breakdown chart (Premium)" />
                  )}
                </div>

                <div className="statsCard statsCard--pink rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">🧾 Bảng Breakdown</div>
                  </div>

                <DataTable
  emptyText="Không có dữ liệu tháng này."
  columns={[
    { key: "category", title: "Loại chi phí", align: "left" },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      colStyle: { width: "180px" },
      render: (r) => `${formatMoney(r.total)} VNĐ`,
    },
    {
      key: "share",
      title: "Tỉ lệ",
      align: "right",
      colStyle: { width: "96px" },
      render: (r) => {
        const share = grandTotal > 0 ? Math.round((Number(r.total || 0) / grandTotal) * 100) : 0;
        return <Pill tone="neutral">{share}%</Pill>;
      },
    },
  ]}
  rows={(breakdown.rows || []).map((r) => ({ ...r, key: r.category_id }))}
/>
                </div>
              </div>
            ) : null}

            {/* COMPARISON */}
            {tab === "comparison" ? (
              <div className="rpSplit">
                <div className="statsCard statsCard--purple rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">⚖️ Budget vs Actual</div>
                  </div>
                  <BudgetBanner comparison={comparison} />
                  <div className="rpHint">
                    Tip: Giữ dưới <b>80%</b> để có buffer cho chi phí phát sinh.
                  </div>
                </div>

                <div className="statsCard statsCard--pink rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">📌 Chi tiết tháng</div>
                  </div>

                 <DataTable
  columns={[
    {
      key: "time",
      title: "Thời gian",
      align: "left",
      colStyle: { width: "140px" },
      render: () => <span className="rpMono">{mm}/{year}</span>,
    },
    {
      key: "budget",
      title: "Ngân sách",
      align: "right",
      colStyle: { width: "200px" },
      render: () => (comparison.limit ? `${formatMoney(comparison.limit)} VNĐ` : "—"),
    },
    {
      key: "actual",
      title: "Chi tiêu",
      align: "right",
      colStyle: { width: "200px" },
      render: () => `${formatMoney(comparison.actual)} VNĐ`,
    },
    {
      key: "status",
      title: "Trạng thái",
      align: "right",
      colStyle: { width: "160px" },
      render: () => {
        if (!comparison.budget) return <Pill tone="neutral">No budget</Pill>;
        if (comparison.percent >= 100) return <Pill tone="danger">Over budget</Pill>;
        if (comparison.percent >= 80) return <Pill tone="warn">Warning</Pill>;
        return <Pill tone="ok">OK</Pill>;
      },
    },
  ]}
  rows={[{ key: "row1" }]}
/>

                  {!isPremium ? <div className="rpInlineLock">🔒 Premium sẽ có gauge nâng cao + insight tự động (top category gây vượt).</div> : null}
                </div>
              </div>
            ) : null}

            {/* TREND */}
            {tab === "trend" ? (
                <PremiumGate isPremium={isPremium} title="Trend report (Premium)">
              <div className="rpSplit">
                <div className="statsCard statsCard--purple rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">📈 Biểu đồ xu hướng</div>
                  </div>

                  {isPremium ? (
                    trend.rows?.length ? (
                      <TrendChart rows={trend.rows} />
                    ) : (
                      <EmptyState title="Chưa đủ dữ liệu trend" desc="Cần dữ liệu nhiều tháng để vẽ xu hướng ổn định." />
                    )
                  ) : (
                    <PremiumLockCard title="Trend chart (Premium)" />
                  )}
                </div>

                <div className="statsCard statsCard--pink rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">🧾 Bảng xu hướng</div>
                  </div>

          <DataTable
  emptyText="Không có dữ liệu."
  columns={[
    {
      key: "key",
      title: "Tháng",
      align: "left",
      colStyle: { width: "140px" },
      render: (r) => <span className="rpMono">{r.key}</span>,
    },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      colStyle: { width: "200px" },
      render: (r) => `${formatMoney(r.total)} VNĐ`,
    },
    {
      key: "spark",
      title: "Chỉ số",
      align: "left",
      render: (r) => {
        const max = Math.max(1, ...(trend.rows || []).map((x) => Number(x.total || 0)));
        const pct = Math.min(100, (Number(r.total || 0) / max) * 100);
        return (
          <div className="rpSpark">
            <div className="rpSpark__bar" style={{ width: `${pct}%` }} />
            <span className="rpSpark__txt">{Math.round(pct)}%</span>
          </div>
        );
      },
    },
  ]}
  rows={(trend.rows || []).map((r) => ({ ...r, key: r.key }))}
/>

                </div>
              </div>
              </PremiumGate>
            ) : null}

            {/* PERIODIC */}
            {tab === "periodic" ? (
            <PremiumGate isPremium={isPremium} title="Quarter report (Premium)">
              <div className="rpSplit">
                <div className="statsCard statsCard--purple rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">🗓️ Chi tiêu theo quý</div>
                  </div>

                  {isPremium ? (
                    periodic.rows?.length ? (
                      <PeriodicChart rows={periodic.rows} year={periodic.year} />
                    ) : (
                      <EmptyState title="Chưa có dữ liệu theo quý" desc="Chưa đủ dữ liệu trong năm để tổng hợp theo quý." />
                    )
                  ) : (
                    <PremiumLockCard title="Quarter chart (Premium)" />
                  )}
                </div>

                <div className="statsCard statsCard--pink rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">🧾 Bảng theo quý</div>
                  </div>

              <DataTable
  emptyText="Không có dữ liệu."
  columns={[
    {
      key: "period",
      title: "Thời gian",
      align: "left",
      colStyle: { width: "140px" },
      render: (r) => <span className="rpMono">{r.period}</span>,
    },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      colStyle: { width: "220px" },
      render: (r) => `${formatMoney(r.total)} VNĐ`,
    },
    { key: "note", title: "Ghi chú", align: "left", render: () => <span className="rpMuted">—</span> },
  ]}
  rows={(periodic.rows || []).map((r) => ({ ...r, key: r.period }))}
/>
                </div>
              </div>
              </PremiumGate>
            ) : null}

            {/* ANALYSIS */}
            {tab === "analysis" ? (
              <div className="rpSplit">
                <div className="statsCard statsCard--purple rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">🏆 Top categories</div>
                  </div>

                  {isPremium ? (
                    topCats.rows?.length ? (
                      <TopCategoriesChart rows={topCats.rows} />
                    ) : (
                      <EmptyState title="Chưa có dữ liệu top" desc="Tháng này chưa có chi tiêu hoặc chưa gán category." />
                    )
                  ) : (
                    <PremiumLockCard title="Top categories chart (Premium)" />
                  )}
                </div>

                <div className="statsCard statsCard--pink rpPanel">
                  <div className="statsCard__header">
                    <div className="statsCard__title">📌 Bảng xếp hạng</div>
                  </div>

<DataTable
  emptyText="Không có dữ liệu tháng này."
  columns={[
    { key: "category", title: "Loại chi phí", align: "left" },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      colStyle: { width: "200px" },
      render: (r) => `${formatMoney(r.total)} VNĐ`,
    },
    {
      key: "rank",
      title: "Xếp hạng",
      align: "right",
      colStyle: { width: "120px" },
      render: (_, idx) => <Pill tone={idx === 0 ? "premium" : "neutral"}>#{idx + 1}</Pill>,
    },
  ]}
  rows={(topCats.rows || []).map((r) => ({ ...r, key: r.category_id }))}
/>

                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
