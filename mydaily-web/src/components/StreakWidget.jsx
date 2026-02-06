export default function StreakWidget({ streak }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const todayDone = !!streak?.today_done;

  return (
    <div className="streak-card" style={{ height: "100%", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: "-0.01em", fontSize: 14, opacity: 0.75 }}>
            🔥 Streak
          </div>
          <div className="streak-main" style={{ marginTop: 6 }}>
            <span className="streak-count">{current}</span> ngày liên tiếp
          </div>
          <div className="streak-sub" style={{ marginTop: 6 }}>
            Kỷ lục: <b>{longest}</b> ngày
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="tag" style={{ borderColor: todayDone ? "rgba(47,232,157,0.35)" : "rgba(255,207,90,0.35)" }}>
            {todayDone ? "✅ Today: done" : "⚠️ Today: pending"}
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, opacity: 0.7 }}>
            {todayDone ? "Giữ phong độ nhé!" : "Làm 1 task nhỏ để giữ streak."}
          </div>
        </div>
      </div>

      {!streak ? (
        <div className="streak-warning" style={{ marginTop: 12 }}>
          ⏳ Đang tải streak...
        </div>
      ) : !todayDone ? (
        <div className="streak-warning" style={{ marginTop: 12 }}>
          ⚡ Tip: chọn 1 task “5 phút” → tick xong là streak được cứu.
        </div>
      ) : (
        <div className="streak-ok" style={{ marginTop: 12 }}>
          🎉 Nice! Hôm nay bạn đã giữ streak rồi.
        </div>
      )}
    </div>
  );
}
