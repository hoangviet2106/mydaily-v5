import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

/* ================= Icons ================= */
function Icon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path {...stroke} d="M3 12h7V3H3v9zM14 21h7V12h-7v9zM14 3h7v7h-7V3zM3 14h7v7H3v-7z" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...common}>
          <path {...stroke} d="M9 11l3 3L22 4" />
          <path {...stroke} d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "taskreports":
      return (
        <svg {...common}>
          <path {...stroke} d="M3 3h18v18H3z" />
          <path {...stroke} d="M7 13h3M7 9h7M7 17h5" />
        </svg>
      );
    case "expenses":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "categories":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="1" fill="currentColor" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case "budgets":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 1v22M7 6h10M7 18h10M8 10h8M8 14h8" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 19V5M4 19h16M8 17v-6M12 17V7M16 17v-4" />
        </svg>
      );
    case "export":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 3v12M8 7l4-4 4 4M4 21h16" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <path {...stroke} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" {...stroke} />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" {...stroke} />
          <path {...stroke} d="M4 21v-1a7 7 0 0 1 14 0v1M18 8h3M19.5 6.5v3" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path {...stroke} d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path {...stroke} d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...common}>
          <path {...stroke} d="M6 9l6 6 6-6" />
        </svg>
      );

    default:
      return null;
  }
}

function TopNavLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) => (isActive ? "topNavLink topNavLink--active" : "topNavLink")}
    >
      <span className="topNavLink__icon">
        <Icon name={icon} />
      </span>
      <span className="topNavLink__label">{label}</span>
    </NavLink>
  );
}

/* ================= helpers ================= */
function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
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

function normalizeAccountType(me, token) {
  const raw =
    me?.account_type ??
    me?.accountType ??
    me?.plan ??
    me?.tier ??
    me?.subscription ??
    (typeof me?.is_premium === "boolean" ? (me.is_premium ? "PREMIUM" : "FREE") : undefined);

  if (raw) return String(raw).toUpperCase();

  const payload = token ? decodeJwtPayload(token) : null;
  const raw2 =
    payload?.account_type ??
    payload?.accountType ??
    payload?.plan ??
    payload?.tier ??
    payload?.subscription ??
    (typeof payload?.is_premium === "boolean" ? (payload.is_premium ? "PREMIUM" : "FREE") : undefined);

  if (raw2) return String(raw2).toUpperCase();
  return "FREE";
}

