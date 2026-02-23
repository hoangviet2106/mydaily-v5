import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../api/axios";
import "../SubscriptionsPage.css";

function fmtDateTime(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("vi-VN");
}

function moneyVND(n) {
  const v = Number(n || 0);
  return v.toLocaleString("vi-VN") + " đ";
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { accountType, meLoading, refreshMe } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sub, setSub] = useState(null);
  const [txs, setTxs] = useState([]);

  const pendingTxs = useMemo(
    () => txs.filter((t) => String(t.status).toUpperCase() === "PENDING"),
    [txs]
  );

  const historyTxs = useMemo(
    () =>
      txs.filter((t) =>
        ["SUCCEEDED", "FAILED", "REFUNDED"].includes(
          String(t.status).toUpperCase()
        )
      ),
    [txs]
  );

  const hasPending = pendingTxs.length > 0;

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/subscriptions/me");
      setSub(res.data?.subscription || null);
      setTxs(res.data?.transactions || []);
      await refreshMe?.();
    } catch (e) {
      setErr("Không tải được thông tin gói. Kiểm tra API /subscriptions/me.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="subWrap">
      <div className="subHeader">
        <div>
          <div className="subTitle">Gói của tôi</div>
          <div className="subSub">
            Theo dõi trạng thái Premium và giao dịch VietQR
          </div>
        </div>

        <div
          className={`subBadge ${accountType === "PREMIUM" ? "subBadge--pro" : ""
            }`}
        >
          {meLoading ? "..." : accountType}
        </div>
      </div>

      {loading ? (
        <div className="subCard">Đang tải...</div>
      ) : err ? (
        <div className="subCard subCard--err">⚠️ {err}</div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="subGrid">
            <div className="subCard">
              <div className="subCard__label">
                Trạng thái subscription
              </div>
              <div className="subCard__value">
                {sub?.status || "—"}
              </div>
              <div className="subCard__hint">
                Provider: {sub?.provider || "—"}
              </div>
            </div>

            <div className="subCard">
              <div className="subCard__label">Hết hạn</div>
              <div className="subCard__value">
                {sub?.current_period_end
                  ? fmtDateTime(sub.current_period_end)
                  : "—"}
              </div>
              <div className="subCard__hint">
                Cập nhật:{" "}
                {sub?.updated_at
                  ? fmtDateTime(sub.updated_at)
                  : "—"}
              </div>
            </div>

            <div className="subCard">
              <div className="subCard__label">
                Giao dịch chờ duyệt
              </div>
              <div className="subCard__value">
                {hasPending ? "Có" : "Không"}
              </div>
              <div className="subCard__hint">
                {hasPending
                  ? "⏳ Admin sẽ duyệt sau khi đối soát"
                  : "—"}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="subActions">
            <button
              className="subBtn"
              onClick={() => navigate("/upgrade")}
            >
              {accountType === "PREMIUM"
                ? "Gia hạn Premium"
                : "Nâng cấp Premium"}
            </button>

            <button
              className="subBtn subBtn--ghost"
              onClick={load}
            >
              Tải lại
            </button>
          </div>

          {/* PENDING SECTION */}
          {pendingTxs.length > 0 && (
            <div className="subCard subCard--pending">
              <div className="subCard__label">
                ⏳ Giao dịch đang chờ duyệt
              </div>

              {pendingTxs.map((t) => (
                <div className="subRow" key={t.id}>
                  <div>{fmtDateTime(t.created_at)}</div>
                  <div className="subMono">
                    {t.reference_code}
                  </div>
                  <div>{moneyVND(t.amount)}</div>
                  <div>
                    <span className="subStatus subStatus--pending">
                      Đang xử lý
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY SECTION */}
          <div className="subCard">
            <div className="subCard__label">
              Lịch sử giao dịch
            </div>

            <div className="subTable">
              <div className="subRow subRow--head">
                <div>Thời gian</div>
                <div>Mã</div>
                <div>Số tiền</div>
                <div>Trạng thái</div>
              </div>

              {historyTxs.length === 0 ? (
                <div className="subEmpty">
                  Chưa có giao dịch hoàn tất.
                </div>
              ) : (
                historyTxs.map((t) => (
                  <div className="subRow" key={t.id}>
                    <div>{fmtDateTime(t.created_at)}</div>
                    <div className="subMono">
                      {t.reference_code || "—"}
                    </div>
                    <div>{moneyVND(t.amount)}</div>
                    <div>
                      <span
                        className={`subStatus subStatus--${String(
                          t.status
                        ).toLowerCase()}`}
                      >
                        {String(t.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
