import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "../ExportPage.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function monthStartYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function prevMonthYear(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (m <= 1) return { month: 12, year: y - 1 };
  return { month: m - 1, year: y };
}

const EXPORTS = [
  {
    key: "expenses",
    title: "Chi Tiêu",
    desc: "Danh sách chi tiêu theo tháng",
    icon: "💳",
    color: "pink"
  },
  {
    key: "budgets",
    title: "Ngân Sách",
    desc: "Ngân sách theo tháng",
    icon: "🎯",
    color: "purple"
  },
  {
    key: "reports",
    title: "Báo Cáo",
    desc: "Tổng hợp theo danh mục",
    icon: "📊",
    color: "blue"
  },
];

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV", icon: "📄", desc: "Nhẹ & nhanh" },
  { value: "xlsx", label: "Excel", icon: "📗", desc: "Đẹp & chuyên nghiệp" }
];

function ExportTypeCard({ active, type, onClick }) {
  return (
    <div
      className={`exportTypeCard exportTypeCard--${type.color} ${active ? 'exportTypeCard--active' : ''}`}
      onClick={onClick}
    >
      <div className="exportTypeCard__icon">{type.icon}</div>
      <div className="exportTypeCard__content">
        <div className="exportTypeCard__title">{type.title}</div>
        <div className="exportTypeCard__desc">{type.desc}</div>
      </div>
      <div className="exportTypeCard__check">
        {active ? "✓" : "○"}
      </div>
    </div>
  );
}

function FormatOption({ active, option, onClick }) {
  return (
    <div
      className={`formatOption ${active ? 'formatOption--active' : ''}`}
      onClick={onClick}
    >
      <div className="formatOption__icon">{option.icon}</div>
      <div className="formatOption__content">
        <div className="formatOption__label">{option.label}</div>
        <div className="formatOption__desc">{option.desc}</div>
      </div>
      <div className="formatOption__radio">
        {active ? "●" : "○"}
      </div>
    </div>
  );
}

