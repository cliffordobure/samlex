import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  seedLedgerAccounts,
  listLedgerAccounts,
  createLedgerAccount,
  updateLedgerAccount,
  deleteLedgerAccount,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listBalanceSheetLines,
  getBalanceSheet,
  createBalanceSheetLine,
  updateBalanceSheetLine,
  deleteBalanceSheetLine,
  getGeneralLedger,
  getAccountingSummary,
} from "../controllers/accountingController.js";

const router = express.Router();

const accountingRoles = ["accountant", "law_firm_admin"];

router.use(protect);
router.use(authorize(...accountingRoles));

router.get("/summary/:lawFirmId", getAccountingSummary);

router.post("/ledger-accounts/seed/:lawFirmId", seedLedgerAccounts);
router.get("/ledger-accounts/:lawFirmId", listLedgerAccounts);
router.post("/ledger-accounts/:lawFirmId", createLedgerAccount);
router.put("/ledger-accounts/:lawFirmId/:id", updateLedgerAccount);
router.delete("/ledger-accounts/:lawFirmId/:id", deleteLedgerAccount);

router.get("/expenses/:lawFirmId", listExpenses);
router.post("/expenses/:lawFirmId", createExpense);
router.put("/expenses/:lawFirmId/:id", updateExpense);
router.delete("/expenses/:lawFirmId/:id", deleteExpense);

router.get("/balance-sheet/:lawFirmId", getBalanceSheet);
router.get("/balance-sheet-lines/:lawFirmId", listBalanceSheetLines);
router.post("/balance-sheet-lines/:lawFirmId", createBalanceSheetLine);
router.put("/balance-sheet-lines/:lawFirmId/:id", updateBalanceSheetLine);
router.delete("/balance-sheet-lines/:lawFirmId/:id", deleteBalanceSheetLine);

router.get("/general-ledger/:lawFirmId", getGeneralLedger);

export default router;
