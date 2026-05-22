import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";

function DashboardPlaceholder({ title }) {
  const account = JSON.parse(localStorage.getItem("nuai_account") || "null");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-nu-blue">{title}</h1>

        <p className="mt-2 text-sm text-nu-muted">
          You are logged in as {account?.email || "Unknown Account"}.
        </p>

        <p className="mt-1 text-sm text-nu-muted">
          Role: {account?.role || "N/A"}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/super-admin"
          element={<DashboardPlaceholder title="Super Admin Dashboard" />}
        />
        <Route
          path="/alumni-officer"
          element={<DashboardPlaceholder title="Alumni Officer Dashboard" />}
        />
        <Route
          path="/ailpo"
          element={<DashboardPlaceholder title="AILPO Dashboard" />}
        />
        <Route
          path="/registrar"
          element={<DashboardPlaceholder title="Registrar Dashboard" />}
        />
        <Route
          path="/faculty"
          element={<DashboardPlaceholder title="Faculty Dashboard" />}
        />
        <Route
          path="/partner"
          element={<DashboardPlaceholder title="Partner Dashboard" />}
        />
        <Route
          path="/alumni"
          element={<DashboardPlaceholder title="Alumni Dashboard" />}
        />
        <Route
          path="/intern"
          element={<DashboardPlaceholder title="Intern Dashboard" />}
        />
      </Routes>
    </BrowserRouter>
  );
}