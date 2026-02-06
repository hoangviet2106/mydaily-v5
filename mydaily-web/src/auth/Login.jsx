import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/mydailylogo.png";
import "../Login.css"; // ✅ tạo file Login.css và dán CSS ở dưới

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => {
    window.location.href = "/api/auth/google"; // đi qua proxy /api
  };

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("displayName");

      const to = location.state?.from || "/dashboard";
      navigate(to, { replace: true });
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
          <div className="authCard__brand">
            <img src={logo} alt="MyDaily logo" className="authCard__logo" />
            <div className="authCard__brandText">
              <div className="authCard__app">MyDaily</div>
              <div className="authCard__tag">Hỗ trợ cuộc sống thông minh</div>
            </div>
          </div>

          <div className="authCard__head">
            <h1 className="authCard__title">Đăng nhập</h1>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="actions">
              <button className="btnPrimary" type="submit" disabled={loading}>
                <span className="btnPrimary__shine" aria-hidden="true" />
                {loading ? "Signing in..." : "Login"}
              </button>

              <div className="divider">
                <span>hoặc</span>
              </div>

              <button type="button" className="btnGoogle" onClick={handleGoogle}>
                <span className="btnGoogle__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.7 1.22 9.18 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.64 0 6.5 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.64-.15-3.22-.43-4.74H24v9h12.7c-.55 2.97-2.22 5.48-4.74 7.18l7.62 5.9C43.98 37.8 46.5 31.7 46.5 24.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.54 28.41a14.5 14.5 0 010-8.82l-7.98-6.19a24 24 0 000 21.2l7.98-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.14 15.9-5.8l-7.62-5.9c-2.11 1.42-4.82 2.27-8.28 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.5 42.62 14.64 48 24 48z"
                    />
                  </svg>
                </span>

                <span>Continue with Google</span>
              </button>

              <p className="foot">
                Tài khoản mới?{" "}
                <Link className="linkStrong" to="/register">
                  Tạo tài khoản
                </Link>
              </p>

              {error && <div className="alertPretty">{error}</div>}
            </div>
          </form>

          <div className="authCard__hint">
            <span className="dot" aria-hidden="true" />
            Tip: dùng Google login để vào nhanh như “one-tap”.
          </div>
        </div>
      </div>
    </div>
  );
}
