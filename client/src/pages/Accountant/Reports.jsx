import { useState } from "react";
import { FaChartBar, FaSpinner } from "react-icons/fa";

const Reports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h1 className="text-xs font-bold text-white mb-4">Reports</h1>
        <p className="text-xs text-slate-400">Financial reports and analytics coming soon...</p>
      </div>
    </div>
  );
};

export default Reports;
