// Shared types for the application

export interface Goal {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

export interface DailySchedule {
  date: string;
  tasks: Task[];
}

export interface UserSettings {
  openaiApiKey: string;
  openaiBaseUrl: string; // For local model support
  modelName: string;
  notificationsEnabled: boolean;
  notificationTime: string; // HH:mm format
  dailyTaskCount: number;
  theme: 'dark';
}

export interface AppState {
  goals: Goal[];
  tasks: Task[];
  settings: UserSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-4o-mini',
  notificationsEnabled: true,
  notificationTime: '09:00',
  dailyTaskCount: 3,
  theme: 'dark'
};

