import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getNotifications,
  markNotificationRead,
  deleteNotificationDoc,
  createNotification,
} from "../../lib/appwrite";


export const fetchNotifications = createAsyncThunk("notifications/fetch", async (userId, thunkAPI) => {
  try {
    const res = await getNotifications(userId);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch notifications");
  }
});

export const markRead = createAsyncThunk("notifications/markRead", async (id, thunkAPI) => {
  try {
    const res = await markNotificationRead(id);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to mark notification as read");
  }
});

export const deleteNotification = createAsyncThunk("notifications/delete", async (id, thunkAPI) => {
  try {
    await deleteNotificationDoc(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to delete notification");
  }
});

export const addNotification = createAsyncThunk("notifications/add", async (data, thunkAPI) => {
  try {
    const res = await createNotification(data);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to add notification");
  }
});


const notificationSlice = createSlice({
  name: "notifications",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.sort((a,b)=> new Date(b.$createdAt)-new Date(a.$createdAt));
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.error = action.payload; state.loading = false; })

      .addCase(markRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n)=>n.$id===action.payload.$id);
        if(idx!==-1) state.items[idx] = action.payload;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((n)=>n.$id!==action.payload);
      })

      .addCase(addNotification.fulfilled, (state, action)=>{
        state.items.unshift(action.payload);
      });
  }
});

export default notificationSlice.reducer;
