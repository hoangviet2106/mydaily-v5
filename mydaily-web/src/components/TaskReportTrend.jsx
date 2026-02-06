import { useEffect, useState } from "react";
import { fetchTaskTrend } from "../api/taskreport";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import "../TaskReportComponents.css";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chartTooltip">
        <div className="chartTooltip__date">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="chartTooltip__item" style={{ color: entry.color }}>
            <span className="chartTooltip__label">{entry.name}:</span>
            <span className="chartTooltip__value">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TaskReportTrend() {
  const [data, setData] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTaskTrend({ days: 30 });
        setData(res.points || []);
      } catch (err) {
        setErr(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load trend"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="chartSkeleton">
        <div className="chartSkeleton__header" />
        <div className="chartSkeleton__chart" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="reportError">
        <div className="reportError__icon">❌</div>
        <div className="reportError__title">Không thể tải biểu đồ</div>
        <div className="reportError__message">{err}</div>
        <button className="reportError__retry" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalCreated = data.reduce((sum, d) => sum + (d.created || 0), 0);
  const totalCompleted = data.reduce((sum, d) => sum + (d.completedCreated || 0), 0);
  const avgCreated = data.length > 0 ? (totalCreated / data.length).toFixed(1) : 0;
  const avgCompleted = data.length > 0 ? (totalCompleted / data.length).toFixed(1) : 0;

  return (
    <div className="taskReportTrend">
      {/* Stats Summary */}
      <div className="trendStats">
        <div className="trendStat trendStat--primary">
          <div className="trendStat__icon">📝</div>
          <div className="trendStat__content">
            <div className="trendStat__label">Tổng tạo</div>
            <div className="trendStat__value">{totalCreated}</div>
            <div className="trendStat__avg">~{avgCreated}/ngày</div>
          </div>
        </div>
        <div className="trendStat trendStat--success">
          <div className="trendStat__icon">✅</div>
          <div className="trendStat__content">
            <div className="trendStat__label">Tổng hoàn thành</div>
            <div className="trendStat__value">{totalCompleted}</div>
            <div className="trendStat__avg">~{avgCompleted}/ngày</div>
          </div>
        </div>
        <div className="trendStat trendStat--info">
          <div className="trendStat__icon">📊</div>
          <div className="trendStat__content">
            <div className="trendStat__label">Số ngày</div>
            <div className="trendStat__value">{data.length}</div>
            <div className="trendStat__avg">30 ngày gần nhất</div>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="chartCard">
        <div className="chartCard__header">
          <div>
            <div className="chartCard__title">📈 Xu hướng tạo & hoàn thành task</div>
            <div className="chartCard__subtitle">Thống kê trong 30 ngày gần nhất</div>
          </div>
          <div className="chartCard__legend">
            <div className="legendItem legendItem--primary">
              <div className="legendItem__dot" />
              <span>Tasks tạo</span>
            </div>
            <div className="legendItem legendItem--success">
              <div className="legendItem__dot" />
              <span>Tasks hoàn thành</span>
            </div>
          </div>
        </div>

        <div className="chartCard__body">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 4 }}
                activeDot={{ r: 6, fill: '#667eea' }}
                name="Tạo mới"
                fill="url(#colorCreated)"
              />
              <Line
                type="monotone"
                dataKey="completedCreated"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
                name="Hoàn thành"
                fill="url(#colorCompleted)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="trendInsights">
        <div className="trendInsights__icon">💡</div>
        <div className="trendInsights__content">
          <div className="trendInsights__title">Phân tích xu hướng</div>
          <div className="trendInsights__text">
            {totalCompleted >= totalCreated * 0.8 ? (
              <span>Tỷ lệ hoàn thành tốt! Bạn đang theo kịp tiến độ công việc. 🎯</span>
            ) : totalCompleted >= totalCreated * 0.5 ? (
              <span>Tốc độ hoàn thành ổn định. Hãy cố gắng tăng tốc một chút! 💪</span>
            ) : (
              <span>Có vẻ công việc đang tích tụ. Ưu tiên hoàn thành các task quan trọng nhất! ⚠️</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}