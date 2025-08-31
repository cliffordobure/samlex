import { Routes, Route } from "react-router-dom";
import CreditCollectionLayout from "../../components/layouts/CreditCollectionLayout";
import CreditOverview from "./Overview";
import CaseManagement from "./CaseManagement";
import CaseDetails from "./CaseDetails";
// import CreateCase from "./CreateCase";

const CreditCollectionDashboard = () => {
  return (
    <CreditCollectionLayout>
      <Routes>
        <Route path="/" element={<CreditOverview />} />
        <Route path="/cases" element={<CaseManagement />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        {/* <Route path="/cases/create" element={<CreateCase />} /> */}
      </Routes>
    </CreditCollectionLayout>
  );
};

export default CreditCollectionDashboard;
