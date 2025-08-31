import { Outlet } from "react-router-dom";
import LawFirmAdminLayout from "../../components/layouts/LawFirmAdminLayout";

const LawFirmAdminDashboard = () => {
  return (
    <LawFirmAdminLayout>
      <Outlet />
    </LawFirmAdminLayout>
  );
};

export default LawFirmAdminDashboard;
