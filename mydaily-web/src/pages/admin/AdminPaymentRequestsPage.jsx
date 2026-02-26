import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./AdminUsersPage.css"; // reuse style y hệt trang users

function Badge({ tone = "neutral", children }) {
    return <span className={`au-badge au-badge--${tone}`}>{children}</span>;
}

function Icon({ name }) {
    const map = {
        search: "🔎",
        users: "👥",
        mail: "✉️",
        name: "🪪",
        role: "🛡️",
        plan: "💎",
        ok: "✅",
        prev: "⬅️",
        next: "➡️",
        refresh: "🔄",
        money: "💳",
        time: "🕒",
        approve: "✅",
        pending: "⏳",
        id: "🧾",
    };
    return (
        <span className="au-ic" aria-hidden="true">
            {map[name] || "✨"}
        </span>
    );
}

function moneyVND(n) {
    const v = Number(n || 0);
    return v.toLocaleString("vi-VN") + " đ";
}

function fmtDateTime(d) {
    if (!d) return "—";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "—";
    return x.toLocaleString("vi-VN");
}

function isClaimed(note) {
    const s = String(note || "");
    // theo code backend hiện tại: "User clicked I paid"
    // hoặc bạn có thể đổi note thành "USER_CLAIMED_PAID:..."
    return (
        s.includes("User clicked I paid") ||
        s.includes("USER_CLAIMED_PAID") ||
        s.toLowerCase().includes("i paid")
    );
}

export default function AdminPaymentRequestsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // mặc định: chỉ show “đã bấm tôi đã thanh toán”
    const [onlyClaimed, setOnlyClaimed] = useState(true);

    const load = async (opts = {}) => {
        const s = opts.search ?? search;
        const p = opts.page ?? page;

        setLoading(true);
        setErr("");
        try {
            const res = await api.get("/admin/payments", {
                params: { status: "PENDING", search: s, page: p, limit },
            });

            const payments = res.data.payments || [];
            setRows(payments);

            setMeta({
                total: res.data.total || 0,
                totalPages: res.data.totalPages || 1,
            });
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to load payment requests");
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

    const filtered = useMemo(() => {
        if (!onlyClaimed) return rows;
        return rows.filter((x) => isClaimed(x.note));
    }, [rows, onlyClaimed]);

    const stats = useMemo(() => {
        const totalPending = rows.length;
        const claimed = rows.filter((x) => isClaimed(x.note)).length;
        return { totalPending, claimed };
    }, [rows]);

    const toast = (msg) => {
        setErr(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const approve = async (tx) => {
        try {
            await api.post(`/admin/payments/${tx.id}/approve`);
            await load({ page });
        } catch (e) {
            toast(e?.response?.data?.message || "Approve failed");
        }
    };

    return (
        <div className="au">
            <div className="au__bg" aria-hidden="true" />

            <div className="au__wrap">
                <header className="auHeader">
                    <div className="auHeader__left">
                        <div className="auHeader__title">
                            <Icon name="money" />
                            <div>
                                <h2>Admin • Yêu cầu duyệt</h2>
                                <p>User bấm “Tôi đã thanh toán” → vào đây duyệt → tự set PREMIUM.</p>
                            </div>
                        </div>

                        <div className="auStats">
                            <div className="auStat">
                                <div className="auStat__k">Pending</div>
                                <div className="auStat__v">{stats.totalPending}</div>
                            </div>
                            <div className="auStat">
                                <div className="auStat__k">Cần duyệt</div>
                                <div className="auStat__v">{stats.claimed}</div>
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
                                    placeholder="Tìm theo email/tên/reference_code…"
                                    className="auSearch__input"
                                />
                            </div>

                            <button className="auBtn auBtn--primary" type="submit" disabled={loading}>
                                Tìm kiếm
                            </button>

                            <label className="auHint" style={{ marginLeft: 12 }}>
                                <input
                                    type="checkbox"
                                    checked={onlyClaimed}
                                    onChange={(e) => setOnlyClaimed(e.target.checked)}
                                    style={{ marginRight: 8 }}
                                />
                                Chỉ hiển thị “đã bấm Tôi đã thanh toán”
                            </label>
                        </form>

                        <div className="auHint">
                            <span className={`auDot ${loading ? "auDot--spin" : ""}`} />
                            {loading ? "Đang tải dữ liệu…" : "Tip: bạn có thể bỏ tick để xem toàn bộ PENDING."}
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
                                    <th>Người dùng</th>
                                    <th>Ref</th>
                                    <th>Số tiền</th>
                                    <th>Ghi chú</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th className="auTable__actions">Hành động</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((tx) => {
                                    const claimed = isClaimed(tx.note);
                                    const statusTone = tx.status === "PENDING" ? "neutral" : "green";
                                    const claimedTone = claimed ? "gold" : "neutral";

                                    return (
                                        <tr key={tx.id}>
                                            <td>
                                                <div className="auUser">
                                                    <span className="auAvatar" aria-hidden="true">
                                                        {(tx.user?.name || tx.user?.email || "?").trim().slice(0, 1).toUpperCase()}
                                                    </span>
                                                    <div className="auUser__meta">
                                                        <div className="auUser__name">
                                                            {tx.user?.name || <span className="auDim">(no name)</span>}
                                                        </div>
                                                        <div className="auUser__sub">
                                                            <span className="auMono">
                                                                <Icon name="mail" /> {tx.user?.email || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="auMono">
                                                <Icon name="id" /> {tx.reference_code}
                                            </td>

                                            <td>
                                                <Badge tone={claimedTone}>
                                                    <Icon name="money" /> {moneyVND(tx.amount)}
                                                </Badge>
                                            </td>

                                            <td>
                                                <div style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {tx.note || <span className="auDim">—</span>}
                                                </div>
                                            </td>

                                            <td className="auMono">
                                                <Icon name="time" /> {fmtDateTime(tx.created_at)}
                                            </td>

                                            <td>
                                                <Badge tone={statusTone}>
                                                    <Icon name="pending" /> {tx.status}
                                                </Badge>
                                            </td>

                                            <td className="auActions">
                                                <button
                                                    type="button"
                                                    className={`auBtn auBtn--sm ${claimed ? "auBtn--ok" : "auBtn--ghost"}`}
                                                    onClick={() => approve(tx)}
                                                    disabled={loading || !claimed}
                                                    title={!claimed ? "User chưa bấm 'Tôi đã thanh toán' nên chưa duyệt" : "Duyệt giao dịch"}
                                                >
                                                    <Icon name="approve" /> Approve
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="auEmpty">
                                            Chưa có yêu cầu duyệt. (User phải bấm “Tôi đã thanh toán”.)
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