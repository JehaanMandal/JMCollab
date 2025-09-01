import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getProjects, createProject, updateProjectDoc, deleteProjectDoc } from "../../lib/appwrite";


export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const projects = await getProjects();
      return projects.map(p => ({
        $id: p.$id,
        name: p.name,
        description: p.description || "",
        deadline: p.deadline || "",
        status: p.status || "not-started",
        createdBy: p.createdBy || "Unknown",
        userId: p.userId,
        updatedBy: p.updatedBy || null,
        updatedAt: p.updatedAt || null,
        $createdAt: p.$createdAt,
      }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addProject = createAsyncThunk(
  "projects/addProject",
  async (project, { rejectWithValue }) => {
    try {
      const newProject = await createProject(project);
      return {
        $id: newProject.$id,
        name: newProject.name,
        description: newProject.description || "",
        deadline: newProject.deadline || "",
        status: newProject.status || "not-started",
        createdBy: newProject.createdBy || "Unknown",
        userId: newProject.userId,
        updatedBy: newProject.updatedBy || null,
        updatedAt: newProject.updatedAt || null,
        $createdAt: newProject.$createdAt,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const updated = await updateProjectDoc(id, updates);
      return {
        $id: updated.$id,
        name: updated.name,
        description: updated.description || "",
        deadline: updated.deadline || "",
        status: updated.status || "not-started",
        createdBy: updated.createdBy || "Unknown",
        userId: updated.userId,
        updatedBy: updated.updatedBy || null,
        $updatedAt: updated.$updatedAt,
        $createdAt: updated.$createdAt,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id, { rejectWithValue }) => {
    try {
      await deleteProjectDoc(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


const projectSlice = createSlice({
  name: "projects",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
  
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

     
      .addCase(addProject.pending, (state, action) => {
        state.loading = false; // don't block UI
        state.error = null;
     
        const tempProject = {
          ...action.meta.arg,
          $id: "temp-" + Date.now(),
          createdBy: "You",
          userId: action.meta.arg.userId,
          status: action.meta.arg.status || "not-started",
          description: action.meta.arg.description || "",
          $createdAt: new Date().toISOString(),
        };
        state.items.push(tempProject);
      })
      .addCase(addProject.fulfilled, (state, action) => {
       
        state.items = state.items.map(p =>
          p.$id.startsWith("temp-") ? action.payload : p
        );
        state.loading = false;
      })
      .addCase(addProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        // Optionally remove temp project if failed
        state.items = state.items.filter(p => !p.$id.startsWith("temp-"));
      })

  
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.items = state.items.map(p => p.$id === action.payload.$id ? action.payload : p);
        state.loading = false;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

   
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.$id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export default projectSlice.reducer;
