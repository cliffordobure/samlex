import mongoose from "mongoose";
import {
  LedgerAccount,
  FirmExpense,
  BalanceSheetLine,
} from "../models/index.js";
import { validateObjectId } from "../middleware/validation.js";

function assertLawFirmAccess(req, lawFirmId) {
  if (!validateObjectId(lawFirmId)) {
    return { error: { status: 400, message: "Invalid law firm ID format" } };
  }
  const userFirmId = req.user.lawFirm?._id?.toString() || req.user.lawFirm?.toString();
  if (
    (req.user.role === "accountant" || req.user.role === "law_firm_admin") &&
    userFirmId &&
    lawFirmId !== userFirmId
  ) {
    return { error: { status: 403, message: "Unauthorized access to law firm" } };
  }
  return {};
}

const DEFAULT_ACCOUNTS = [
  { name: "Cash and Bank", code: "1000", accountType: "asset" },
  { name: "Accounts Receivable", code: "1100", accountType: "asset" },
  { name: "Office Equipment", code: "1200", accountType: "asset" },
  { name: "Accounts Payable", code: "2000", accountType: "liability" },
  { name: "Accrued Expenses", code: "2100", accountType: "liability" },
  { name: "Owner Equity", code: "3000", accountType: "equity" },
  { name: "Retained Earnings", code: "3100", accountType: "equity" },
  { name: "Legal Services Revenue", code: "4000", accountType: "revenue" },
  { name: "Rent Expense", code: "5000", accountType: "expense" },
  { name: "Salaries and Wages", code: "5100", accountType: "expense" },
  { name: "Utilities", code: "5200", accountType: "expense" },
  { name: "Professional Fees", code: "5300", accountType: "expense" },
  { name: "Office Supplies", code: "5400", accountType: "expense" },
  { name: "Miscellaneous Expense", code: "5900", accountType: "expense" },
];

