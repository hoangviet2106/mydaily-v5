import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./AdminUsersPage.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`au-badge au-badge--${tone}`}>{children}</span>;
}

function Icon({ name }) {
  // icon mini bằng emoji để khỏi phụ thuộc thư viện
  const map = {
    search: "🔎",
    users: "👥",
    mail: "✉️",
    name: "🪪",
    role: "🛡️",
    plan: "💎",
    ban: "⛔",
    ok: "✅",
    prev: "⬅️",
    next: "➡️",
    refresh: "🔄",
  };
  return <span className="au-ic" aria-hidden="true">{map[name] || "✨"}</span>;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (opts = {}) => {
    const s = opts.search ?? search;
    const p = opts.page ?? page;

    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/users", {
        params: { search: s, page: p, limit },
      });
      setUsers(res.data.users || []);
      setMeta({ total: res.data.total || 0, totalPages: res.data.totalPages || 1 });
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load({ search, page: 1 });
  };

  const totalLabel = useMemo(() => {
    const from = meta.total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, meta.total);
    return `${from}-${to} / ${meta.total}`;
  }, [meta.total, page]);

  const toast = (msg) => {
    // nhanh gọn: show error ở banner thay vì alert
    setErr(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBan = async (u) => {
    try {
      await api.patch(`/admin/users/${u.id}/ban`, { is_banned: !u.is_banned });
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed");
    }
  };

  const toggleRole = async (u) => {
    const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role: nextRole });
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed");
    }
  };

  const togglePlan = async (u) => {
    const nextPlan = u.account_type === "PREMIUM" ? "FREE" : "PREMIUM";
    try {
      await api.patch(`/admin/users/${u.id}/plan`, { account_type: nextPlan });
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="au">
      <div className="au__bg" aria-hidden="true" />

      <div className="au__wrap">
        <header className="auHeader">
          <div className="auHeader__left">
            <div className="auHeader__title">
              <Icon name="users" />
              <div>
                <h2>Admin • Người dùng</h2>
                <p>Quản lý quyền, gói, trạng thái ban — nhanh gọn, rõ ràng.</p>
              </div>
            </div>

            <div className="auStats">
              <div className="auStat">
                <div className="auStat__k">Tổng user</div>
                <div className="auStat__v">{meta.total}</div>
              </div>
              <div className="auStat">
                <div className="auStat__k">Hiển thị</div>
                <div className="auStat__v">{totalLabel}</div>
              </div>
              <div className="auStat">
                <div className="auStat__k">Trang</div>
                <div className="auStat__v">
                  {page} / {meta.totalPages}
                </div>
              </div>
            </div>
          </div>

          <div className="auHeader__right">
            <button
              className="auBtn auBtn--ghost"
              onClick={() => load({ page })}
              disabled={loading}
              type="button"
              title="Refresh"
            >
              <Icon name="refresh" /> Refresh
            </button>
          </div>
        </header>

        <section className="auCard">
          <div className="auToolbar">
            <form onSubmit={onSearchSubmit} className="auSearch">
              <div className="auSearch__box">
                <Icon name="search" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo email hoặc tên…"
                  className="auSearch__input"
                />
              </div>
              <button className="auBtn auBtn--primary" type="submit" disabled={loading}>
                Tìm kiếm
              </button>
            </form>

            <div className="auHint">
              <span className={`auDot ${loading ? "auDot--spin" : ""}`} />
              {loading ? "Đang tải dữ liệu…" : "Tip: tìm 'gmail' hoặc tên để lọc nhanh."}
            </div>
          </div>

          {err && (
            <div className="auAlert">
              <strong>Thông báo:</strong> {err}
            </div>
          )}

          <div className="auTableWrap">
            <table className="auTable">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tên</th>
                  <th>Vai trò</th>
                  <th>Gói</th>
                  <th>Ban</th>
                  <th className="auTable__actions">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const roleTone = u.role === "ADMIN" ? "violet" : "neutral";
                  const planTone = u.account_type === "PREMIUM" ? "gold" : "neutral";
                  const banTone = u.is_banned ? "red" : "green";

                  return (
                    <tr key={u.id}>
                      <td className="auMono">
                        <Icon name="mail" /> {u.email}
                      </td>

                      <td>
                        <div className="auUser">
                          <span className="auAvatar" aria-hidden="true">
                            {(u.name || u.email || "?").trim().slice(0, 1).toUpperCase()}
                          </span>
                          <div className="auUser__meta">
                            <div className="auUser__name">
                              {u.name || <span className="auDim">(no name)</span>}
                            </div>
                            <div className="auUser__sub">ID: <span className="auMono">{u.id}</span></div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge tone={roleTone}>
                          <Icon name="role" /> {u.role}
                        </Badge>
                      </td>

                      <td>
                        <Badge tone={planTone}>
                          <Icon name="plan" /> {u.account_type}
                        </Badge>
                      </td>

                      <td>
                        <Badge tone={banTone}>
                          <Icon name={u.is_banned ? "ban" : "ok"} /> {u.is_banned ? "BANNED" : "ACTIVE"}
                        </Badge>
                      </td>

                      <td className="auActions">
                        <button
                          type="button"
                          className={`auBtn auBtn--sm ${u.is_banned ? "auBtn--ok" : "auBtn--danger"}`}
                          onClick={() => toggleBan(u)}
                          disabled={loading}
                        >
                          {u.is_banned ? "Unban" : "Ban"}
                        </button>

                        <button
                          type="button"
                          className="auBtn auBtn--sm auBtn--ghost"
                          onClick={() => toggleRole(u)}
                          disabled={loading}
                        >
                          {u.role === "ADMIN" ? "Set USER" : "Set ADMIN"}
                        </button>

                        <button
                          type="button"
                          className="auBtn auBtn--sm auBtn--ghost"
                          onClick={() => togglePlan(u)}
                          disabled={loading}
                        >
                          {u.account_type === "PREMIUM" ? "Set FREE" : "Set PREMIUM"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="auEmpty">
                      Không có user phù hợp. Thử tìm từ khóa khác.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {loading && (
              <div className="auLoadingOverlay">
                <div className="auSpinner" />
                <div>Loading…</div>
              </div>
            )}
          </div>

          <div className="auPager">
            <button
              className="auBtn auBtn--ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              <Icon name="prev" /> Trước
            </button>

            <div className="auPager__center">
              Trang <b>{page}</b> / {meta.totalPages}
            </div>

            <button
              className="auBtn auBtn--ghost"
              disabled={page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Sau <Icon name="next" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
