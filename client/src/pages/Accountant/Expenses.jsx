import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import accountingApi from "../../store/api/accountingApi";
import {
  FaSpinner,
  FaPlus,
  FaTrash,
  FaEdit,
  FaReceipt,
  FaFilter,
} from "react-icons/fa";
import toast from "react-hot-toast";

const emptyForm = {
  amount: "",
  description: "",
  category: "General",
  expenseDate: new Date().toISOString().slice(0, 10),
  ledgerAccount: "",
  paymentMethod: "bank_transfer",
  reference: "",
  vendor: "",
};

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const firmId = user?.lawFirm?._id;
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const [expRes, accRes] = await Promise.all([
        accountingApi.getExpenses(firmId, params),
        accountingApi.getLedgerAccounts(firmId, { accountType: "expense" }),
      ]);
      if (expRes.data.success) setExpenses(expRes.data.data);
      if (accRes.data.success) setAccounts(accRes.data.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [firmId, from, to]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!firmId) return;
    const amount = Number(form.amount);
    if (!form.description?.trim() || Number.isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount and description");
      return;
    }
    try {
      setSaving(true);
      const body = {
        amount,
        description: form.description.trim(),
        category: form.category || "General",
        expenseDate: form.expenseDate,
        paymentMethod: form.paymentMethod,
        reference: form.reference || undefined,
        vendor: form.vendor || undefined,
        ledgerAccount: form.ledgerAccount || undefined,
      };
      if (editingId) {
        await accountingApi.updateExpense(firmId, editingId, body);
        toast.success("Expense updated");
      } else {
        await accountingApi.createExpense(firmId, body);
        toast.success("Expense recorded");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setEditingId(row._id);
    setForm({
      amount: String(row.amount),
      description: row.description,
      category: row.category || "General",
      expenseDate: row.expenseDate
        ? new Date(row.expenseDate).toISOString().slice(0, 10)
        : emptyForm.expenseDate,
      ledgerAccount: row.ledgerAccount?._id || row.ledgerAccount || "",
      paymentMethod: row.paymentMethod || "bank_transfer",
      reference: row.reference || "",
      vendor: row.vendor || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!firmId || !window.confirm("Delete this expense?")) return;
    try {
      await accountingApi.deleteExpense(firmId, id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaReceipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Expenses</h1>
              <p className="text-xs text-slate-300 mt-1">
                Record firm expenses and assign them to ledger accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <FaFilter className="text-green-400" />
          {editingId ? "Edit expense" : "Add expense"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ledger account</label>
            <select
              value={form.ledgerAccount}
              onChange={(e) => setForm({ ...form, ledgerAccount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            >
              <option value="">— Unassigned —</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code ? `${a.code} — ` : ""}
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
              <option value="check">Check</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vendor</label>
            <input
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reference</label>
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {editingId ? "Update" : "Save expense"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="text-xs text-green-400 hover:text-green-300 px-2 py-2"
          >
            Clear dates
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-white">
            <FaSpinner className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-600/50 text-slate-400 text-left">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2">Account</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2">Method</th>
                  <th className="py-2 px-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No expenses yet. Add one above.
                    </td>
                  </tr>
                ) : (
                  expenses.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-slate-600/30 hover:bg-slate-700/30 text-slate-200"
                    >
                      <td className="py-2 px-2 whitespace-nowrap">
                        {new Date(row.expenseDate).toLocaleDateString("en-KE")}
                      </td>
                      <td className="py-2 px-2 max-w-[200px] truncate">{row.description}</td>
                      <td className="py-2 px-2">{row.category}</td>
                      <td className="py-2 px-2">
                        {row.ledgerAccount?.name || "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-white">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="py-2 px-2 capitalize">
                        {row.paymentMethod?.replace("_", " ")}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 mr-1"
                          aria-label="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row._id)}
                          className="p-1.5 text-red-400 hover:text-red-300"
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
        )}
      </div>
    </div>
  );
};

export default Expenses;
