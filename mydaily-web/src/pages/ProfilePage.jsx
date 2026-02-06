import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AppIcon } from "../icons";
import "../ProfilePage.css";

function fmtDateTime(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("vi-VN");
}

function PlanPill({ accountType }) {
  const premium = accountType === "PREMIUM";
  return (
    <span className={`pfPlan ${premium ? "pfPlan--premium" : "pfPlan--free"}`}>
      <span className="pfPlan__dot" />
      <span className="pfPlan__text">{premium ? "Premium" : "Free"}</span>
      {/* giữ emoji cho “nổi bật” */}
      {premium ? <span className="pfPlan__icon">👑</span> : <span className="pfPlan__icon">🚀</span>}
    </span>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [me, setMe] = useState(null);
  const [name, setName] = useState("");

  const accountType = useMemo(() => {
    const raw =
      me?.account_type ??
      me?.accountType ??
      me?.plan ??
      me?.tier ??
      me?.subscription ??
      (typeof me?.is_premium === "boolean" ? (me.is_premium ? "PREMIUM" : "FREE") : undefined);
    return raw ? String(raw).toUpperCase() : "FREE";
  }, [me]);

  const load = async () => {
    setLoading(true);
    setErr("");
    setOk("");
    try {
      const res = await api.get("/users/me");
      const user = res.data?.user ?? res.data ?? null;
      setMe(user);
      setName(user?.name || "");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    setErr("");
    setOk("");

    const v = String(name || "").trim();
    if (!v) return setErr("Tên hiển thị không được để trống.");
    if (v.length < 2) return setErr("Tên hiển thị phải >= 2 ký tự.");
    if (v.length > 100) return setErr("Tên hiển thị tối đa 100 ký tự.");

    setSaving(true);
    try {
      const res = await api.patch("/users/me", { name: v });
      const user = res.data?.user ?? res.data ?? null;
      setMe(user || { ...me, name: v });
      setName((user?.name ?? v) || v);
      setOk("Đã lưu thay đổi.");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const premium = accountType === "PREMIUM";

  return (
    <div className="pfPage">
      <div className="pfContainer">
        {/* HERO */}
        <div className="pfHero">
          <div className="pfHero__left">
            <div className="pfHero__kicker">
              <AppIcon name="user" size={16} tone="neutral" /> Profile
            </div>

            <div className="pfHero__title">
              Thông tin <span className="pfHero__grad">cá nhân</span>
            </div>

            <div className="pfHero__sub">
              Xem gói tài khoản, thông tin đăng nhập và cập nhật tên hiển thị để cá nhân hóa trải nghiệm.
            </div>

            <div className="pfHero__chips">
              <PlanPill accountType={accountType} />

              <span className="pfChip">
                <AppIcon name="clock" size={16} tone="neutral" />{" "}
                {me ? fmtDateTime(me.created_at || me.createdAt) : "—"}
              </span>

              <span className="pfChip pfChip--soft">
                <AppIcon name="mail" size={16} tone="blue" /> {me?.email || "—"}
              </span>
            </div>
          </div>

          <div className="pfHero__right">
            <button className="btn btn--secondary" type="button" onClick={load} disabled={loading}>
              <AppIcon name="reload" size={16} tone="neutral" /> {loading ? "Đang tải..." : "Tải lại"}
            </button>

            <button className="btn btn--primary" type="button" onClick={onSave} disabled={saving || loading || !me}>
              <AppIcon name="save" size={16} tone={premium ? "premium" : "purple"} />{" "}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {err ? (
          <div className="pfAlert pfAlert--danger">
            <AppIcon name="warning" size={16} tone="danger" /> {err}
          </div>
        ) : null}

        {ok ? (
          <div className="pfAlert pfAlert--ok">
            <AppIcon name="check" size={16} tone="ok" /> {ok}
          </div>
        ) : null}

        {loading ? (
          <div className="pfSkeleton">
            <div className="pfSkeleton__card" />
            <div className="pfSkeleton__grid">
              <div className="pfSkeleton__mini" />
              <div className="pfSkeleton__mini" />
              <div className="pfSkeleton__mini" />
            </div>
          </div>
        ) : !me ? (
          <div className="pfEmpty">
            <div className="pfEmpty__title">Không tải được profile</div>
            <div className="pfEmpty__sub">Hãy thử “Tải lại” hoặc đăng nhập lại.</div>
            <button className="btn btn--primary" type="button" onClick={load}>
              <AppIcon name="reload" size={16} tone="neutral" /> Tải lại
            </button>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="pfStats">
              <div className="pfStatCard pfStatCard--purple">
                <div className="pfStatCard__label">
                  <AppIcon name="crown" size={16} tone={premium ? "premium" : "muted"} /> Loại tài khoản
                </div>
                <div className="pfStatCard__value">
                  <PlanPill accountType={accountType} />
                </div>
                <div className="pfStatCard__hint">Gói hiện tại</div>
              </div>

              <div className="pfStatCard pfStatCard--blue">
                <div className="pfStatCard__label">
                  <AppIcon name="mail" size={16} tone="blue" /> Email
                </div>
                <div className="pfStatCard__value pfMono">{me.email || "—"}</div>
                <div className="pfStatCard__hint">Email đăng nhập</div>
              </div>

              <div className="pfStatCard pfStatCard--green">
                <div className="pfStatCard__label">
                  <AppIcon name="calendar" size={16} tone="green" /> Ngày tạo
                </div>
                <div className="pfStatCard__value pfMono">{fmtDateTime(me.created_at || me.createdAt)}</div>
                <div className="pfStatCard__hint">Thời điểm tạo tài khoản</div>
              </div>
            </div>

            {/* Editor */}
            <div className="pfCard">
              <div className="pfCard__head">
                <div>
                  <div className="pfCard__title">
                    <AppIcon name="sparkles" size={18} tone="pink" /> Thông tin hiển thị
                  </div>
                  <div className="pfCard__sub">Tên này sẽ hiển thị ở phần “Xin chào …” trên Dashboard.</div>
                </div>
              </div>

              <div className="pfGrid2">
                <div className="pfField">
                  <label className="pfLabel">Tên hiển thị</label>

                  <div className="pfInputWrap">
                    <span className="pfInputIcon">
                      <AppIcon name="edit" size={18} tone="purple" />
                    </span>

                    <input
                      className="pfInput"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Việt Hoàng, Andrea, ..."
                    />
                  </div>

                  <div className="pfHint">Gợi ý: tên ngắn, dễ đọc (2–100 ký tự).</div>
                </div>

                <div className="pfField">
                  <label className="pfLabel">Email (readonly)</label>

                  <div className="pfInputWrap pfInputWrap--readonly">
                    <span className="pfInputIcon">
                      <AppIcon name="mail" size={18} tone="blue" />
                    </span>

                    <input className="pfInput" value={me.email || ""} readOnly />
                  </div>

                  <div className="pfHint">Email là định danh đăng nhập, không thay đổi ở đây.</div>
                </div>
              </div>

              <div className="pfCard__foot">
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => setName(me?.name || "")}
                  disabled={saving}
                >
                  <AppIcon name="undo" size={16} tone="muted" /> Hoàn tác
                </button>

                <button className="btn btn--primary" type="button" onClick={onSave} disabled={saving}>
                  <AppIcon name="save" size={16} tone={premium ? "premium" : "purple"} />{" "}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