async function fetchMeApi() {
  const res = await api.get("/users/me");
  return res.data;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const refreshMe = async () => {
    const t = localStorage.getItem("token");
    if (!t) {
      setMe(null);
      setToken(null);
      setMeLoading(false);
      return;
    }

    setMeLoading(true);
    try {
      const data = await fetchMeApi();
      setMe(data?.user ?? data ?? null);
      setToken(t);
    } catch (e) {
      setMe(null);
      setToken(null);
    } finally {
      setMeLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    setToken(null);
    navigate("/", { replace: true });
  };

  const accountType = useMemo(() => normalizeAccountType(me, token), [me, token]);

  const displayName = useMemo(() => {
    const name = String(me?.name || "").trim();
    if (name) return name;

    const email = String(me?.email || "").trim();
    if (email && email.includes("@")) return email.split("@")[0];

    return "Bạn";
  }, [me]);

  return (
    <div className="appShell">
      {/* Modern Top Navigation Bar */}
      <header className="topNav">
        {/* Left: Logo + Brand */}
        <div className="topNav__brand">
          <div className="topNav__logo">
            <Icon name="sparkles" />
          </div>
          <div className="topNav__brandText">
            <div className="topNav__title">MyDaily</div>
            <div className="topNav__subtitle">Sống thông minh ✨</div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="topNav__menu">
          <div className="topNav__menuInner">
            <TopNavLink to="/dashboard" icon="dashboard" label="Trang chủ" />
            <TopNavLink to="/tasks" icon="tasks" label="Công việc" />
            <TopNavLink to="/task-reports" icon="taskreports" label="Báo cáo CV" />
            <TopNavLink to="/expenses" icon="expenses" label="Chi tiêu" />
            <TopNavLink to="/categories" icon="categories" label="Danh mục" />
            <TopNavLink to="/budgets" icon="budgets" label="Ngân sách" />
            <TopNavLink to="/reports" icon="reports" label="Báo cáo" />
            <TopNavLink to="/export" icon="export" label="Export" />
            {me?.role === "ADMIN" && (
              <TopNavLink to="/admin/users" icon="admin" label="Admin" />
            )}
          </div>
        </nav>

        {/* Right: User Section */}
        <div className="topNav__user">
          {/* Plan Badge */}
          <div className={`topNav__planBadge ${accountType === "PREMIUM" ? "topNav__planBadge--premium" : ""}`}>
            <span className="topNav__planIcon">{accountType === "PREMIUM" ? "👑" : "🚀"}</span>
            <span className="topNav__planText">{meLoading ? "..." : accountType}</span>
          </div>

          {/* User Menu */}
          <div className="topNav__userMenu">
            <button 
              className="topNav__userBtn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className="topNav__userInfo">
                <span className="topNav__greeting">Chào,</span>
                <span className="topNav__userName">{meLoading ? "..." : displayName}</span>
              </div>
              {me?.avatar_url ? (
                <img
                  src={me.avatar_url}
                  alt={displayName}
                  className="topNav__avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="topNav__avatar topNav__avatar--placeholder">
                  {(displayName || "M").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="topNav__avatarStatus" />
              <Icon name="chevronDown" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div 
                  className="topNav__dropdownOverlay"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="topNav__dropdown">
                  <div className="topNav__dropdownHeader">
                    <div className="topNav__dropdownAvatar">
                      {me?.avatar_url ? (
                        <img src={me.avatar_url} alt={displayName} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="topNav__avatar--placeholder">
                          {(displayName || "M").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="topNav__dropdownInfo">
                      <div className="topNav__dropdownName">{displayName}</div>
                      <div className="topNav__dropdownEmail">{me?.email}</div>
                    </div>
                  </div>

                  <div className="topNav__dropdownDivider" />

                  <NavLink 
                    to="/profile" 
                    className="topNav__dropdownItem"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <Icon name="profile" />
                    <span>Thông tin cá nhân</span>
                  </NavLink>

                  {accountType === "FREE" && (
                    <button className="topNav__dropdownItem topNav__dropdownItem--upgrade">
                      <span>👑</span>
                      <span>Nâng cấp Pro</span>
                    </button>
                  )}

                  <div className="topNav__dropdownDivider" />

                  <button 
                    className="topNav__dropdownItem topNav__dropdownItem--danger"
                    onClick={onLogout}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="topNav__mobileBtn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Icon name={isMobileMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="mobileNavOverlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobileNav">
            <div className="mobileNav__header">
              <div className="mobileNav__user">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt={displayName} className="mobileNav__avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="mobileNav__avatar">
                    {(displayName || "M").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="mobileNav__info">
                  <div className="mobileNav__name">{displayName}</div>
                  <div className="mobileNav__plan">{accountType}</div>
                </div>
              </div>
            </div>

            <nav className="mobileNav__menu">
              <TopNavLink to="/dashboard" icon="dashboard" label="Trang chủ" />
              <TopNavLink to="/tasks" icon="tasks" label="Công việc" />
              <TopNavLink to="/task-reports" icon="taskreports" label="Báo cáo CV" />
              <TopNavLink to="/expenses" icon="expenses" label="Chi tiêu" />
              <TopNavLink to="/categories" icon="categories" label="Danh mục" />
              <TopNavLink to="/budgets" icon="budgets" label="Ngân sách" />
              <TopNavLink to="/reports" icon="reports" label="Báo cáo" />
              <TopNavLink to="/export" icon="export" label="Export" />
              <TopNavLink to="/profile" icon="profile" label="Profile" />
              {me?.role === "ADMIN" && (
                <TopNavLink to="/admin/users" icon="admin" label="Admin" />
              )}
            </nav>

            <div className="mobileNav__footer">
              <button className="mobileNav__logoutBtn" onClick={onLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="mainContent">
        <div className="mainContent__inner">
          <Outlet context={{ accountType, me, meLoading, refreshMe }} />
        </div>
      </main>
    </div>
  );
}