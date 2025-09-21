import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import departmentApi from "../api/departmentApi";

export const getDepartments = createAsyncThunk(
  "departments/getDepartments",
  async (params, { rejectWithValue }) => {
    try {
      const response = await departmentApi.getDepartments(params);
      console.log("🔍 Get Departments Response:", response.data);

      // Assuming your backend returns { success: true, data: [...] }
      if (!response.data.success) {
        return rejectWithValue(
          response.data.message || "Failed to fetch departments"
        );
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch departments"
      );
    }
  }
);

export const createDepartment = createAsyncThunk(
  "departments/createDepartment",
  async (departmentData, { rejectWithValue }) => {
    try {
      const response = await departmentApi.createDepartment(departmentData);
      console.log("🔍 API Response:", response.data);

      // Check if the response indicates success
      if (!response.data.success) {
        return rejectWithValue(
          response.data.message || "Failed to create department"
        );
      }

      // Return the actual department data
      return response.data.data;
    } catch (error) {
      console.log("🔥 API Error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to create department"
      );
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/updateDepartment",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await departmentApi.updateDepartment(id, data);
      console.log("🔍 Update Department Response:", response.data);

      if (!response.data.success) {
        return rejectWithValue(
          response.data.message || "Failed to update department"
        );
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update department"
      );
    }
  }
);
export const deleteDepartment = createAsyncThunk(
  "departments/deleteDepartment",
  async (id, { rejectWithValue }) => {
    try {
      const response = await departmentApi.deleteDepartment(id);
      console.log("🗑️ Delete Department Response:", response.data);

      if (!response.data.success) {
        return rejectWithValue(
          response.data.message || "Failed to delete department"
        );
      }

      // Return the deleted department's id
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete department"
      );
    }
  }
);

const initialState = {
  departments: [],
  currentDepartment: null,
  isLoading: false,
  error: null,
};

const departmentSlice = createSlice({
  name: "departments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDepartment: (state, action) => {
      state.currentDepartment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET DEPARTMENTS
      .addCase(getDepartments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDepartments.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("📊 Departments API Response:", action.payload);
        
        // Handle different response structures
        if (Array.isArray(action.payload)) {
          state.departments = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.departments = action.payload.data;
        } else {
          state.departments = [];
        }
        
        console.log("📊 Processed Departments:", state.departments.length);
      })
      .addCase(getDepartments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // CREATE DEPARTMENT - ADD THESE MISSING CASES
      .addCase(createDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments.push(action.payload);
        state.error = null;
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // UPDATE DEPARTMENT - ADD MISSING CASES
      .addCase(updateDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.departments.findIndex(
          (dept) => dept._id === action.payload._id
        );
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // DELETE DEPARTMENT
      .addCase(deleteDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the deleted department from the array
        state.departments = state.departments.filter(
          (dept) => dept._id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentDepartment } = departmentSlice.actions;
export default departmentSlice.reducer;
