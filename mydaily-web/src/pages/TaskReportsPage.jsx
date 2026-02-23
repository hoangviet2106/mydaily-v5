// src/pages/TaskReportsPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskReportSummary from "../components/TaskReportSummary";
import TaskReportTrend from "../components/TaskReportTrend";
import TaskReportOverdue from "../components/TaskReportOverdue";
import { AppIcon } from "../icons"; // ✅ NEW
import "../TaskReportsPage.css";

const TABS = [
  { key: "summary", label: "Tổng Quan", icon: "reportsSummary", desc: "Số liệu tổng hợp", color: "purple", premiumOnly: false },
  { key: "trend", label: "Xu Hướng", icon: "reportsTrend", desc: "Biểu đồ theo thời gian", color: "blue", premiumOnly: true },
  { key: "overdue", label: "Trễ Hạn", icon: "reportsOverdue", desc: "Tasks quá deadline", color: "orange", premiumOnly: true },
];

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function TabButton({ active, tab, onClick, locked }) {
  return (
    <button
      className={[
        `reportTab reportTab--${tab.color}`,
        active ? "reportTab--active" : "",
        locked ? "reportTab--locked" : "",
      ].join(" ")}
      onClick={() => {
        if (locked) return;
        onClick?.();
      }}
      type="button"
      title={locked ? "Chỉ dành cho PREMIUM" : tab.desc}
    >
      <div className="reportTab__icon">
        <AppIcon name={tab.icon} size={22} tone={tab.color} />
      </div>

      <div className="reportTab__content">
        <div className="reportTab__label">
          {tab.label}{" "}
          {locked ? (
            <span className="lockChip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <AppIcon name="lock" size={16} tone="neutral" />
              <span>Premium</span>
            </span>
          ) : null}
        </div>
        <div className="reportTab__desc">{tab.desc}</div>
      </div>

      {active && !locked && <div className="reportTab__indicator" />}
    </button>
  );
}

function UpgradeBanner({ onUpgrade }) {
  return (
    <div className="upgradeBanner" role="alert">
      <div className="upgradeBanner__left">
        <div className="upgradeBanner__warn">
          <AppIcon name="warning" size={22} tone="warn" />
        </div>

        <div className="upgradeBanner__text">
          <div className="upgradeBanner__title">Nâng cấp để sử dụng</div>
          <div className="upgradeBanner__desc">
            Bạn đang ở gói <b>FREE</b>. Tính năng Analytics/Export chỉ dành cho <b>PREMIUM</b>.
          </div>
        </div>
      </div>

      <button className="upgradeBanner__btn" type="button" onClick={onUpgrade}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <AppIcon name="crown" size={18} tone="premium" />
          <span>Nâng cấp ngay</span>
          <AppIcon name="arrow" size={18} tone="neutral" />
        </span>
      </button>
    </div>
  );
}

function LockedValue() {
  return (
    <span className="lockedValue" title="Chỉ dành cho PREMIUM">
      <span className="lockedValue__icon" style={{ display: "inline-flex" }}>
        <AppIcon name="lock" size={16} tone="neutral" />
      </span>
      <span className="lockedValue__text">Premium</span>
    </span>
  );
}

function LockedPanel({ onUpgrade }) {
  return (
    <div className="lockedPanel">
      <div className="lockedPanel__icon">
        <AppIcon name="lock" size={26} tone="neutral" />
      </div>
      <div className="lockedPanel__title">Analytics chỉ dành cho PREMIUM</div>
      <div className="lockedPanel__desc">
        Nâng cấp để xem toàn bộ số liệu, biểu đồ xu hướng và danh sách trễ hạn.
      </div>
      <button className="lockedPanel__btn" type="button" onClick={onUpgrade}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <AppIcon name="crown" size={18} tone="premium" />
          <span>Nâng cấp ngay</span>
          <AppIcon name="arrow" size={18} tone="neutral" />
        </span>
      </button>
    </div>
  );
}

