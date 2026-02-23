import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles.css";
import "./DashboardHome.css"
import "./dashboard-topnav.css"
import "./ExportPage.css"
import "./Login.css"
import "./ReportsPage.css"
import "./CategoriesPage.css"
import "./BudgetsPage.css"
import "./ExpensesPage.css"
import "./components/Modal.css";
import "./ProfilePage.css";
import "./TaskReportsPage.css";
import "./TaskReportComponents.css";
import "./TasksPage.css";
import "./PaymentPage.css";
import "./SubscriptionsPage.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
