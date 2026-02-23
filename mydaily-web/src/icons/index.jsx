import { Icon } from "@iconify/react";

/**
 * ICON REGISTRY – ICONIFY
 * - Mỗi key map tới 1 icon string (pack:name)
 * - Page KHÔNG cần đổi code
 */
export const ICONS = {
    /* ===== Common ===== */
    hello: "fluent-emoji:waving-hand",
    reload: "material-symbols:refresh-rounded",

    // Common actions (dùng chung nhiều page) ✅
    search: "material-symbols:search-rounded",
    add: "material-symbols:add-rounded",
    edit: "material-symbols:edit-rounded",
    delete: "material-symbols:delete-rounded",
    close: "material-symbols:close-rounded",
    clear: "material-symbols:close-rounded",
    filter: "material-symbols:tune-rounded",
    sort: "material-symbols:sort-rounded",

    /* ===== Tasks / Expenses ===== */
    tasks: "material-symbols:checklist-rounded",
    addExpense: "material-symbols:add-circle-rounded",
    expense: "noto:money-with-wings",

    /* ===== Dashboard Hero ===== */
    heroTasks: "solar:checklist-bold-duotone",
    heroTarget: "solar:target-bold-duotone",
    heroCard: "solar:card-bold-duotone",

    /* ===== Quick Actions ===== */
    quick: "solar:bolt-bold-duotone",
    quickTask: "solar:task-square-bold-duotone",
    quickExpense: "solar:wallet-money-bold-duotone",
    quickReport: "solar:chart-square-bold-duotone",
    quickBudget: "solar:wallet-bold-duotone",

    /* ===== Stats ===== */
    productivity: "solar:graph-up-bold-duotone",
    finance: "solar:wallet-bold-duotone",

    /* ===== Streak / Motivation ===== */
    trophy: "solar:cup-star-bold-duotone",
    sparkles: "solar:stars-bold-duotone",
    rocket: "solar:rocket-bold-duotone",
    flame: "solar:fire-bold-duotone",

    /* ===== Budgets Page ===== */
    budget: "solar:wallet-bold-duotone",
    target: "solar:target-bold-duotone",
    pin: "material-symbols:push-pin-rounded",

    /* ===== Categories Page ===== */
    categories: "solar:folder-bold-duotone",

    /* ===== Expenses Page ===== */
    expenses: "solar:wallet-money-bold-duotone",

    /* ===== Reports Page ===== */
    reports: "solar:chart-square-bold-duotone",
    money: "solar:wallet-money-bold-duotone",
    receipt: "solar:receipt-bold-duotone",
    trend: "solar:graph-up-bold-duotone",
    calendar: "solar:calendar-bold-duotone",
    puzzle: "solar:widget-2-bold-duotone",
    balance: "solar:scale-bold-duotone",
    lock: "solar:lock-keyhole-bold-duotone",
    crown: "solar:crown-bold-duotone",
    arrow: "material-symbols:arrow-forward-rounded",

    /* ===== Profile Page ===== */
    user: "solar:user-bold-duotone",
    clock: "material-symbols:schedule-rounded",
    save: "material-symbols:save-rounded",
    check: "material-symbols:check-circle-rounded",
    undo: "material-symbols:undo-rounded",
    mail: "material-symbols:mail-rounded",

    /* ===== Tasks Page ===== */
    taskHub: "solar:checklist-bold-duotone",
    today: "material-symbols:today-rounded",
    week: "material-symbols:date-range-rounded",
    focus: "solar:target-bold-duotone",
    trash: "material-symbols:delete-rounded",
    checkCircle: "material-symbols:check-circle-rounded",
    dot: "material-symbols:circle-rounded",
    fire: "solar:fire-bold-duotone",
    warning: "material-symbols:warning-rounded",

    reportsSummary: "solar:chart-square-bold-duotone",
    reportsTrend: "solar:graph-up-bold-duotone",
    reportsOverdue: "solar:danger-circle-bold-duotone", // hoặc icon khác bạn thích
    export: "solar:export-bold-duotone",
    analytics: "solar:chart-2-bold-duotone",
    status: "solar:shield-check-bold-duotone", // hoặc "solar:bolt-bold-duotone"

    // Task report summary cards
    reportTotal: "solar:clipboard-text-bold-duotone",
    reportDone: "solar:check-circle-bold-duotone",
    reportOpen: "solar:clock-circle-bold-duotone",
    reportDueToday: "solar:target-bold-duotone",
};

/**
 * AppIcon – dùng CHUNG cho toàn bộ app
 * Giữ nguyên API <AppIcon name="..." />
 */
export function AppIcon({
    name,
    size = 18,
    className = "",
    tone, // "purple" | "pink" | "blue" | "green" | "neutral" | "danger" | ...
    ...props
}) {
    const icon = ICONS[name];

    if (!icon) {
        console.warn(`[AppIcon] Missing icon key: "${name}"`);
        return null;
    }

    const toneClass = tone ? `icon--${tone}` : "";

    return (
        <Icon
            icon={icon}
            width={size}
            height={size}
            className={`appIcon ${toneClass} ${className}`}
            {...props}
        />
    );
}
