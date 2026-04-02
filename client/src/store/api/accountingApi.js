import axios from "axios";
import { API_URL } from "../../config/api.js";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const accountingApi = {
  getSummary: (lawFirmId, params = {}) =>
    api.get(`/accounting/summary/${lawFirmId}`, { params }),

  seedLedgerAccounts: (lawFirmId) =>
    api.post(`/accounting/ledger-accounts/seed/${lawFirmId}`),

  getLedgerAccounts: (lawFirmId, params = {}) =>
    api.get(`/accounting/ledger-accounts/${lawFirmId}`, { params }),

  createLedgerAccount: (lawFirmId, body) =>
    api.post(`/accounting/ledger-accounts/${lawFirmId}`, body),

  updateLedgerAccount: (lawFirmId, id, body) =>
    api.put(`/accounting/ledger-accounts/${lawFirmId}/${id}`, body),

  deleteLedgerAccount: (lawFirmId, id) =>
    api.delete(`/accounting/ledger-accounts/${lawFirmId}/${id}`),

  getExpenses: (lawFirmId, params = {}) =>
    api.get(`/accounting/expenses/${lawFirmId}`, { params }),

  createExpense: (lawFirmId, body) =>
    api.post(`/accounting/expenses/${lawFirmId}`, body),

  updateExpense: (lawFirmId, id, body) =>
    api.put(`/accounting/expenses/${lawFirmId}/${id}`, body),

  deleteExpense: (lawFirmId, id) =>
    api.delete(`/accounting/expenses/${lawFirmId}/${id}`),

  getBalanceSheet: (lawFirmId) =>
    api.get(`/accounting/balance-sheet/${lawFirmId}`),

  createBalanceSheetLine: (lawFirmId, body) =>
    api.post(`/accounting/balance-sheet-lines/${lawFirmId}`, body),

  updateBalanceSheetLine: (lawFirmId, id, body) =>
    api.put(`/accounting/balance-sheet-lines/${lawFirmId}/${id}`, body),

  deleteBalanceSheetLine: (lawFirmId, id) =>
    api.delete(`/accounting/balance-sheet-lines/${lawFirmId}/${id}`),

  getGeneralLedger: (lawFirmId, params = {}) =>
    api.get(`/accounting/general-ledger/${lawFirmId}`, { params }),
};

export default accountingApi;
