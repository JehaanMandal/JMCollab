import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTasks, createTask, updateTaskDoc, deleteTaskDoc } from "../../lib/appwrite";


export const fetchTasks = createAsyncThunk("tasks/fetchTasks", async () => {
  const res = await getTasks();
  return res;
});

export const addTask = createAsyncThunk("tasks/addTask", async (task) => {
  const res = await createTask(task);
  return res;
});

export const updateTask = createAsyncThunk("tasks/updateTask", async ({ id, updates }) => {
  const res = await updateTaskDoc(id, updates);
  return res;
});

export const deleteTask = createAsyncThunk("tasks/deleteTask", async (id) => {
  await deleteTaskDoc(id);
  return id;
});


const taskSlice = createSlice({
  name: "tasks",
  initialState: { tasks: [], loading: false, error: null },
  reducers: {
    addTaskOptimistic: (state, action) => { state.tasks.unshift(action.payload); },
    removeTaskOptimistic: (state, action) => { state.tasks = state.tasks.filter(t => t.$id !== action.payload); },
    updateTaskOptimistic: (state, action) => {
      state.tasks = state.tasks.map(t => t.$id === action.payload.$id ? { ...t, ...action.payload } : t);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.tasks = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      .addCase(addTask.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addTask.fulfilled, (state, action) => { state.loading = false; state.tasks.unshift(action.payload); })
      .addCase(addTask.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      .addCase(updateTask.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.map(t => t.$id === action.payload.$id ? { ...t, ...action.payload } : t);
      })
      .addCase(updateTask.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      .addCase(deleteTask.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(t => t.$id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export const { addTaskOptimistic, removeTaskOptimistic, updateTaskOptimistic } = taskSlice.actions;
export default taskSlice.reducer;
