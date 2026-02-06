import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../Login.css"; // ✅ dùng chung CSS với Login

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true" />
      <div className="auth__wrap">
        <div className="authCard">
          <div className="authCard__head" style={{ marginTop: 0 }}>
            <h1 className="authCard__title">Tạo tài khoản</h1>
            <p className="authCard__sub">
              Bắt đầu quản lý công việc và chi tiêu ngay hôm nay.
            </p>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Tên</label>
              <div className="inputWrap">
                <span className="inputIcon" aria-hidden="true">👤</span>
                <input
                  className="input input--pretty"
                  placeholder="Tên bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="inputWrap">
                <span className="inputIcon" aria-hidden="true">✉️</span>
                <input
                  className="input input--pretty"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Mật khẩu</label>
              <div className="inputWrap">
                <span className="inputIcon" aria-hidden="true">🔒</span>
                <input
                  className="input input--pretty"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="actions">
              <button className="btnPrimary" type="submit" disabled={loading}>
                <span className="btnPrimary__shine" aria-hidden="true" />
                {loading ? "Creating..." : "Tạo tài khoản"}
              </button>

              {error && <div className="alertPretty">{error}</div>}

              <p className="foot">
                Bạn đã có tài khoản?{" "}
                <Link className="linkStrong" to="/login">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>

          <div className="authCard__hint">
            <span className="dot" aria-hidden="true" />
            Tip: đặt mật khẩu đủ mạnh để bảo vệ ví tiền & lịch làm việc.
          </div>
        </div>
      </div>
    </div>
  );
}
