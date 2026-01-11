import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LegalLayout from "../../components/layouts/LegalLayout";
import LegalOverview from "./Overview";
import LegalCaseManagement from "./CaseManagement";
import CaseDetails from "./CaseDetails";
import CreateLegalCase from "./CreateLegalCase";
import CourtCalendar from "./CourtCalendar";
import EscalatedCases from "./EscalatedCases";
import CompleteCaseInfo from "./CompleteCaseInfo";
import Documents from "./Documents";
import Reports from "./Reports";
import RevenueTargets from "../LawFirmAdmin/RevenueTargets";

// Protected Route component for escalated cases
const ProtectedEscalatedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role !== "legal_head" && user?.role !== "law_firm_admin") {
    return <Navigate to="/legal" replace />;
  }

  return children;
};

const LegalDashboard = () => {
  return (
    <LegalLayout>
      <Routes>
        <Route path="/" element={<LegalOverview />} />
        <Route path="/cases" element={<LegalCaseManagement />} />
        <Route path="/cases/create" element={<CreateLegalCase />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        <Route path="/calendar" element={<CourtCalendar />} />
        <Route
          path="/escalated"
          element={
            <ProtectedEscalatedRoute>
              <EscalatedCases />
            </ProtectedEscalatedRoute>
          }
        />
        <Route path="/cases/:id/complete" element={<CompleteCaseInfo />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/revenue-targets" element={<RevenueTargets />} />
      </Routes>
    </LegalLayout>
  );
};

export default LegalDashboard;