export default function ExportPage() {
  const { accountType, meLoading } = useOutletContext();

  const { month: m0, year: y0 } = useMemo(() => monthStartYear(), []);
  const [type, setType] = useState("expenses");
  const [format, setFormat] = useState("csv");
  const [month, setMonth] = useState(m0);
  const [year, setYear] = useState(y0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("token");
  const canExport = !meLoading && accountType === "PREMIUM";
  const activeType = EXPORTS.find((x) => x.key === type);

  const ext = format === "xlsx" ? "xlsx" : "csv";
  const filename = `${type}_${year}-${pad2(month)}.${ext}`;
  const endpoint = `/export/${type}?format=${format}&month=${month}&year=${year}`;

  const canExportReason = useMemo(() => {
    if (meLoading) return "Đang tải thông tin tài khoản...";
    if (!token) return "Bạn chưa đăng nhập.";
    if (accountType !== "PREMIUM") return "Tính năng Export chỉ dành cho Premium.";
    return "";
  }, [meLoading, token, accountType]);

  async function downloadExport() {
    setError("");
    setSuccess(false);

    const token = localStorage.getItem("token");
    if (!token) return setError("Bạn chưa đăng nhập.");
    if (!canExport) return setError("Tính năng Export chỉ dành cho Premium.");

    setDownloading(true);
    try {
      // ✅ Local: gọi thẳng backend
      // ✅ Prod: gọi relative để đi qua nginx proxy (/export/)
      const isLocal = window.location.hostname === "localhost";
      const base = isLocal ? "http://localhost:3000" : "";
      const url = `${base}${endpoint}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Export failed: ${res.status}`);
      }

      const cd = res.headers.get("content-disposition") || "";
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
      const serverFilename = decodeURIComponent(match?.[1] || match?.[2] || "");
      const finalName = serverFilename || filename;

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(objectUrl);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e?.message || "Export thất bại. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  }

  const onPickThisMonth = () => {
    const cur = monthStartYear();
    setMonth(cur.month);
    setYear(cur.year);
  };

  const onPickPrevMonth = () => {
    const cur = monthStartYear();
    const prev = prevMonthYear(cur.month, cur.year);
    setMonth(prev.month);
    setYear(prev.year);
  };

  return (
    <div className="exportPage">
      {/* Header */}
      <div className="exportPage__header">
        <div className="exportPage__headerContent">
          <div className="dashHeader__wave">📥</div>
          <div>
            <h1 className="exportPage__title">Trích Xuất Dữ Liệu</h1>
            <p className="exportPage__subtitle">
              Tải dữ liệu xuống dạng CSV hoặc Excel theo tháng
            </p>
          </div>
        </div>
        {canExport && (
          <div className="exportPage__badge exportPage__badge--premium">
            <span>👑</span>
            <span>Premium</span>
          </div>
        )}
      </div>

      {/* Premium Warning */}
      {!meLoading && accountType !== "PREMIUM" && (
        <div className="alertCard alertCard--warning">
          <div className="alertCard__icon">⚠️</div>
          <div className="alertCard__content">
            <div className="alertCard__title">Nâng cấp để sử dụng</div>
            <div className="alertCard__message">
              Bạn đang ở gói <strong>{accountType}</strong>. Tính năng Export chỉ dành cho <strong>PREMIUM</strong>.
            </div>
          </div>
          <button className="alertCard__action">
            Nâng cấp ngay →
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alertCard alertCard--error">
          <div className="alertCard__icon">❌</div>
          <div className="alertCard__content">
            <div className="alertCard__title">Export thất bại</div>
            <div className="alertCard__message">{error}</div>
          </div>
          <button className="alertCard__close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alertCard alertCard--success">
          <div className="alertCard__icon">✅</div>
          <div className="alertCard__content">
            <div className="alertCard__title">Export thành công!</div>
            <div className="alertCard__message">File đã được tải xuống: {filename}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="exportPage__content">
        {/* Step 1: Choose Data Type */}
        <section className="exportSection">
          <div className="exportSection__header">
            <div className="exportSection__number">1</div>
            <div className="exportSection__title">Chọn loại dữ liệu</div>
          </div>
          <div className="exportTypeGrid">
            {EXPORTS.map((exp) => (
              <ExportTypeCard
                key={exp.key}
                active={type === exp.key}
                type={exp}
                onClick={() => setType(exp.key)}
              />
            ))}
          </div>
        </section>

        {/* Step 2: Choose Format */}
        <section className="exportSection">
          <div className="exportSection__header">
            <div className="exportSection__number">2</div>
            <div className="exportSection__title">Chọn định dạng</div>
          </div>
          <div className="formatGrid">
            {FORMAT_OPTIONS.map((opt) => (
              <FormatOption
                key={opt.value}
                active={format === opt.value}
                option={opt}
                onClick={() => setFormat(opt.value)}
              />
            ))}
          </div>
        </section>

        {/* Step 3: Choose Period */}
        <section className="exportSection">
          <div className="exportSection__header">
            <div className="exportSection__number">3</div>
            <div className="exportSection__title">Chọn thời gian</div>
          </div>

          <div className="periodSelector">
            {/* Quick Select */}
            <div className="quickSelect">
              <div className="quickSelect__label">Chọn nhanh:</div>
              <button
                className="quickSelect__btn"
                onClick={onPickThisMonth}
              >
                <span>📅</span>
                <span>Tháng này</span>
              </button>
              <button
                className="quickSelect__btn"
                onClick={onPickPrevMonth}
              >
                <span>◀️</span>
                <span>Tháng trước</span>
              </button>
            </div>

            {/* Custom Select */}
            <div className="customSelect">
              <div className="inputGroup">
                <label className="inputGroup__label">Tháng</label>
                <select
                  className="inputGroup__select"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inputGroup">
                <label className="inputGroup__label">Năm</label>
                <select
                  className="inputGroup__select"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => y0 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Summary & Export */}
        <section className="exportSummary">
          <div className="summaryCard">
            <div className="summaryCard__header">
              <div className="summaryCard__title">📦 Thông tin export</div>
            </div>
            <div className="summaryCard__content">
              <div className="summaryItem">
                <div className="summaryItem__label">Loại dữ liệu</div>
                <div className="summaryItem__value">
                  {activeType?.icon} {activeType?.title}
                </div>
              </div>
              <div className="summaryItem">
                <div className="summaryItem__label">Định dạng</div>
                <div className="summaryItem__value">
                  {FORMAT_OPTIONS.find(f => f.value === format)?.icon} {format.toUpperCase()}
                </div>
              </div>
              <div className="summaryItem">
                <div className="summaryItem__label">Thời gian</div>
                <div className="summaryItem__value">
                  {pad2(month)}/{year}
                </div>
              </div>
              <div className="summaryItem">
                <div className="summaryItem__label">Tên file</div>
                <div className="summaryItem__value summaryItem__value--filename">
                  {filename}
                </div>
              </div>
            </div>
          </div>

          <button
            className="exportBtn"
            onClick={downloadExport}
            disabled={downloading || !canExport}
            title={!canExport ? canExportReason : "Tải xuống file"}
          >
            <span className="exportBtn__icon">
              {downloading ? "⏳" : "⬇️"}
            </span>
            <span className="exportBtn__text">
              {downloading ? "Đang export..." : "Export ngay"}
            </span>
          </button>
        </section>

        {/* Tips */}
        <div className="tipsCard">
          <div className="tipsCard__icon">💡</div>
          <div className="tipsCard__content">
            <div className="tipsCard__title">Mẹo sử dụng</div>
            <ul className="tipsCard__list">
              <li><strong>CSV:</strong> Nhẹ, nhanh, phù hợp để import vào hệ thống khác</li>
              <li><strong>Excel:</strong> Đẹp, chuyên nghiệp, dễ xem và chia sẻ</li>
              <li>Kiểm tra font tiếng Việt khi mở file để hiển thị đúng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}