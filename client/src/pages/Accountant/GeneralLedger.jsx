import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import accountingApi from "../../store/api/accountingApi";
import {
  FaSpinner,
  FaBook,
  FaSeedling,
  FaLink,
  FaChartPie,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

const GeneralLedger = () => {
  const { user } = useSelector((state) => state.auth);
  const firmId = user?.lawFirm?._id;
  const [ledger, setLedger] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newAcc, setNewAcc] = useState({
    name: "",
    code: "",
    accountType: "expense",
    description: "",
  });
  const [creatingAcc, setCreatingAcc] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const loadLedger = async () => {
    if (!firmId) return;
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await accountingApi.getGeneralLedger(firmId, params);
    if (res.data.success) setLedger(res.data.data);
  };

  const loadAccounts = async () => {
    if (!firmId) return;
    const res = await accountingApi.getLedgerAccounts(firmId);
    if (res.data.success) setAccounts(res.data.data);
  };

  const loadAll = async () => {
    if (!firmId) return;
    try {
      setLoading(true);
      await Promise.all([loadLedger(), loadAccounts()]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [firmId, from, to]);

  const seed = async () => {
    if (!firmId) return;
    try {
      setSeeding(true);
      await accountingApi.seedLedgerAccounts(firmId);
      toast.success("Default chart of accounts created");
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not seed accounts");
    } finally {
      setSeeding(false);
    }
  };

  const createAccount = async (e) => {
    e.preventDefault();
    if (!firmId || !newAcc.name.trim()) return;
    try {
      setCreatingAcc(true);
      await accountingApi.createLedgerAccount(firmId, {
        name: newAcc.name.trim(),
        code: newAcc.code || undefined,
        accountType: newAcc.accountType,
        description: newAcc.description || undefined,
      });
      toast.success("Account created");
      setNewAcc({ name: "", code: "", accountType: "expense", description: "" });
      loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setCreatingAcc(false);
    }
  };

  if (!firmId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-6 text-white">
        No law firm context
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaBook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">General ledger</h1>
              <p className="text-xs text-slate-300 mt-1">
                Chart of accounts and expense totals by account (case revenue stays on Financial Tracking)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {accounts.length === 0 && (
              <button
                type="button"
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {seeding ? <FaSpinner className="animate-spin" /> : <FaSeedling />}
                Initialize chart of accounts
              </button>
            )}
            <Link
              to="/accountant/expenses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            >
              <FaLink className="text-green-400" />
              Post expenses
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50">
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <FaChartPie className="text-green-400" />
            Total expenses (filtered)
          </p>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? "—" : formatCurrency(ledger?.totalExpenses ?? 0)}
          </p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50">
          <p className="text-xs text-slate-400">Unassigned to account</p>
          <p className="text-xl font-bold text-amber-300 mt-1">
            {loading ? "—" : formatCurrency(ledger?.unassigned?.total ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {ledger?.unassigned?.count ?? 0} entries
          </p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50 flex flex-col justify-center gap-2">
          <label className="text-xs text-slate-400">Filter by date</label>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-white"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-white"
            />
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="text-xs text-green-400 px-2"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h2 className="text-sm font-bold text-white mb-4">Expense activity by account</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin w-8 h-8 text-white" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-600/50 text-slate-400 text-left">
                  <th className="py-2 px-2">Code</th>
                  <th className="py-2 px-2">Account</th>
                  <th className="py-2 px-2 text-right">Total</th>
                  <th className="py-2 px-2 text-right">Entries</th>
                </tr>
              </thead>
              <tbody>
                {(ledger?.expenseAccountTotals || []).filter((r) => r.ledgerAccountId).length ===
                0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No expenses assigned to ledger accounts yet. Post expenses and pick an account, or
                      initialize the chart above.
                    </td>
                  </tr>
                ) : (
                  (ledger?.expenseAccountTotals || [])
                    .filter((r) => r.ledgerAccountId)
                    .map((row) => (
                      <tr
                        key={String(row.ledgerAccountId)}
                        className="border-b border-slate-600/30 text-slate-200"
                      >
                        <td className="py-2 px-2">{row.account?.code || "—"}</td>
                        <td className="py-2 px-2">{row.account?.name || "Unknown"}</td>
                        <td className="py-2 px-2 text-right font-semibold text-white">
                          {formatCurrency(row.totalDebit)}
                        </td>
                        <td className="py-2 px-2 text-right">{row.entryCount}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h2 className="text-sm font-bold text-white mb-4">Chart of accounts</h2>
        <form
          onSubmit={createAccount}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 pb-6 border-b border-slate-600/50"
        >
          <input
            placeholder="Account name"
            value={newAcc.name}
            onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white lg:col-span-2"
            required
          />
          <input
            placeholder="Code (optional)"
            value={newAcc.code}
            onChange={(e) => setNewAcc({ ...newAcc, code: e.target.value })}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
          />
          <select
            value={newAcc.accountType}
            onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value })}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creatingAcc}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {creatingAcc ? <FaSpinner className="animate-spin inline" /> : "Add account"}
          </button>
        </form>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="border-b border-slate-600/50 text-slate-400 text-left">
                <th className="py-2 px-2">Code</th>
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    No accounts. Use &quot;Initialize chart of accounts&quot; or add manually.
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a._id} className="border-b border-slate-600/30 text-slate-200">
                    <td className="py-2 px-2">{a.code || "—"}</td>
                    <td className="py-2 px-2">{a.name}</td>
                    <td className="py-2 px-2 capitalize">{a.accountType}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
