import { Routes, Route } from "react-router-dom";
import CreditCollectionLayout from "../../components/layouts/CreditCollectionLayout";
import CreditOverview from "./Overview";
import CaseManagement from "./CaseManagement";
import CaseDetails from "./CaseDetails";
import BulkImport from "./BulkImport";
import BulkSMS from "./BulkSMS";
// import CreateCase from "./CreateCase";

const CreditCollectionDashboard = () => {
  return (
    <CreditCollectionLayout>
      <Routes>
        <Route path="/" element={<CreditOverview />} />
        <Route path="/cases" element={<CaseManagement />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        <Route path="/bulk-import" element={<BulkImport />} />
        <Route path="/bulk-sms" element={<BulkSMS />} />
        {/* <Route path="/cases/create" element={<CreateCase />} /> */}
      </Routes>
    </CreditCollectionLayout>
  );
};

export default CreditCollectionDashboard;
