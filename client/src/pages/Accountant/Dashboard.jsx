import { Routes, Route } from "react-router-dom";
import AccountantLayout from "../../components/layouts/AccountantLayout";
import AccountantOverview from "./Overview";
import FinancialTracking from "./FinancialTracking";
import DepartmentReviews from "./DepartmentReviews";
import RevenueTargets from "./RevenueTargets";
import Reports from "./Reports";
import GeneralLedger from "./GeneralLedger";
import Expenses from "./Expenses";
import BalanceSheet from "./BalanceSheet";

const AccountantDashboard = () => {
  return (
    <AccountantLayout>
      <Routes>
        <Route path="/" element={<AccountantOverview />} />
        <Route path="/financial-tracking" element={<FinancialTracking />} />
        <Route path="/ledger" element={<GeneralLedger />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/balance-sheet" element={<BalanceSheet />} />
        <Route path="/departments" element={<DepartmentReviews />} />
        <Route path="/targets" element={<RevenueTargets />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </AccountantLayout>
  );
};

export default AccountantDashboard;
