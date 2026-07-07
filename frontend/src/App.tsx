import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./features/dashboard_admin/AdminDashboardPage";
import StudentDashboardPage from "./features/dashboard_student/StudentDashboardPage";
import LoginPage from "./features/auth/LoginPage";
import ApprovalQueuePage from "./features/approvals/ApprovalQueuePage";
import SubmissionFormPage from "./features/submissions/SubmissionFormPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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
        path="/dashboard/student"
        element={
          <ProtectedRoute>
            <StudentDashboardPage />
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
