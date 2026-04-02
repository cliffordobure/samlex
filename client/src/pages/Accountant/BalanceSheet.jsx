import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import accountingApi from "../../store/api/accountingApi";
import {
  FaSpinner,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";

const emptyLine = {
  section: "asset",
  label: "",
  amount: "",
  asOfDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

const BalanceSheet = () => {
  const { user } = useSelector((state) => state.auth);
  const firmId = user?.lawFirm?._id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyLine);
  const [editingLine, setEditingLine] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const load = async () => {
    if (!firmId) return;
    try {
      setLoading(true);
      const res = await accountingApi.getBalanceSheet(firmId);
      if (res.data.success) setData(res.data.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [firmId]);

  const submitLine = async (e) => {
    e.preventDefault();
    if (!firmId) return;
    const amount = Number(form.amount);
    if (!form.label?.trim() || Number.isNaN(amount) || amount < 0) {
      toast.error("Enter label and a valid amount");
      return;
    }
    try {
      setSaving(true);
      const body = {
        section: form.section,
        label: form.label.trim(),
        amount,
        asOfDate: form.asOfDate,
        notes: form.notes || undefined,
      };
      if (editingLine) {
        await accountingApi.updateBalanceSheetLine(firmId, editingLine._id, body);
        toast.success("Line updated");
      } else {
        await accountingApi.createBalanceSheetLine(firmId, body);
        toast.success("Line added");
      }
      setForm(emptyLine);
      setEditingLine(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onEditLine = (line) => {
    setEditingLine(line);
    setForm({
      section: line.section,
      label: line.label,
      amount: String(line.amount),
      asOfDate: line.asOfDate
        ? new Date(line.asOfDate).toISOString().slice(0, 10)
        : emptyLine.asOfDate,
      notes: line.notes || "",
    });
  };

  const onDeleteLine = async (id) => {
    if (!firmId || !window.confirm("Remove this line?")) return;
    try {
      await accountingApi.deleteBalanceSheetLine(firmId, id);
      toast.success("Removed");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const renderSection = (title, lines, color) => (
    <div className="rounded-xl border border-slate-600/50 overflow-hidden">
      <div className={`px-4 py-2 text-sm font-bold text-white ${color}`}>{title}</div>
      <table className="w-full text-xs">
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td className="py-4 px-4 text-slate-400">No lines yet</td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={line._id} className="border-t border-slate-600/30">
                <td className="py-2 px-4 text-slate-200">{line.label}</td>
                <td className="py-2 px-4 text-right font-semibold text-white whitespace-nowrap">
                  {formatCurrency(line.amount)}
                </td>
                <td className="py-2 px-2 w-20">
                  <button
                    type="button"
                    onClick={() => onEditLine(line)}
                    className="p-1 text-blue-400"
                    aria-label="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLine(line._id)}
                    className="p-1 text-red-400"
                    aria-label="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (!firmId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-6 text-white">
        No law firm context
      </div>
    );
  }

  const totals = data?.totals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
            <FaBalanceScale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Balance sheet</h1>
            <p className="text-xs text-slate-300 mt-1">
              Enter assets, liabilities, and equity. Totals should satisfy Assets = Liabilities + Equity.
            </p>
          </div>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50">
            <p className="text-xs text-slate-400">Total assets</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.totalAssets)}</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50">
            <p className="text-xs text-slate-400">Total liabilities</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.totalLiabilities)}</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50">
            <p className="text-xs text-slate-400">Total equity</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.totalEquity)}</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/50 flex items-center gap-3">
            {totals.balanced ? (
              <>
                <FaCheckCircle className="text-green-400 text-2xl shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Equation</p>
                  <p className="text-sm font-semibold text-green-400">Balanced</p>
                </div>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-amber-400 text-2xl shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Variance</p>
                  <p className="text-sm font-semibold text-amber-300">
                    {formatCurrency(totals.variance)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <FaPlus className="text-green-400" />
          {editingLine ? "Edit line" : "Add balance sheet line"}
        </h2>
        <form onSubmit={submitLine} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Section</label>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
              placeholder="e.g. Office furniture"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">As of date</label>
            <input
              type="date"
              value={form.asOfDate}
              onChange={(e) => setForm({ ...form, asOfDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : null}
              {editingLine ? "Update" : "Add line"}
            </button>
            {editingLine && (
              <button
                type="button"
                onClick={() => {
                  setEditingLine(null);
                  setForm(emptyLine);
                }}
                className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-white">
          <FaSpinner className="animate-spin w-8 h-8" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderSection("Assets", data.assets, "bg-emerald-900/40")}
          {renderSection("Liabilities", data.liabilities, "bg-amber-900/30")}
          {renderSection("Equity", data.equity, "bg-sky-900/30")}
        </div>
      ) : null}
    </div>
  );
};

export default BalanceSheet;
