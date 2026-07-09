import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./features/landing/LandingPage";
import LoginPage from "./features/auth/LoginPage";
import OnboardingPage from "./features/auth/OnboardingPage";
import AdminDashboardPage from "./features/dashboard_admin/AdminDashboardPage";
import StudentDashboardPage from "./features/dashboard_student/StudentDashboardPage";
import StudentDetailPage from "./features/dashboard_student/StudentDetailPage";
import ApprovalQueuePage from "./features/approvals/ApprovalQueuePage";
import BulkGrantPage from "./features/approvals/BulkGrantPage";
import ScoringRulesPage from "./features/scoring/ScoringRulesPage";
import AuditLogPage from "./features/audit_log/AuditLogPage";
import SubmissionFormPage from "./features/submissions/SubmissionFormPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route
        path="/submissions"
        element={
          <ProtectedRoute>
            <SubmissionFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <ApprovalQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bulk-grant"
        element={
          <ProtectedRoute>
            <BulkGrantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scoring-rules"
        element={
          <ProtectedRoute>
            <ScoringRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:studentId"
        element={
          <ProtectedRoute>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
