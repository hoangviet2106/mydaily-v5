// src/components/TaskReportSummary.jsx
import { useEffect, useState } from "react";
import { fetchTaskSummary } from "../api/taskreport";
import { AppIcon } from "../icons"; // ✅ NEW
import "../TaskReportComponents.css";

function StatCard({ iconName, label, value, hint, color, trend }) {
  return (
    <div className={`statCard statCard--${color}`}>
      <div className="statCard__header">
        <div className="statCard__icon">
          <AppIcon name={iconName} size={22} tone={color} />
        </div>
        {trend && <div className="statCard__trend">{trend}</div>}
      </div>
      <div className="statCard__body">
        <div className="statCard__label">{label}</div>
        <div className="statCard__value">{value}</div>
        <div className="statCard__hint">{hint}</div>
      </div>
    </div>
  );
}

export default function TaskReportSummary() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTaskSummary({ days: 30 });
        setData(res);
      } catch (err) {
        setErr(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load task summary"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="reportSkeleton">
        <div className="skeletonCard" />
        <div className="skeletonCard" />
        <div className="skeletonCard" />
        <div className="skeletonCard" />
        <div className="skeletonCard" />
        <div className="skeletonCard" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="reportError">
        <div className="reportError__icon">
          <AppIcon name="warning" size={26} tone="danger" />
        </div>
        <div className="reportError__title">Không thể tải dữ liệu</div>
        <div className="reportError__message">{err}</div>
        <button className="reportError__retry" onClick={() => window.location.reload()}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <AppIcon name="reload" size={18} tone="neutral" />
            <span>Thử lại</span>
          </span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  const completionRate = data.completionRate || 0;

  return (
    <div className="taskReportSummary">
      {/* Overview Banner */}
      <div className="summaryBanner">
        <div className="summaryBanner__content">
          <div className="summaryBanner__icon">
            <AppIcon name="reportsSummary" size={24} tone="purple" />
          </div>
          <div>
            <div className="summaryBanner__title">Tổng quan 30 ngày</div>
            <div className="summaryBanner__subtitle">
              Tỷ lệ hoàn thành: <strong>{completionRate}%</strong>
            </div>
          </div>
        </div>

        <div className="summaryBanner__progress">
          <div className="progressBar">
            <div className="progressBar__fill" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="progressBar__label">{completionRate}% hoàn thành</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="statsGrid">
        <StatCard
          iconName="reportTotal"
          label="Tổng công việc"
          value={data.totalCreated}
          hint="Tạo trong 30 ngày"
          color="blue"
        />
        <StatCard
          iconName="reportDone"
          label="Hoàn thành"
          value={data.completed}
          hint={`${completionRate}% tổng số`}
          color="green"
        />
        <StatCard
          iconName="reportOpen"
          label="Đang mở"
          value={data.open}
          hint="Chưa hoàn thành"
          color="purple"
        />
        <StatCard
          iconName="reportsOverdue"
          label="Trễ hạn"
          value={data.overdue}
          hint="Quá deadline"
          color="danger"
        />
        <StatCard
          iconName="reportDueToday"
          label="Hạn hôm nay"
          value={data.dueToday}
          hint="Cần xử lý gấp"
          color="orange"
        />
      </div>

      {/* Insights */}
      <div className="insightsCard">
        <div className="insightsCard__header">
          <div className="insightsCard__icon">
            <AppIcon name="sparkles" size={20} tone="pink" />
          </div>
          <div className="insightsCard__title">Phân tích</div>
        </div>

        <div className="insightsCard__content">
          {completionRate >= 80 && (
            <div className="insight insight--success">
              <span className="insight__icon">
                <AppIcon name="trophy" size={18} tone="ok" />
              </span>
              <span className="insight__text">
                Tuyệt vời! Bạn đang duy trì tỷ lệ hoàn thành cao ({completionRate}%)
              </span>
            </div>
          )}

          {data.overdue > 0 && (
            <div className="insight insight--warning">
              <span className="insight__icon">
                <AppIcon name="reportsOverdue" size={18} tone="danger" />
              </span>
              <span className="insight__text">
                Bạn có {data.overdue} task trễ hạn. Ưu tiên xử lý những task này trước!
              </span>
            </div>
          )}

          {data.dueToday > 0 && (
            <div className="insight insight--info">
              <span className="insight__icon">
                <AppIcon name="target" size={18} tone="orange" />
              </span>
              <span className="insight__text">
                Hôm nay có {data.dueToday} task đến hạn. Tập trung hoàn thành!
              </span>
            </div>
          )}

          {data.open === 0 && data.overdue === 0 && (
            <div className="insight insight--success">
              <span className="insight__icon">
                <AppIcon name="sparkles" size={18} tone="ok" />
              </span>
              <span className="insight__text">Hoàn hảo! Bạn không có task nào đang chờ xử lý.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
