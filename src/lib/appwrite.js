import { Client, Account, Databases, ID, Query, Storage, Permission, Role } from "appwrite";


const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_TASKS_BUCKET_ID;
export { ID, Query };
export const realtime = client;


export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const TASKS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID;
export const PROJECTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID;
export const NOTIFICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
export const COMMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;


export const validTaskStatuses = ["pending", "in-progress", "completed"];
export const defaultTaskStatus = "pending";
export const validProjectStatuses = ["not-started", "in-progress", "completed"];
export const defaultProjectStatus = "not-started";


export const uploadTaskImage = async (file) => {
  if (!file) return null;
  try {
    const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
    return uploaded.$id;
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
};

export const createNotification = async ({ message, userId }) => {
  if (!message || !userId) throw new Error("Notification requires message and userId");

  return databases.createDocument(
    DATABASE_ID,
    NOTIFICATIONS_COLLECTION_ID,
    ID.unique(),
    { message, userId, read: false },
    [Permission.read(Role.user(userId))],
    [Permission.write(Role.user(userId))]
  );
};

export const createTask = async (task) => {
  const user = await account.get();
  if (!user.$id) throw new Error("User not logged in");

  let imageId = null;
  if (task.image instanceof File) {
    imageId = await uploadTaskImage(task.image);
    delete task.image;
  }

  const taskData = {
    title: task.title?.trim() || "Untitled Task",
    description: task.description?.trim() || "",
    status: validTaskStatuses.includes(task.status) ? task.status : defaultTaskStatus,
    completed: !!task.completed,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    userId: user.$id,
    createdBy: user.name || user.email || user.$id,
    updatedBy: user.name || user.email || user.$id,
    ...(imageId ? { imageId } : {}),
  };

  const createdTask = await databases.createDocument(
    DATABASE_ID,
    TASKS_COLLECTION_ID,
    ID.unique(),
    taskData,
    [Permission.read(Role.any())],
    [Permission.write(Role.user(user.$id))]
  );

  await createNotification({
    message: `Task "${taskData.title}" created!`,
    userId: user.$id,
  });

  return createdTask;
};

export const getTasks = async () => {
  const res = await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, [
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
};

export const updateTaskDoc = async (id, updates) => {
  const user = await account.get();
  updates.updatedBy = user.name || user.email || user.$id;
  if (updates.dueDate) updates.dueDate = new Date(updates.dueDate).toISOString();
  if (updates.image instanceof File) {
    updates.imageId = await uploadTaskImage(updates.image);
    delete updates.image;
  }
  const updatedTask = await databases.updateDocument(DATABASE_ID, TASKS_COLLECTION_ID, id, updates);

  await createNotification({
    message: `Task "${updatedTask.title}" updated!`,
    userId: user.$id,
  });

  return updatedTask;
};

export const deleteTaskDoc = async (id) => {
  const user = await account.get();
  const task = await databases.getDocument(DATABASE_ID, TASKS_COLLECTION_ID, id);

  await databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION_ID, id);

  await createNotification({
    message: `Task "${task.title}" deleted!`,
    userId: user.$id,
  });
};


export const addComment = async ({ taskId, text, replyTo = null }) => {
  const user = await account.get();
  if (!user.$id) throw new Error("User not logged in");
  if (!taskId || !text) throw new Error("Task ID and text are required");

  const commentData = {
    taskId,
    text,
    username: user.name || user.email || "Anonymous",
    ...(replyTo ? { replyTo } : {}),
  };

  return databases.createDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, ID.unique(), commentData);
};

export const getCommentsByTask = async (taskId) => {
  if (!taskId) return [];
  const res = await databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION_ID, [
    Query.equal("taskId", taskId),
    Query.orderAsc("$createdAt"),
  ]);

  const map = {};
  res.documents.forEach((c) => (map[c.$id] = { ...c, replies: [] }));
  const rootComments = [];

  res.documents.forEach((c) => {
    if (c.replyTo && map[c.replyTo]) {
      map[c.replyTo].replies.push(map[c.$id]);
    } else {
      rootComments.push(map[c.$id]);
    }
  });

  return rootComments;
};

export const deleteComment = async (commentId) => {
  if (!commentId) throw new Error("Comment ID is required");
  return databases.deleteDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, commentId);
};


export const getNotifications = async (userId) => {
  if (!userId) return [];
  const res = await databases.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
};

export const markNotificationRead = async (id) => {
  return databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, id, { read: true });
};

export const deleteNotificationDoc = async (id) => {
  return databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, id);
};


export const createProject = async (project) => {
  const user = await account.get();
  if (!user.$id) throw new Error("User not logged in");

  const projectData = {
    name: project.name?.trim() || "Untitled Project",
    description: project.description || "",
    deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
    status: project.status || defaultProjectStatus,
    userId: user.$id,
    createdBy: user.name || user.$id,
    updatedBy: user.name || user.$id
  };

  const createdProject = await databases.createDocument(
    DATABASE_ID,
    PROJECTS_COLLECTION_ID,
    ID.unique(),
    projectData,
    [Permission.read(Role.any())],
    [Permission.write(Role.user(`user:${user.$id}`))]
  );

  await createNotification({
    message: `Project "${projectData.name}" created!`,
    userId: user.$id,
  });

  return createdProject;
};

export const updateProjectDoc = async (id, updates) => {
  const user = await account.get();
  const updatedData = { ...updates, updatedBy: user.name || user.$id };

  const updatedProject = await databases.updateDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, id, updatedData);

  await createNotification({
    message: `Project "${updatedProject.name}" updated!`,
    userId: user.$id,
  });

  return updatedProject;
};

export const deleteProjectDoc = async (id) => {
  const user = await account.get();
  const project = await databases.getDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, id);

  await databases.deleteDocument(DATABASE_ID, PROJECTS_COLLECTION_ID, id);

  await createNotification({
    message: `Project "${project.name}" deleted!`,
    userId: user.$id,
  });
};

export const getProjects = async () => {
  const res = await databases.listDocuments(DATABASE_ID, PROJECTS_COLLECTION_ID);
  return res.documents;
};