export default function TaskReportsPage() {
  const [activeTab, setActiveTab] = useState("summary");
  const navigate = useNavigate();

  const accountType = useMemo(() => {
    const token = localStorage.getItem("token");
    const payload = decodeJwtPayload(token);
    return String(payload?.accountType || "FREE").toUpperCase();
  }, []);

  const isFree = accountType !== "PREMIUM";

  const currentTab = useMemo(() => TABS.find((t) => t.key === activeTab) || TABS[0], [activeTab]);

  return (
    <div className="taskReportsPage">
      {/* Banner cho FREE */}
      {isFree && <UpgradeBanner onUpgrade={() => navigate("/pricing")} />}

      {/* Page Header */}
      <div className="pageHeader">
        <div className="pageHeader__content">
          <div className="dashHeader__wave">📊</div>
          <div>
            <h1 className="pageHeader__title">Báo Cáo Công Việc</h1>
            <p className="pageHeader__subtitle">Theo dõi năng suất và tiến độ công việc của bạn</p>
          </div>
        </div>

        <div className="pageHeader__badge">
          <span className="pageHeader__badgeIcon">
            <AppIcon name="analytics" size={18} tone="pink" />
          </span>
          <span>Analytics</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="reportTabsContainer">
        <div className="reportTabs">
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              tab={tab}
              locked={isFree && tab.premiumOnly}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </div>

      {/* Current Tab Info */}
      <div className="reportContext">
        <div className="reportContext__left">
          <div className="reportContext__icon">
            <AppIcon name={currentTab.icon} size={24} tone={currentTab.color} />
          </div>
          <div>
            <div className="reportContext__title">{currentTab.label}</div>
            <div className="reportContext__desc">{currentTab.desc}</div>
          </div>
        </div>

        <div className="reportContext__right">
          {/* Export bị khóa cho FREE */}
          <button
            className="iconBtn"
            title={isFree ? "Export chỉ dành cho PREMIUM" : "Export"}
            disabled={isFree}
            onClick={() => {
              if (isFree) return;
              // TODO: gọi export
            }}
            style={isFree ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            <AppIcon name="export" size={18} tone={isFree ? "neutral" : "blue"} />
          </button>

          <button className="iconBtn" title="Làm mới dữ liệu">
            <AppIcon name="reload" size={18} tone="neutral" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
<div className="reportContent">
  <div className="reportContentWrapper">
    {activeTab === "summary" && <TaskReportSummary />}

    {activeTab === "trend" && (isFree ? <LockedPanel onUpgrade={() => navigate("/pricing")} /> : <TaskReportTrend />)}

    {activeTab === "overdue" && (isFree ? <LockedPanel onUpgrade={() => navigate("/pricing")} /> : <TaskReportOverdue />)}
  </div>
</div>

      {/* Footer */}
      <div className="reportFooter">
        <div className="quickStat">
          <div className="quickStat__icon">
            <AppIcon name="checkCircle" size={18} tone="ok" />
          </div>
          <div className="quickStat__content">
            <div className="quickStat__label">Đang xem</div>
            <div className="quickStat__value">{isFree ? <LockedValue /> : currentTab.label}</div>
          </div>
        </div>

        <div className="quickStat">
          <div className="quickStat__icon">
            <AppIcon name="calendar" size={18} tone="blue" />
          </div>
          <div className="quickStat__content">
            <div className="quickStat__label">Cập nhật</div>
            <div className="quickStat__value">{isFree ? <LockedValue /> : "Realtime"}</div>
          </div>
        </div>

        <div className="quickStat">
          <div className="quickStat__icon">
            <AppIcon name="status" size={18} tone="purple" />
          </div>
          <div className="quickStat__content">
            <div className="quickStat__label">Trạng thái</div>
            <div className="quickStat__value">{isFree ? <LockedValue /> : "Active"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
