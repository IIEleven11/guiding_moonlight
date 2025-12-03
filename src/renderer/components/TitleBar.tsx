import React from 'react';

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      getGoals: () => Promise<any[]>;
      saveGoal: (goal: any) => Promise<any[]>;
      deleteGoal: (goalId: string) => Promise<any[]>;
      getTasks: () => Promise<any[]>;
      saveTasks: (tasks: any[]) => Promise<any[]>;
      updateTask: (task: any) => Promise<any[]>;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<any>;
      showNotification: (title: string, body: string) => Promise<void>;
      testAIConnection: (baseUrl: string, apiKey: string) => Promise<boolean>;
      generateTasks: (goal: any, settings: any, existingTasks: any[]) => Promise<any[]>;
    };
  }
}

export const TitleBar: React.FC = () => {
  return (
    <div className="title-bar">
      <h1>Guiding Moonlight</h1>
      <div className="window-controls">
        <button onClick={() => window.electronAPI.minimizeWindow()} title="Minimize">
          ─
        </button>
        <button onClick={() => window.electronAPI.maximizeWindow()} title="Maximize">
          □
        </button>
        <button className="close" onClick={() => window.electronAPI.closeWindow()} title="Close">
          ✕
        </button>
      </div>
    </div>
  );
};

