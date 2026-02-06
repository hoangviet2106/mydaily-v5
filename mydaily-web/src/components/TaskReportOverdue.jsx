import { useEffect, useState } from "react";
import { fetchTaskOverdue } from "../api/taskreport";
import "../TaskReportComponents.css";

function OverdueTaskCard({ task }) {
  const daysOverdue = task.due_date
    ? Math.floor((new Date() - new Date(task.due_date)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="overdueCard">
      <div className="overdueCard__header">
        <div className="overdueCard__priority">
          {daysOverdue > 7 ? "🔴" : daysOverdue > 3 ? "🟡" : "🟢"}
        </div>
        <div className="overdueCard__title">{task.title}</div>
      </div>
      <div className="overdueCard__footer">
        <div className="overdueCard__date">
          <span className="overdueCard__dateLabel">Đến hạn:</span>
          <span className="overdueCard__dateValue">
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        </div>
        <div className="overdueCard__days">
          {daysOverdue > 0 && (
            <span className="overdueCard__badge">
              Trễ {daysOverdue} ngày
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskReportOverdue() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTaskOverdue({ limit: 10 });
        setItems(res.items || []);
      } catch (err) {
        setErr(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load overdue tasks"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="overdueLoading">
        <div className="overdueLoading__card" />
        <div className="overdueLoading__card" />
        <div className="overdueLoading__card" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="reportError">
        <div className="reportError__icon">❌</div>
        <div className="reportError__title">Không thể tải dữ liệu</div>
        <div className="reportError__message">{err}</div>
        <button className="reportError__retry" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="emptyState">
        <div className="emptyState__icon">🎉</div>
        <div className="emptyState__title">Không có task trễ hạn</div>
        <div className="emptyState__message">
          Tuyệt vời! Bạn đang quản lý thời gian rất tốt.
        </div>
        <div className="emptyState__tips">
          <div className="emptyState__tipTitle">💡 Mẹo duy trì:</div>
          <ul className="emptyState__tipList">
            <li>Kiểm tra tasks mỗi sáng</li>
            <li>Ưu tiên tasks quan trọng</li>
            <li>Đặt deadline thực tế</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="taskReportOverdue">
      {/* Header Stats */}
      <div className="overdueHeader">
        <div className="overdueHeader__stat">
          <div className="overdueHeader__icon">⚠️</div>
          <div className="overdueHeader__content">
            <div className="overdueHeader__value">{items.length}</div>
            <div className="overdueHeader__label">Tasks trễ hạn</div>
          </div>
        </div>
        <div className="overdueHeader__action">
          <button className="overdueHeader__btn">
            <span>📋</span>
            <span>Xem tất cả tasks</span>
          </button>
        </div>
      </div>

      {/* Priority Guide */}
      <div className="priorityGuide">
        <div className="priorityGuide__title">Mức độ ưu tiên:</div>
        <div className="priorityGuide__items">
          <div className="priorityGuide__item">
            <span className="priorityGuide__icon">🔴</span>
            <span>Trễ {">"} 7 ngày</span>
          </div>
          <div className="priorityGuide__item">
            <span className="priorityGuide__icon">🟡</span>
            <span>Trễ 3-7 ngày</span>
          </div>
          <div className="priorityGuide__item">
            <span className="priorityGuide__icon">🟢</span>
            <span>Trễ {"<"} 3 ngày</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="overdueList">
        {items.map((task) => (
          <OverdueTaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Action Footer */}
      <div className="overdueFooter">
        <div className="overdueFooter__icon">💪</div>
        <div className="overdueFooter__content">
          <div className="overdueFooter__title">Hành động ngay!</div>
          <div className="overdueFooter__text">
            Ưu tiên xử lý các tasks trễ hạn để không bị tích tụ công việc
          </div>
        </div>
      </div>
    </div>
  );
}