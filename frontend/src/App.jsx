import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";

import AdminLayout from "./pages/super-admin/AdminLayout";
import AdminDashboardPage from "./pages/super-admin/dashboard/AdminDashboardPage";
import AdminSystemLogs from "./pages/super-admin/system-audit/AdminSystemLogs";

import ManageAdministratorsPage from "./pages/super-admin/manage-administrators/ManageAdministratorsPage";
import ManageAlumniAffairsOfficerPage from "./pages/super-admin/manage-administrators/ManageAlumniAffairsOfficerPage";
import ManageAilpoPage from "./pages/super-admin/manage-administrators/ManageAilpoPage";
import ManageRegistrarPage from "./pages/super-admin/manage-administrators/ManageRegistrarPage";
import ManageFacultyPage from "./pages/super-admin/manage-administrators/ManageFacultyPage";

import AdminCreateAlumniOfficer from "./pages/super-admin/AdminCreateAlumniOfficer";
import AdminCreateAILPO from "./pages/super-admin/AdminCreateAILPO";
import AdminCreateRegistrar from "./pages/super-admin/AdminCreateRegistrar";
import AdminCreateFaculty from "./pages/super-admin/AdminCreateFaculty";

import AdminManageAcademicRecordsPage from "./pages/super-admin/academic-records/AdminManageAcademicRecordsPage";
import AcademicProgramTableView from "./pages/super-admin/academic-records/AcademicProgramTableView";
import AdminOrganizationalChart from "./pages/super-admin/organizational-chart/AdminOrganizationalChart";
import AdminProfile from "./pages/super-admin/profile/AdminProfile";

import FacultyLayout from "./pages/faculty-admin/layout/FacultyLayout";
import FacultyDashboardPage from "./pages/faculty-admin/FacultyDashboardPage";
import FacultyProfile from "./pages/faculty-admin/profile/FacultyProfile";
import FacultySystemAudit from "./pages/faculty-admin/system-audit/FacultySystemAudit";

import ClassManagement from "./pages/faculty-admin/internship-management/ClassManagement";
import AddClass from "./pages/faculty-admin/internship-management/AddClass";
import IndividualClassManagement from "./pages/faculty-admin/internship-management/IndividualClassManagement";
import ManageInterns from "./pages/faculty-admin/program-course-students/ManageInterns";

import AlumniDashboardPage from "./alumni-intern/AlumniDashboardPage";

function DashboardPlaceholder({ title }) {
  const account = JSON.parse(localStorage.getItem("nuai_account") || "null");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
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
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Super Admin */}
        <Route path="/super-admin" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />

          <Route path="logs" element={<AdminSystemLogs />} />

          <Route
            path="manage-administrators"
            element={<ManageAdministratorsPage />}
          />

          <Route
            path="manage-administrators/alumni-affairs-officer"
            element={<ManageAlumniAffairsOfficerPage />}
          />

          <Route
            path="manage-administrators/alumni-affairs-officer/create"
            element={<AdminCreateAlumniOfficer />}
          />

          <Route
            path="manage-administrators/ailpo"
            element={<ManageAilpoPage />}
          />

          <Route
            path="manage-administrators/ailpo/create"
            element={<AdminCreateAILPO />}
          />

          <Route
            path="manage-administrators/registrar"
            element={<ManageRegistrarPage />}
          />

          <Route
            path="manage-administrators/registrar/create"
            element={<AdminCreateRegistrar />}
          />

          <Route
            path="manage-administrators/faculty"
            element={<ManageFacultyPage />}
          />

          <Route
            path="manage-administrators/faculty/create"
            element={<AdminCreateFaculty />}
          />

          <Route
            path="academic-records"
            element={<AdminManageAcademicRecordsPage />}
          />

          <Route
            path="academic-records/:schoolProgramId"
            element={<AcademicProgramTableView />}
          />

          <Route
            path="organization-chart"
            element={<AdminOrganizationalChart />}
          />

          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Faculty / Internship Adviser */}
        <Route path="/faculty" element={<FacultyLayout />}>
          <Route index element={<FacultyDashboardPage />} />

          <Route path="internships" element={<ClassManagement />} />
          <Route path="internships/add-class" element={<AddClass />} />
          <Route path="intern-list" element={<ManageInterns />} />
          <Route
            path="internships/:classId"
            element={<IndividualClassManagement />}
          />

          <Route path="profile" element={<FacultyProfile />} />
          <Route path="system-audit" element={<FacultySystemAudit />} />
        </Route>

        {/* Alumni + Intern shared dashboard */}
        <Route path="/alumni" element={<AlumniDashboardPage />} />
        <Route path="/intern" element={<AlumniDashboardPage />} />

        {/* Other role placeholders for now */}
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
          path="/partner"
          element={<DashboardPlaceholder title="Partner Dashboard" />}
        />
      </Routes>
    </BrowserRouter>
  );
}