export const seedLedgerAccounts = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const existing = await LedgerAccount.countDocuments({ lawFirm: lawFirmId });
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: "Ledger accounts already exist for this firm. Add accounts manually if needed.",
      });
    }

    const docs = DEFAULT_ACCOUNTS.map((a) => ({
      ...a,
      lawFirm: lawFirmId,
      isSystem: true,
    }));
    await LedgerAccount.insertMany(docs);

    const accounts = await LedgerAccount.find({ lawFirm: lawFirmId }).sort({
      code: 1,
    });
    res.json({ success: true, data: accounts, message: "Default chart of accounts created" });
  } catch (e) {
    console.error("seedLedgerAccounts:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listLedgerAccounts = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const { accountType } = req.query;
    const q = { lawFirm: lawFirmId, isActive: true };
    if (accountType) q.accountType = accountType;

    const accounts = await LedgerAccount.find(q).sort({ code: 1, name: 1 });
    res.json({ success: true, data: accounts });
  } catch (e) {
    console.error("listLedgerAccounts:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createLedgerAccount = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const { name, code, accountType, description } = req.body;
    if (!name || !accountType) {
      return res.status(400).json({
        success: false,
        message: "name and accountType are required",
      });
    }

    const acc = await LedgerAccount.create({
      lawFirm: lawFirmId,
      name,
      code: code || "",
      accountType,
      description,
      isSystem: false,
    });
    res.status(201).json({ success: true, data: acc });
  } catch (e) {
    console.error("createLedgerAccount:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateLedgerAccount = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account id" });
    }

    const acc = await LedgerAccount.findOne({ _id: id, lawFirm: lawFirmId });
    if (!acc) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const { name, code, accountType, description, isActive } = req.body;
    if (name !== undefined) acc.name = name;
    if (code !== undefined) acc.code = code;
    if (accountType !== undefined) acc.accountType = accountType;
    if (description !== undefined) acc.description = description;
    if (isActive !== undefined) acc.isActive = isActive;
    await acc.save();

    res.json({ success: true, data: acc });
  } catch (e) {
    console.error("updateLedgerAccount:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteLedgerAccount = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account id" });
    }

    const linked = await FirmExpense.countDocuments({
      lawFirm: lawFirmId,
      ledgerAccount: id,
    });
    if (linked > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an account that has expenses posted to it",
      });
    }

    const acc = await LedgerAccount.findOneAndDelete({ _id: id, lawFirm: lawFirmId });
    if (!acc) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    res.json({ success: true, message: "Account removed" });
  } catch (e) {
    console.error("deleteLedgerAccount:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listExpenses = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const { from, to, ledgerAccountId } = req.query;
    const q = { lawFirm: lawFirmId };
    if (from || to) {
      q.expenseDate = {};
      if (from) q.expenseDate.$gte = new Date(from);
      if (to) q.expenseDate.$lte = new Date(to);
    }
    if (ledgerAccountId && validateObjectId(ledgerAccountId)) {
      q.ledgerAccount = ledgerAccountId;
    }

    const expenses = await FirmExpense.find(q)
      .populate("ledgerAccount", "name code accountType")
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(500);

    res.json({ success: true, data: expenses });
  } catch (e) {
    console.error("listExpenses:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const {
      amount,
      currency,
      expenseDate,
      description,
      category,
      ledgerAccount,
      paymentMethod,
      reference,
      vendor,
    } = req.body;

    if (amount == null || !description) {
      return res.status(400).json({
        success: false,
        message: "amount and description are required",
      });
    }

    if (ledgerAccount) {
      if (!validateObjectId(ledgerAccount)) {
        return res.status(400).json({ success: false, message: "Invalid ledger account" });
      }
      const acc = await LedgerAccount.findOne({
        _id: ledgerAccount,
        lawFirm: lawFirmId,
        accountType: "expense",
      });
      if (!acc) {
        return res.status(400).json({
          success: false,
          message: "Ledger account must be an expense account for this firm",
        });
      }
    }

    const exp = await FirmExpense.create({
      lawFirm: lawFirmId,
      amount: Number(amount),
      currency: currency || "KES",
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      description,
      category: category || "General",
      ledgerAccount: ledgerAccount || undefined,
      paymentMethod: paymentMethod || "bank_transfer",
      reference,
      vendor,
      createdBy: req.user._id,
    });

    const populated = await FirmExpense.findById(exp._id).populate(
      "ledgerAccount",
      "name code accountType"
    );
    res.status(201).json({ success: true, data: populated });
  } catch (e) {
    console.error("createExpense:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid expense id" });
    }

    const exp = await FirmExpense.findOne({ _id: id, lawFirm: lawFirmId });
    if (!exp) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const fields = [
      "amount",
      "currency",
      "expenseDate",
      "description",
      "category",
      "ledgerAccount",
      "paymentMethod",
      "reference",
      "vendor",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === "expenseDate") exp[f] = new Date(req.body[f]);
        else if (f === "amount") exp[f] = Number(req.body[f]);
        else if (f === "ledgerAccount") {
          if (req.body[f] && validateObjectId(req.body[f])) {
            const acc = await LedgerAccount.findOne({
              _id: req.body[f],
              lawFirm: lawFirmId,
              accountType: "expense",
            });
            if (!acc) {
              return res.status(400).json({
                success: false,
                message: "Invalid expense ledger account",
              });
            }
            exp.ledgerAccount = req.body[f];
          } else {
            exp.ledgerAccount = undefined;
          }
        } else exp[f] = req.body[f];
      }
    }
    await exp.save();

    const populated = await FirmExpense.findById(exp._id).populate(
      "ledgerAccount",
      "name code accountType"
    );
    res.json({ success: true, data: populated });
  } catch (e) {
    console.error("updateExpense:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid expense id" });
    }

    const exp = await FirmExpense.findOneAndDelete({ _id: id, lawFirm: lawFirmId });
    if (!exp) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.json({ success: true, message: "Expense deleted" });
  } catch (e) {
    console.error("deleteExpense:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listBalanceSheetLines = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const lines = await BalanceSheetLine.find({ lawFirm: lawFirmId })
      .sort({ section: 1, sortOrder: 1, label: 1 })
      .lean();

    res.json({ success: true, data: lines });
  } catch (e) {
    console.error("listBalanceSheetLines:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getBalanceSheet = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const lines = await BalanceSheetLine.find({ lawFirm: lawFirmId })
      .sort({ section: 1, sortOrder: 1, label: 1 })
      .lean();

    const assets = lines.filter((l) => l.section === "asset");
    const liabilities = lines.filter((l) => l.section === "liability");
    const equity = lines.filter((l) => l.section === "equity");

    const totalAssets = assets.reduce((s, l) => s + (l.amount || 0), 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + (l.amount || 0), 0);
    const totalEquity = equity.reduce((s, l) => s + (l.amount || 0), 0);
    const liabilitiesPlusEquity = totalLiabilities + totalEquity;
    const balanced = Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01;

    res.json({
      success: true,
      data: {
        assets,
        liabilities,
        equity,
        totals: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          liabilitiesPlusEquity,
          balanced,
          variance: totalAssets - liabilitiesPlusEquity,
        },
      },
    });
  } catch (e) {
    console.error("getBalanceSheet:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createBalanceSheetLine = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const { section, label, amount, asOfDate, notes, sortOrder } = req.body;
    if (!section || !label || amount == null) {
      return res.status(400).json({
        success: false,
        message: "section, label, and amount are required",
      });
    }

    const line = await BalanceSheetLine.create({
      lawFirm: lawFirmId,
      section,
      label,
      amount: Number(amount),
      asOfDate: asOfDate ? new Date(asOfDate) : new Date(),
      notes,
      sortOrder: sortOrder ?? 0,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: line });
  } catch (e) {
    console.error("createBalanceSheetLine:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateBalanceSheetLine = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const line = await BalanceSheetLine.findOne({ _id: id, lawFirm: lawFirmId });
    if (!line) {
      return res.status(404).json({ success: false, message: "Line not found" });
    }

    const { section, label, amount, asOfDate, notes, sortOrder } = req.body;
    if (section !== undefined) line.section = section;
    if (label !== undefined) line.label = label;
    if (amount !== undefined) line.amount = Number(amount);
    if (asOfDate !== undefined) line.asOfDate = new Date(asOfDate);
    if (notes !== undefined) line.notes = notes;
    if (sortOrder !== undefined) line.sortOrder = sortOrder;
    await line.save();

    res.json({ success: true, data: line });
  } catch (e) {
    console.error("updateBalanceSheetLine:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteBalanceSheetLine = async (req, res) => {
  try {
    const { lawFirmId, id } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const line = await BalanceSheetLine.findOneAndDelete({
      _id: id,
      lawFirm: lawFirmId,
    });
    if (!line) {
      return res.status(404).json({ success: false, message: "Line not found" });
    }
    res.json({ success: true, message: "Line removed" });
  } catch (e) {
    console.error("deleteBalanceSheetLine:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getGeneralLedger = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const { from, to } = req.query;
    const match = { lawFirm: new mongoose.Types.ObjectId(lawFirmId) };
    if (from || to) {
      match.expenseDate = {};
      if (from) match.expenseDate.$gte = new Date(from);
      if (to) match.expenseDate.$lte = new Date(to);
    }

    const byAccount = await FirmExpense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$ledgerAccount",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const accountIds = byAccount
      .map((x) => x._id)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    const accounts = accountIds.length
      ? await LedgerAccount.find({ _id: { $in: accountIds } }).lean()
      : [];

    const accountMap = Object.fromEntries(accounts.map((a) => [a._id.toString(), a]));

    const expenseAccountTotals = byAccount.map((row) => ({
      ledgerAccountId: row._id,
      account: row._id ? accountMap[row._id.toString()] || null : null,
      totalDebit: row.total,
      entryCount: row.count,
    }));

    const unassigned = byAccount.find((x) => !x._id);
    const unassignedTotal = unassigned ? unassigned.total : 0;
    const unassignedCount = unassigned ? unassigned.count : 0;

    const grandTotalExpenses = await FirmExpense.aggregate([
      { $match: match },
      { $group: { _id: null, t: { $sum: "$amount" } } },
    ]);
    const totalExpenses = grandTotalExpenses[0]?.t || 0;

    res.json({
      success: true,
      data: {
        expenseAccountTotals,
        unassigned: { total: unassignedTotal, count: unassignedCount },
        totalExpenses,
        period: { from: from || null, to: to || null },
      },
    });
  } catch (e) {
    console.error("getGeneralLedger:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getAccountingSummary = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const err = assertLawFirmAccess(req, lawFirmId);
    if (err.error) {
      return res.status(err.error.status).json({
        success: false,
        message: err.error.message,
      });
    }

    const days = parseInt(req.query.period || "30", 10);
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [expenseAgg, lineCount, bsLines, accountCount] = await Promise.all([
      FirmExpense.aggregate([
        {
          $match: {
            lawFirm: new mongoose.Types.ObjectId(lawFirmId),
            expenseDate: { $gte: from },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" }, n: { $sum: 1 } } },
      ]),
      FirmExpense.countDocuments({ lawFirm: lawFirmId }),
      BalanceSheetLine.find({ lawFirm: lawFirmId }).lean(),
      LedgerAccount.countDocuments({ lawFirm: lawFirmId, isActive: true }),
    ]);

    const periodExpenseTotal = expenseAgg[0]?.total || 0;
    const periodExpenseCount = expenseAgg[0]?.n || 0;

    const totalAssets = bsLines
      .filter((l) => l.section === "asset")
      .reduce((s, l) => s + (l.amount || 0), 0);
    const totalLiabilities = bsLines
      .filter((l) => l.section === "liability")
      .reduce((s, l) => s + (l.amount || 0), 0);
    const totalEquity = bsLines
      .filter((l) => l.section === "equity")
      .reduce((s, l) => s + (l.amount || 0), 0);

    res.json({
      success: true,
      data: {
        expenses: {
          periodDays: days,
          periodTotal: periodExpenseTotal,
          periodCount: periodExpenseCount,
          allTimeCount: lineCount,
        },
        balanceSheet: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          lineCount: bsLines.length,
          balanced:
            Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        },
        ledgerAccounts: accountCount,
      },
    });
  } catch (e) {
    console.error("getAccountingSummary:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};
