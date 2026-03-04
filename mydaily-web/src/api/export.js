// src/api/export.js
import api from "./axios";

// tải file (csv/xlsx) và tự download
export async function downloadExport({ type, year, month, format }) {
    // type: "expenses" | "budgets" | "reports"
    const res = await api.get(`/export/${type}`, {
        params: { year, month, format },
        responseType: "blob",
        headers: {
            // đảm bảo không bị cache linh tinh
            "Cache-Control": "no-cache",
        },
    });

    // lấy filename từ header nếu có
    const cd = res.headers?.["content-disposition"] || "";
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
    const filename =
        decodeURIComponent(match?.[1] || match?.[2] || "") ||
        `${type}-${year}-${month}.${format}`;

    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
}
