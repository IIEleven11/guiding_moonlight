import { contextBridge, ipcRenderer } from 'electron';
import { Goal, Task, UserSettings } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Goals
  getGoals: (): Promise<Goal[]> => ipcRenderer.invoke('get-goals'),
  saveGoal: (goal: Goal): Promise<Goal[]> => ipcRenderer.invoke('save-goal', goal),
  deleteGoal: (goalId: string): Promise<Goal[]> => ipcRenderer.invoke('delete-goal', goalId),

  // Tasks
  getTasks: (): Promise<Task[]> => ipcRenderer.invoke('get-tasks'),
  saveTasks: (tasks: Task[]): Promise<Task[]> => ipcRenderer.invoke('save-tasks', tasks),
  updateTask: (task: Task): Promise<Task[]> => ipcRenderer.invoke('update-task', task),

  // Settings
  getSettings: (): Promise<UserSettings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: UserSettings): Promise<UserSettings> => ipcRenderer.invoke('save-settings', settings),

  // Window controls
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window-close'),

  // Notifications
  showNotification: (title: string, body: string): Promise<void> =>
    ipcRenderer.invoke('show-notification', title, body),

  // AI
  testAIConnection: (baseUrl: string, apiKey: string): Promise<boolean> =>
    ipcRenderer.invoke('ai-test-connection', baseUrl, apiKey),
  generateTasks: (goal: Goal, settings: UserSettings, existingTasks: Task[]): Promise<Task[]> =>
    ipcRenderer.invoke('ai-generate-tasks', goal, settings, existingTasks)
});

