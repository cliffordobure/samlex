import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import lawFirmApi from "../api/lawFirmApi";

// Async thunks
export const getLawFirms = createAsyncThunk(
  "lawFirms/getLawFirms",
  async (params, { rejectWithValue }) => {
    try {
      const response = await lawFirmApi.getLawFirms(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch law firms"
      );
    }
  }
);

export const createLawFirm = createAsyncThunk(
  "lawFirms/createLawFirm",
  async (lawFirmData, { rejectWithValue }) => {
    try {
      const response = await lawFirmApi.createLawFirm(lawFirmData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create law firm"
      );
    }
  }
);

export const registerLawFirm = createAsyncThunk(
  "lawFirms/registerLawFirm",
  async (lawFirmData, { rejectWithValue }) => {
    try {
      const response = await lawFirmApi.registerLawFirm(lawFirmData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to register law firm"
      );
    }
  }
);

export const updateLawFirm = createAsyncThunk(
  "lawFirms/updateLawFirm",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await lawFirmApi.updateLawFirm(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update law firm"
      );
    }
  }
);

export const deleteLawFirm = createAsyncThunk(
  "lawFirms/deleteLawFirm",
  async (id, { rejectWithValue }) => {
    try {
      await lawFirmApi.deleteLawFirm(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete law firm"
      );
    }
  }
);

const initialState = {
  lawFirms: [],
  currentLawFirm: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const lawFirmSlice = createSlice({
  name: "lawFirms",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLawFirm: (state, action) => {
      state.currentLawFirm = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get law firms
      .addCase(getLawFirms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLawFirms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lawFirms = action.payload.data.lawFirms;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getLawFirms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create law firm
      .addCase(createLawFirm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLawFirm.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lawFirms.unshift(action.payload.data);
      })
      .addCase(createLawFirm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update law firm
      .addCase(updateLawFirm.fulfilled, (state, action) => {
        const index = state.lawFirms.findIndex(
          (firm) => firm._id === action.payload.data._id
        );
        if (index !== -1) {
          state.lawFirms[index] = action.payload.data;
        }
        if (state.currentLawFirm?._id === action.payload.data._id) {
          state.currentLawFirm = action.payload.data;
        }
      })
      // Delete law firm
      .addCase(deleteLawFirm.fulfilled, (state, action) => {
        state.lawFirms = state.lawFirms.filter(
          (firm) => firm._id !== action.payload
        );
      });
  },
});

export const { clearError, setCurrentLawFirm } = lawFirmSlice.actions;
export default lawFirmSlice.reducer;
