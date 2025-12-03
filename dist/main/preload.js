"use strict";

// src/main/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Goals
  getGoals: () => import_electron.ipcRenderer.invoke("get-goals"),
  saveGoal: (goal) => import_electron.ipcRenderer.invoke("save-goal", goal),
  deleteGoal: (goalId) => import_electron.ipcRenderer.invoke("delete-goal", goalId),
  // Tasks
  getTasks: () => import_electron.ipcRenderer.invoke("get-tasks"),
  saveTasks: (tasks) => import_electron.ipcRenderer.invoke("save-tasks", tasks),
  updateTask: (task) => import_electron.ipcRenderer.invoke("update-task", task),
  // Settings
  getSettings: () => import_electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => import_electron.ipcRenderer.invoke("save-settings", settings),
  // Window controls
  minimizeWindow: () => import_electron.ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => import_electron.ipcRenderer.invoke("window-maximize"),
  closeWindow: () => import_electron.ipcRenderer.invoke("window-close"),
  // Notifications
  showNotification: (title, body) => import_electron.ipcRenderer.invoke("show-notification", title, body),
  // AI
  testAIConnection: (baseUrl, apiKey) => import_electron.ipcRenderer.invoke("ai-test-connection", baseUrl, apiKey),
  generateTasks: (goal, settings, existingTasks) => import_electron.ipcRenderer.invoke("ai-generate-tasks", goal, settings, existingTasks)
});
