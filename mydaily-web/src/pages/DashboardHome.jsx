import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useOutletContext, useNavigate } from "react-router-dom";
import { AppIcon } from "../icons";
import "../DashboardHome.css";

export default function DashboardHome() {
  const { me, meLoading } = useOutletContext() || {};
  const navigate = useNavigate();
  const [basic, setBasic] = useState(null);
  const [streak, setStreak] = useState(null);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/dashboard/basic");
        if (!alive) return;
        setBasic(res.data);
        setStreak(res.data?.streak ?? null);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load dashboard.";
        if (!alive) return;
        setError(msg);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const todayText = useMemo(() => {
    try {
      const d = new Date();
      return d.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, []);

  if (error) {
    return (
      <div className="dashContainer">
        <div className="errorCard">
          <div className="errorCard__icon">
            <AppIcon name="warning" size={22} tone="warn" />
          </div>
          <div className="errorCard__message">{error}</div>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            <AppIcon name="reload" size={16} tone="neutral" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!basic) {
    return (
      <div className="dashContainer">
        <div className="dashHeader">
          <div className="dashHeader__greeting">
            <div className="dashHeader__title">{greeting}</div>
            <div className="dashHeader__subtitle">{todayText}</div>
          </div>
        </div>

        <div className="dashGrid">
          <div className="skeleton skeleton--hero" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      </div>
    );
  }

  const t = basic.tasksToday;
  const spendingMonth = basic.financeThisMonth?.spendingTotal ?? 0;
  const completionRate = t.completionRatePercent || 0;

  return (
    <div className="dashContainer">
      {/* Header Section */}
      <div className="dashHeader">
        <div className="dashHeader__greeting">
          <div className="dashHeader__wave">👋</div>
          <div>
            <div className="dashHeader__title">
              {greeting}, {meLoading ? "..." : me?.name || "bạn"}
            </div>
            <div className="dashHeader__subtitle">{todayText}</div>
          </div>
        </div>

        <div className="dashHeader__actions">
          <button className="btn btn--secondary" onClick={() => navigate("/tasks")}>
            <AppIcon name="tasks" size={16} tone="blue" />
            <span>Xem Tasks</span>
          </button>

          <button className="btn btn--primary" onClick={() => navigate("/expenses")}>
            <AppIcon name="addExpense" size={16} tone="pink" />
            <span>Thêm Chi Tiêu</span>
          </button>
        </div>
      </div>

      {/* Streak Widget */}
      {streak && <StreakWidget streak={streak} />}

      {/* Hero Stats Grid */}
      <div className="heroGrid">
        <HeroCard
          title="Tasks Hôm Nay"
          value={t.total}
          subtitle={`${t.completed} hoàn thành`}
          icon={<AppIcon name="heroTasks" size={22} tone="purple" />}
          gradient="purple"
          progress={completionRate}
          onClick={() => navigate("/tasks")}
        />

        <HeroCard
          title="Tỷ Lệ Hoàn Thành"
          value={`${completionRate}%`}
          subtitle={t.total > 0 ? "Tiếp tục phát huy!" : "Chưa có task"}
          icon={<AppIcon name="heroTarget" size={22} tone="blue" />}
          gradient="blue"
          onClick={() => navigate("/tasks")}
        />

        <HeroCard
          title="Chi Tiêu Tháng Này"
          value={formatVND(spendingMonth)}
          subtitle={`${basic.financeThisMonth?.categoriesCount || 0} danh mục`}
          icon={<AppIcon name="heroCard" size={22} tone="pink" />}
          gradient="pink"
          onClick={() => navigate("/expenses")}
        />
      </div>

      {/* Quick Actions */}
      <section className="quickActions">
        <div className="sectionHeader">
          <h2 className="sectionHeader__title">
            <AppIcon name="quick" size={18} tone="purple" /> Thao Tác Nhanh
          </h2>
        </div>

        <div className="quickActions__grid">
          <QuickActionCard
            icon={<AppIcon  name="add" size={22} tone="purple" />}
            title="Tạo Task Mới"
            description="Thêm công việc cần làm"
            color="purple"
            onClick={() => navigate("/tasks")}
          />

          <QuickActionCard
            icon={<AppIcon name="quickExpense" size={22} tone="pink" />}
            title="Ghi Chi Tiêu"
            description="Theo dõi tài chính"
            color="pink"
            onClick={() => navigate("/expenses")}
          />

          <QuickActionCard
            icon={<AppIcon name="quickReport" size={22} tone="blue" />}
            title="Xem Báo Cáo"
            description="Phân tích hiệu suất"
            color="blue"
            onClick={() => navigate("/reports")}
          />

          <QuickActionCard
            icon={<AppIcon name="quickBudget" size={22} tone="green" />}
            title="Quản Lý Ngân Sách"
            description="Đặt mục tiêu tài chính"
            color="green"
            onClick={() => navigate("/budgets")}
          />
        </div>
      </section>

      {/* Detailed Stats */}
      <div className="statsGrid">
        <StatsCard
          title="Năng Suất"
          icon={<AppIcon name="productivity" size={18} tone="purple" />}
          gradient="purple"
        >
          <StatItem label="Tasks hôm nay" value={t.total} />
          <StatItem label="Đã hoàn thành" value={t.completed} />
          <StatItem label="Đang làm" value={t.total - t.completed} />
          <StatItem label="Tỷ lệ" value={`${completionRate}%`} highlight />
        </StatsCard>

        <StatsCard
          title="Tài Chính"
          icon={<AppIcon name="finance" size={18} tone="pink" />}
          gradient="pink"
        >
          <StatItem label="Chi tiêu tháng" value={formatVND(spendingMonth)} />
          <StatItem label="Số danh mục" value={basic.financeThisMonth?.categoriesCount || 0} />
          <StatItem
            label="Trạng thái"
            value={spendingMonth === 0 ? "Chưa chi tiêu" : "Đang theo dõi"}
            highlight
          />
        </StatsCard>
      </div>

      {/* Motivational Quote */}
      <MotivationalCard completionRate={completionRate} tasksTotal={t.total} />
    </div>
  );
}

/* ==================== COMPONENTS ==================== */

function StreakWidget({ streak }) {
  if (!streak) return null;

  return (
    <div className="streakWidget">
      <div className="streakWidget__content">
        <div className="streakWidget__fire">🔥</div>

        <div className="streakWidget__info">
          <div className="streakWidget__number">{streak.current_streak}</div>
          <div className="streakWidget__label">ngày liên tiếp</div>
        </div>

        <div className="streakWidget__status">
          {!streak.today_done ? (
            <div className="streakWidget__warning">
              <span className="streakWidget__icon">
                <AppIcon name="quick" size={16} tone="warn" />
              </span>
              <span>Hoàn thành 1 task để giữ streak!</span>
            </div>
          ) : (
            <div className="streakWidget__success">
              <span className="streakWidget__icon">
                <AppIcon name="sparkles" size={16} tone="pink" />
              </span>
              <span>Đã giữ streak hôm nay!</span>
            </div>
          )}
        </div>
      </div>

      {streak.longest_streak > 0 && (
        <div className="streakWidget__record">
          <AppIcon name="trophy" size={16} tone="purple" /> Kỷ lục: {streak.longest_streak} ngày
        </div>
      )}
    </div>
  );
}

function HeroCard({ title, value, subtitle, icon, gradient, progress, onClick }) {
  return (
    <div className={`heroCard heroCard--${gradient}`} onClick={onClick}>
      <div className="heroCard__header">
        <div className="heroCard__icon">{icon}</div>
        <div className="heroCard__title">{title}</div>
      </div>

      <div className="heroCard__value">{value}</div>
      <div className="heroCard__subtitle">{subtitle}</div>

      {progress !== undefined && (
        <div className="heroCard__progress">
          <div className="heroCard__progressBar">
            <div className="heroCard__progressFill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="heroCard__arrow">
        <AppIcon name="arrow" size={18} tone="neutral" />
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, color, onClick }) {
  return (
    <div className={`quickActionCard quickActionCard--${color}`} onClick={onClick}>
      <div className="quickActionCard__icon">{icon}</div>
      <div className="quickActionCard__content">
        <div className="quickActionCard__title">{title}</div>
        <div className="quickActionCard__description">{description}</div>
      </div>
      <div className="quickActionCard__arrow">
        <AppIcon name="arrow" size={18} tone="muted" />
      </div>
    </div>
  );
}

function StatsCard({ title, icon, gradient, children }) {
  return (
    <div className={`statsCard statsCard--${gradient}`}>
      <div className="statsCard__header">
        <h3 className="statsCard__title">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {icon}
            <span>{title}</span>
          </span>
        </h3>
      </div>
      <div className="statsCard__content">{children}</div>
    </div>
  );
}

function StatItem({ label, value, highlight }) {
  return (
    <div className={`statItem ${highlight ? "statItem--highlight" : ""}`}>
      <div className="statItem__label">{label}</div>
      <div className="statItem__value">{value}</div>
    </div>
  );
}

function MotivationalCard({ completionRate, tasksTotal }) {
  const getMotivation = () => {
    if (tasksTotal === 0) {
      return {
        iconName: "heroTarget",
        tone: "blue",
        title: "Sẵn sàng bắt đầu!",
        message: "Tạo task đầu tiên để bắt đầu hành trình năng suất của bạn!",
      };
    }
    if (completionRate === 100) {
      return {
        iconName: "sparkles",
        tone: "pink",
        title: "Xuất sắc!",
        message: "Bạn đã hoàn thành tất cả tasks hôm nay. Tiếp tục phát huy!",
      };
    }
    if (completionRate >= 70) {
      return {
        iconName: "rocket",
        tone: "purple",
        title: "Làm tốt lắm!",
        message: "Chỉ còn chút nữa thôi, cố lên bạn nhé!",
      };
    }
    if (completionRate >= 40) {
      return {
        iconName: "rocket",
        tone: "blue",
        title: "Đang trên đà tốt!",
        message: "Tiếp tục duy trì nhịp độ này nhé!",
      };
    }
    return {
      iconName: "sparkles",
      tone: "purple",
      title: "Bắt đầu thôi!",
      message: "Mỗi bước nhỏ đều quan trọng. Hãy bắt đầu từng việc một!",
    };
  };

  const motivation = getMotivation();

  return (
    <div className="motivationalCard">
      <div className="motivationalCard__emoji">
        <AppIcon name={motivation.iconName} size={28} tone={motivation.tone} />
      </div>
      <div className="motivationalCard__content">
        <div className="motivationalCard__title">{motivation.title}</div>
        <div className="motivationalCard__message">{motivation.message}</div>
      </div>
    </div>
  );
}

/* ==================== HELPERS ==================== */

function formatVND(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M ₫";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K ₫";
  return num.toLocaleString("vi-VN") + " ₫";
}
