import { useState } from "react";
import api from "../api/axios";
import "../PaymentPage.css";

export default function PaymentPage() {
    const [loading, setLoading] = useState(false);
    const [tx, setTx] = useState(null);
    const [bank, setBank] = useState(null);
    const [error, setError] = useState("");

    // ✅ NEW: notice banner (success/info/error)
    const [notice, setNotice] = useState(null); // { type: "success"|"info"|"error", text: string }

    const showNotice = (type, text) => {
        setNotice({ type, text });
        // auto hide after 4s
        window.clearTimeout(showNotice._t);
        showNotice._t = window.setTimeout(() => setNotice(null), 4000);
    };

    const handleCreate = async () => {
        try {
            setError("");
            setNotice(null);
            setLoading(true);

            const res = await api.post("/payments/vietqr/create");
            setTx(res.data.tx);
            setBank(res.data.bank);

            showNotice("info", "Đã tạo giao dịch. Hãy chuyển khoản đúng nội dung để được duyệt.");
        } catch (err) {
            setError("Không tạo được giao dịch");
            showNotice("error", "Không tạo được giao dịch. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleIPaid = async () => {
        if (!tx?.reference_code) return;
        try {
            await api.post("/payments/vietqr/i-paid", {
                reference_code: tx.reference_code,
            });
            showNotice("success", "Đã ghi nhận. Admin sẽ duyệt sau khi kiểm tra chuyển khoản.");
        } catch (err) {
            showNotice("error", "Có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    return (
        <div className="payWrap">
            <div className="payCard">
                <div className="payHeader">
                    <div>
                        <div className="payTitle">Nâng cấp Premium (VietQR)</div>
                        <div className="paySub">Chuyển khoản MB Bank • Admin duyệt thủ công</div>
                    </div>
                    <div className="payPill">49.000đ / 30 ngày</div>
                </div>

                {/* ✅ Banner notice */}
                {notice && (
                    <div className={`payNotice payNotice--${notice.type}`}>
                        <span className="payNotice__icon">
                            {notice.type === "success" ? "✅" : notice.type === "error" ? "⚠️" : "ℹ️"}
                        </span>
                        <div className="payNotice__text">{notice.text}</div>
                        <button className="payNotice__close" onClick={() => setNotice(null)}>×</button>
                    </div>
                )}

                {!tx ? (
                    <div className="payBody">
                        <div className="paySteps">
                            <div className="payStep"><span>1</span> Tạo thanh toán</div>
                            <div className="payStep"><span>2</span> Chuyển khoản đúng nội dung</div>
                            <div className="payStep"><span>3</span> Bấm “Tôi đã thanh toán”</div>
                        </div>

                        <button className="payBtn" onClick={handleCreate} disabled={loading}>
                            {loading ? "Đang tạo..." : "Tạo thanh toán"}
                        </button>

                        {error && <div className="payErr">⚠️ {error}</div>}
                    </div>
                ) : (
                    <div className="payBody">
                        <div className="payAmount">
                            {Number(tx.amount || 0).toLocaleString("vi-VN")} <span>VND</span>
                        </div>

                        <div className="payGrid">
                            <div className="payField">
                                <div className="payLabel">Ngân hàng</div>
                                <div className="payValue">{bank?.bank_code || "—"}</div>
                            </div>
                            <div className="payField">
                                <div className="payLabel">Số tài khoản</div>
                                <div className="payValue">{bank?.account_no || "—"}</div>
                            </div>
                            <div className="payField">
                                <div className="payLabel">Tên tài khoản</div>
                                <div className="payValue">{bank?.account_name || "—"}</div>
                            </div>
                            <div className="payField">
                                <div className="payLabel">Nội dung chuyển khoản</div>
                                <div className="payMono">{tx.reference_code}</div>
                            </div>
                        </div>

                        {bank?.bank_code && bank?.account_no && (
                            <div className="payQrWrap">
                                <img
                                    className="payQr"
                                    alt="VietQR"
                                    src={`https://api.vietqr.io/image/${bank.bank_code}-${bank.account_no}-compact.png?amount=${tx.amount}&addInfo=${encodeURIComponent(
                                        tx.reference_code
                                    )}&accountName=${encodeURIComponent(bank.account_name || "")}`}
                                    width="220"
                                />
                                <div className="payHint">Quét để tự điền số tiền + nội dung</div>
                            </div>
                        )}

                        <div className="payActions">
                            <button className="payBtn" onClick={handleIPaid}>
                                Tôi đã thanh toán
                            </button>

                            <button
                                className="payBtn payBtnGhost"
                                onClick={() => {
                                    setTx(null);
                                    setBank(null);
                                    setError("");
                                    setNotice(null);
                                }}
                            >
                                Tạo giao dịch mới
                            </button>
                        </div>

                        <div className="payPending">⏳ Đang chờ admin duyệt</div>
                    </div>
                )}
            </div>
        </div>
    );
}
