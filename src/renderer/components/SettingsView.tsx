import React, { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '../../shared/types';

interface SettingsViewProps {
  settings: UserSettings;
  onSettingsSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof UserSettings, value: string | boolean | number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = () => {
    onSettingsSave(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const success = await window.electronAPI.testAIConnection(
      localSettings.openaiBaseUrl,
      localSettings.openaiApiKey
    );
    setTestResult(success ? 'success' : 'error');
    setTesting(false);

    // Auto-save settings if connection test succeeds
    if (success) {
      onSettingsSave(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setLocalSettings(DEFAULT_SETTINGS);
      onSettingsSave(DEFAULT_SETTINGS);
    }
  };

  return (
    <div>
      <h2 className="section-title">Settings</h2>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>AI Configuration</h3>

        <label>API Base URL</label>
        <input
          type="text"
          placeholder="https://api.openai.com/v1"
          value={localSettings.openaiBaseUrl}
          onChange={e => handleChange('openaiBaseUrl', e.target.value)}
        />
        <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-8px', marginBottom: '12px' }}>
          For local models: use your LM Studio/Ollama URL (e.g., http://localhost:1234/v1)
        </p>

        <label>API Key (optional for local models)</label>
        <input
          type="password"
          placeholder="sk-... (leave empty for local models)"
          value={localSettings.openaiApiKey}
          onChange={e => handleChange('openaiApiKey', e.target.value)}
        />
        
        <label>Model Name</label>
        <input
          type="text"
          placeholder="gpt-4o-mini"
          value={localSettings.modelName}
          onChange={e => handleChange('modelName', e.target.value)}
        />
        
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleTestConnection} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult === 'success' && <span className="text-success">Connection successful!</span>}
          {testResult === 'error' && <span className="text-danger">Connection failed</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Notifications</h3>
        
        <label className="flex gap-2" style={{ alignItems: 'center', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={localSettings.notificationsEnabled}
            onChange={e => handleChange('notificationsEnabled', e.target.checked)}
            style={{ width: 'auto', marginBottom: 0 }}
          />
          <span>Enable daily task reminders</span>
        </label>
        
        <label>Reminder Time</label>
        <input
          type="time"
          value={localSettings.notificationTime}
          onChange={e => handleChange('notificationTime', e.target.value)}
          disabled={!localSettings.notificationsEnabled}
        />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Task Generation</h3>
        
        <label>Daily Tasks per Goal</label>
        <select
          value={localSettings.dailyTaskCount}
          onChange={e => handleChange('dailyTaskCount', parseInt(e.target.value))}
        >
          <option value="1">1 task per day</option>
          <option value="2">2 tasks per day</option>
          <option value="3">3 tasks per day</option>
          <option value="5">5 tasks per day</option>
        </select>
      </div>

      <div className="flex gap-2" style={{ marginTop: '20px' }}>
        <button className="btn-primary" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button className="btn-secondary" onClick={handleReset}>
          Reset to Default
        </button>
      </div>
    </div>
  );
};

