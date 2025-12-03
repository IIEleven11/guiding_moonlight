import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, View } from './components/Sidebar';
import { TodayView } from './components/TodayView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { Goal, Task, UserSettings, DEFAULT_SETTINGS } from '../shared/types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('today');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedGoals, loadedTasks, loadedSettings] = await Promise.all([
        window.electronAPI.getGoals(),
        window.electronAPI.getTasks(),
        window.electronAPI.getSettings()
      ]);
      setGoals(loadedGoals);
      setTasks(loadedTasks);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSave = async (goal: Goal) => {
    const updatedGoals = await window.electronAPI.saveGoal(goal);
    setGoals(updatedGoals);
  };

  const handleGoalDelete = async (goalId: string) => {
    const updatedGoals = await window.electronAPI.deleteGoal(goalId);
    setGoals(updatedGoals);
    setTasks(tasks.filter(t => t.goalId !== goalId));
  };

  const handleTasksSave = async (newTasks: Task[]) => {
    const updatedTasks = await window.electronAPI.saveTasks(newTasks);
    setTasks(updatedTasks);
  };

  const handleTaskComplete = async (task: Task) => {
    const updatedTask: Task = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    const updatedTasks = await window.electronAPI.updateTask(updatedTask);
    setTasks(updatedTasks);
    
    // Update goal progress
    const goalTasks = updatedTasks.filter(t => t.goalId === task.goalId);
    const completedCount = goalTasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedCount / goalTasks.length) * 100);
    
    const goal = goals.find(g => g.id === task.goalId);
    if (goal && goal.progress !== progress) {
      const updatedGoal = { ...goal, progress };
      await window.electronAPI.saveGoal(updatedGoal);
      setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g));
    }

    // Show encouraging notification
    window.electronAPI.showNotification(
      'Task Completed!',
      `Great job completing "${task.title}"!`
    );
  };

  const handleSettingsSave = async (newSettings: UserSettings) => {
    await window.electronAPI.saveSettings(newSettings);
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <>
        <TitleBar />
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar />
      <div className="app-container">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        <div className="main-content">
          {currentView === 'today' && (
            <TodayView
              tasks={tasks}
              goals={goals}
              onTaskComplete={handleTaskComplete}
            />
          )}
          {currentView === 'goals' && (
            <GoalsView
              goals={goals}
              tasks={tasks}
              settings={settings}
              onGoalSave={handleGoalSave}
              onGoalDelete={handleGoalDelete}
              onTasksSave={handleTasksSave}
            />
          )}
          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsSave={handleSettingsSave}
            />
          )}
        </div>
      </div>
    </>
  );
};

