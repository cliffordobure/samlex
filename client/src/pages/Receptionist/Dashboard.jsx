import { Routes, Route } from "react-router-dom";
import ReceptionistLayout from "../../components/layouts/ReceptionistLayout";
import ReceptionistOverview from "./Overview";
import CaseManagement from "./CaseManagement";
import ClientManagement from "./ClientManagement";
import Calendar from "./Calendar";

const ReceptionistDashboard = () => {
  console.log("📍 ReceptionistDashboard component rendering");
  
  return (
    <ReceptionistLayout>
      <Routes>
        <Route index element={<ReceptionistOverview />} />
        <Route path="cases" element={<CaseManagement />} />
        <Route path="clients" element={<ClientManagement />} />
        <Route path="calendar" element={<Calendar />} />
      </Routes>
    </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;

