import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../api/userApi";

export const getUsers = createAsyncThunk(
  "users/getUsers",
  async (params, { rejectWithValue }) => {
    try {
      const response = await userApi.getUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

export const getUser = createAsyncThunk(
  "users/getUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.getUser(id);
      console.log("getUser API response:", response.data);
      return response.data;
    } catch (error) {
      console.log("getUser API error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userApi.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user"
      );
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUser(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user"
      );
    }
  }
);

export const createLawFirmAdmin = createAsyncThunk(
  "users/createLawFirmAdmin",
  async (adminData, { rejectWithValue }) => {
    try {
      const response = await userApi.createLawFirmAdmin(adminData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create law firm admin"
      );
    }
  }
);

export const deactivateUser = createAsyncThunk(
  "users/deactivateUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.deactivateUser(id);
      return { id, user: response.data.user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deactivate user"
      );
    }
  }
);

export const resetUserPassword = createAsyncThunk(
  "users/resetUserPassword",
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.resetUserPassword(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset user password"
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.deleteUser(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

const initialState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("📊 Users API Response:", action.payload);
        
        // Handle different response structures
        if (action.payload && action.payload.data) {
          if (Array.isArray(action.payload.data)) {
            // Direct array response
            state.users = action.payload.data;
          } else if (Array.isArray(action.payload.data.users)) {
            // Nested users array
            state.users = action.payload.data.users;
            state.pagination = action.payload.data.pagination || {};
          } else if (Array.isArray(action.payload.users)) {
            // Users at root level
            state.users = action.payload.users;
            state.pagination = action.payload.pagination || {};
          } else {
            state.users = [];
            state.pagination = {};
          }
        } else if (Array.isArray(action.payload)) {
          // Direct array payload
          state.users = action.payload;
        } else {
          state.users = [];
          state.pagination = {};
        }
        
        console.log("📊 Processed Users:", state.users.length);
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.data;
        state.error = null;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (user) => user._id === action.payload._id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(createLawFirmAdmin.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        state.users = state.users.map((u) =>
          u._id === action.payload.id ? action.payload.user : u
        );
      })
      .addCase(resetUserPassword.fulfilled, () => {
        // No state change needed, handled by UI toast
      })
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter((user) => user._id !== action.payload.id);
        if (state.currentUser && state.currentUser._id === action.payload.id) {
          state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
