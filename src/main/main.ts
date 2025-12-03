import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, net } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { Goal, Task, UserSettings, DEFAULT_SETTINGS, AppState } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize store
const store = new Store<AppState>({
  defaults: {
    goals: [],
    tasks: [],
    settings: DEFAULT_SETTINGS
  }
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let notificationInterval: NodeJS.Timeout | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Guiding Moonlight', click: () => mainWindow?.show() },
    { label: 'Check Today\'s Tasks', click: () => showDailyNotification() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Guiding Moonlight');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

function showDailyNotification(): void {
  const tasks = store.get('tasks') as Task[];
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.scheduledDate === today && t.status === 'pending');
  
  if (todayTasks.length > 0) {
    const notification = new Notification({
      title: 'Guiding Moonlight',
      body: `You have ${todayTasks.length} task(s) today: ${todayTasks[0].title}`,
      urgency: 'normal'
    });
    notification.on('click', () => mainWindow?.show());
    notification.show();
  }
}

function setupNotificationScheduler(): void {
  if (notificationInterval) clearInterval(notificationInterval);
  
  // Check every minute if it's time for notification
  notificationInterval = setInterval(() => {
    const settings = store.get('settings') as UserSettings;
    if (!settings.notificationsEnabled) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime === settings.notificationTime) {
      showDailyNotification();
    }
  }, 60000);
}

// IPC Handlers
ipcMain.handle('get-goals', () => store.get('goals'));
ipcMain.handle('get-tasks', () => store.get('tasks'));
ipcMain.handle('get-settings', () => store.get('settings'));

ipcMain.handle('save-goal', (_event, goal: Goal) => {
  const goals = store.get('goals') as Goal[];
  const index = goals.findIndex(g => g.id === goal.id);
  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  store.set('goals', goals);
  return goals;
});

ipcMain.handle('delete-goal', (_event, goalId: string) => {
  const goals = store.get('goals') as Goal[];
  const tasks = store.get('tasks') as Task[];
  store.set('goals', goals.filter(g => g.id !== goalId));
  store.set('tasks', tasks.filter(t => t.goalId !== goalId));
  return store.get('goals');
});

ipcMain.handle('save-tasks', (_event, newTasks: Task[]) => {
  const tasks = store.get('tasks') as Task[];
  newTasks.forEach(newTask => {
    const index = tasks.findIndex(t => t.id === newTask.id);
    if (index >= 0) {
      tasks[index] = newTask;
    } else {
      tasks.push(newTask);
    }
  });
  store.set('tasks', tasks);
  return tasks;
});

ipcMain.handle('update-task', (_event, task: Task) => {
  const tasks = store.get('tasks') as Task[];
  const index = tasks.findIndex(t => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
    store.set('tasks', tasks);
  }
  return tasks;
});

ipcMain.handle('save-settings', (_event, settings: UserSettings) => {
  store.set('settings', settings);
  setupNotificationScheduler();
  return settings;
});

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow?.hide());

ipcMain.handle('show-notification', (_event, title: string, body: string) => {
  const notification = new Notification({ title, body });
  notification.show();
});

// AI API handlers - these run in main process to avoid CORS issues
ipcMain.handle('ai-test-connection', async (_event, baseUrl: string, apiKey: string): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/models`, { headers });
    return response.ok;
  } catch (error) {
    console.error('AI connection test failed:', error);
    return false;
  }
});

ipcMain.handle('ai-generate-tasks', async (_event, goal: Goal, settings: UserSettings, existingTasks: Task[]): Promise<Task[]> => {
  const completedCount = existingTasks.filter(t => t.goalId === goal.id && t.status === 'completed').length;

  const prompt = `You are a productivity assistant. The user has a goal they want to achieve.

Goal: "${goal.title}"
Description: "${goal.description}"
${goal.targetDate ? `Target completion date: ${goal.targetDate}` : 'No specific deadline'}
Tasks already completed for this goal: ${completedCount}

Generate ${settings.dailyTaskCount * 7} specific, actionable daily tasks that will help achieve this goal over the next week or so. Each task should:
1. Be completable in one day
2. Be specific and actionable (not vague)
3. Build progressively towards the goal
4. Account for progress already made (${completedCount} tasks completed)

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "tasks": [
    {
      "title": "Task title here",
      "description": "Detailed description of what to do",
      "difficulty": "easy",
      "estimatedMinutes": 30,
      "daysFromNow": 0
    }
  ]
}

Where difficulty is one of: "easy", "medium", or "hard"
And daysFromNow is 0 for today, 1 for tomorrow, etc.`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (settings.openaiApiKey) {
    headers['Authorization'] = `Bearer ${settings.openaiApiKey}`;
  }

  const isLocal = settings.openaiBaseUrl.includes('localhost') ||
                  settings.openaiBaseUrl.includes('127.0.0.1') ||
                  settings.openaiBaseUrl.includes('172.') ||
                  settings.openaiBaseUrl.includes('192.168.') ||
                  settings.openaiBaseUrl.includes('10.');

  const requestBody: Record<string, unknown> = {
    model: settings.modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  };

  if (!isLocal) {
    requestBody.response_format = { type: 'json_object' };
  }

  console.log('Making AI request to:', `${settings.openaiBaseUrl}/chat/completions`);
  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${settings.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI request failed:', error);
    throw new Error(`AI request failed: ${error}`);
  }

  const data = await response.json();
  console.log('AI response:', JSON.stringify(data, null, 2));

  // Handle different response formats from various LLM APIs
  let content: string | undefined;

  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    // OpenAI-compatible format
    content = data.choices[0]?.message?.content;
  } else if (data.response) {
    // Some local models return { response: "..." }
    content = data.response;
  } else if (data.content) {
    // Some return { content: "..." }
    content = data.content;
  } else if (data.message?.content) {
    // Some return { message: { content: "..." } }
    content = data.message.content;
  } else if (typeof data === 'string') {
    content = data;
  }

  if (!content) {
    console.error('Could not extract content from response:', data);
    throw new Error(`No content in AI response. Response structure: ${JSON.stringify(Object.keys(data))}`);
  }

  console.log('Extracted content:', content.substring(0, 500));

  // Try to extract JSON from the response
  let jsonContent = content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }

  interface AITaskResponse {
    tasks: {
      title: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedMinutes: number;
      daysFromNow: number;
    }[];
  }

  const parsed: AITaskResponse = JSON.parse(jsonContent);

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('AI response missing tasks array');
  }

  const today = new Date();

  return parsed.tasks.map(task => {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + (task.daysFromNow || 0));

    return {
      id: uuidv4(),
      goalId: goal.id,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      status: 'pending' as const,
      difficulty: task.difficulty || 'medium',
      estimatedMinutes: task.estimatedMinutes || 30
    };
  });
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupNotificationScheduler();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

