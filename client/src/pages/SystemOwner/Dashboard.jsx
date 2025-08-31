import { Routes, Route } from "react-router-dom";
import SystemOwnerLayout from "../../components/layouts/SystemOwnerLayout";
import SystemOwnerOverview from "./Overview";
import LawFirmManagement from "./LawFirmManagement";
import Analytics from "./Analytics";
// import SystemAnalytics from "./Analytics";

const SystemOwnerDashboard = () => {
  return (
    <SystemOwnerLayout>
      <Routes>
        <Route path="/" element={<SystemOwnerOverview />} />
        <Route path="/law-firms/*" element={<LawFirmManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        {/* <Route path="/analytics" element={<SystemAnalytics />} /> */}
      </Routes>
    </SystemOwnerLayout>
  );
};

export default SystemOwnerDashboard;
