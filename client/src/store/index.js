import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import lawFirmSlice from "./slices/lawFirmSlice";
import departmentSlice from "./slices/departmentSlice";
import userSlice from "./slices/userSlice";
import clientSlice from "./slices/clientSlice";
import creditCaseSlice from "./slices/creditCaseSlice";
import legalCaseSlice from "./slices/legalCaseSlice";
import notificationSlice from "./slices/notificationSlice";
import reportsSlice from "./slices/reportsSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    lawFirms: lawFirmSlice,
    departments: departmentSlice,
    users: userSlice,
    clients: clientSlice,
    creditCases: creditCaseSlice,
    legalCases: legalCaseSlice,
    notifications: notificationSlice,
    reports: reportsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

export default store;
