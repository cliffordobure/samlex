import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../api/authApi";

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      const apiResponse = response.data;

      // The response structure is: { success: true, message: "...", data: { token, user, userType } }
      const token = apiResponse.data?.token;
      const user = apiResponse.data?.user;
      const userType = apiResponse.data?.userType;

      if (!token) {
        return rejectWithValue("Authentication failed: No token received");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userType", userType);

      return {
        token,
        user,
        userType,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        "🔍 Getting current user with token:",
        token ? "Token exists" : "No token"
      );

      if (!token) {
        throw new Error("No token found");
      }

      const response = await authApi.getMe();
      console.log("✅ Current user retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Get current user error:",
        error.response?.data || error.message
      );
      localStorage.removeItem("token");
      return rejectWithValue(
        error.response?.data?.message || "Failed to get user data"
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authApi.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password"
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      localStorage.removeItem("token");
      console.log("🚪 User logged out successfully"); // Debug log
      return null;
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword(email);
      return response.data;
    } catch (error) {
      // Return detailed error messages from backend
      if (error.response?.data?.errors) {
        return rejectWithValue(error.response.data.errors);
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to send password reset email"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.resetPassword(token, password);
      return response.data;
    } catch (error) {
      // Return detailed error messages from backend
      if (error.response?.data?.errors) {
        return rejectWithValue(error.response.data.errors);
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset password"
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.registerUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to register user"
      );
    }
  }
);

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  token: localStorage.getItem("token"),
  userType: localStorage.getItem("userType"),
  isAuthenticated: !!localStorage.getItem("token"),
  isLoading: false,
  error: null,
  forgotPasswordLoading: false,
  forgotPasswordSuccess: false,
  forgotPasswordError: null,
  resetPasswordLoading: false,
  resetPasswordSuccess: false,
  resetPasswordError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
    },
    clearInvalidToken: (state) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("🔄 Login pending..."); // Debug log
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userType = action.payload.userType;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(action.payload.user)); // Persist only the user object
        console.log(
          "✅ Login fulfilled, user authenticated:",
          action.payload.user?.email || action.payload.user?.firmEmail,
          "User Type:",
          action.payload.userType
        ); // Debug log
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        console.log("❌ Login rejected:", action.payload); // Debug log
      })
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        console.log("🔄 Getting current user..."); // Debug log
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data; // Only the user object!
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(action.payload.data)); // Persist only the user object

        // Update userType in localStorage based on actual user role
        const userRole = action.payload.data?.role;
        if (userRole) {
          state.userType = userRole;
          localStorage.setItem("userType", userRole);
        }

        console.log(
          "✅ Current user retrieved:",
          action.payload.data?.email,
          "Role:",
          userRole
        ); // Debug log
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        console.log("❌ Get current user rejected:", action.payload); // Debug log
      })
      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
      })
      // Forgot Password cases
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordSuccess = false;
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = true;
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = false;
        state.forgotPasswordError = action.payload;
      })
      // Reset Password cases
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = action.payload;
      })
      // Register User cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearAuth, clearInvalidToken } = authSlice.actions;
export default authSlice.reducer;
