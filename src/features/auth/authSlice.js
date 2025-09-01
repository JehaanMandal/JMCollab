import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { account, ID } from "../../lib/appwrite";




export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const user = await account.create({
        userId: ID.unique(),
        name,
        email,
        password,
      });
      return user;
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

// Login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
     
      await account.createEmailPasswordSession({ email, password });

      const user = await account.get();
      return user;
    } catch (error) {
      if (error.code === 429) {
        return rejectWithValue(
          "Too many requests. Please wait a moment before trying again."
        );
      }
      return rejectWithValue(error.message || "Login failed");
    }
  }
);


export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      if (error.code === 429) {
        return rejectWithValue(
          "Too many requests. Please wait a moment before trying again."
        );
      }
      return rejectWithValue(error.message || "Could not fetch user");
    }
  }
);


export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await account.deleteSession({ sessionId: "current" });
      return true;
    } catch (error) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, loading: false, error: null },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })

    
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { resetError } = authSlice.actions;
export default authSlice.reducer;
