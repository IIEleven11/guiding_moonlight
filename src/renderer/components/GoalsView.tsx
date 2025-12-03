import React, { useState } from 'react';
import { Goal, Task, UserSettings } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface GoalsViewProps {
  goals: Goal[];
  tasks: Task[];
  settings: UserSettings;
  onGoalSave: (goal: Goal) => void;
  onGoalDelete: (goalId: string) => void;
  onTasksSave: (tasks: Task[]) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals, tasks, settings, onGoalSave, onGoalDelete, onTasksSave
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateProgress = (goalId: string): number => {
    const goalTasks = tasks.filter(t => t.goalId === goalId);
    if (goalTasks.length === 0) return 0;
    const completed = goalTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / goalTasks.length) * 100);
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setError('');
    setShowModal(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setTargetDate(goal.targetDate || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Please enter a goal title'); return; }
    setLoading(true);
    setError('');
    try {
      const goal: Goal = {
        id: editingGoal?.id || uuidv4(),
        title: title.trim(),
        description: description.trim(),
        createdAt: editingGoal?.createdAt || new Date().toISOString(),
        targetDate: targetDate || undefined,
        status: 'active',
        progress: editingGoal?.progress || 0
      };
      onGoalSave(goal);
      // Generate tasks for new goals if AI is configured (either API key or local model)
      if (!editingGoal && (settings.openaiApiKey || settings.openaiBaseUrl !== 'https://api.openai.com/v1')) {
        const newTasks = await window.electronAPI.generateTasks(goal, settings, tasks);
        onTasksSave(newTasks);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally { setLoading(false); }
  };

  const handleDelete = (goalId: string) => {
    if (confirm('Delete this goal and all its tasks?')) { onGoalDelete(goalId); }
  };

  const handleGenerateTasks = async (goal: Goal) => {
    const isLocalModel = settings.openaiBaseUrl !== 'https://api.openai.com/v1';
    if (!settings.openaiApiKey && !isLocalModel) {
      alert('Please add your API key in Settings, or configure a local model URL.');
      return;
    }
    setLoading(true);
    try {
      const newTasks = await window.electronAPI.generateTasks(goal, settings, tasks);
      onTasksSave(newTasks);
      alert(`Generated ${newTasks.length} new tasks!`);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to generate tasks'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Your Goals</h2>
        <button className="btn-primary" onClick={openNewGoalModal}>Add Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state"><h3>No goals yet</h3><p>Add your first goal to get started.</p></div>
      ) : (
        goals.map(goal => (
          <div key={goal.id} className="goal-item" onClick={() => openEditGoalModal(goal)}>
            <div className="goal-header">
              <span className="goal-title">{goal.title}</span>
              <span className={`goal-status ${goal.status}`}>{goal.status}</span>
            </div>
            <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>{goal.description || 'No description'}</p>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${calculateProgress(goal.id)}%` }} /></div>
            <div className="flex gap-4" style={{ marginTop: '12px' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>{calculateProgress(goal.id)}% complete</span>
              <span className="text-secondary" style={{ fontSize: '12px' }}>{tasks.filter(t => t.goalId === goal.id).length} tasks</span>
            </div>
            <div className="flex gap-2" style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
              <button className="btn-secondary" onClick={() => handleGenerateTasks(goal)} disabled={loading}>Generate More Tasks</button>
              <button className="btn-danger" onClick={() => handleDelete(goal.id)}>Delete</button>
            </div>
          </div>
        ))
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <label>What do you want to accomplish?</label>
            <input type="text" placeholder="e.g., Learn web development" value={title} onChange={e => setTitle(e.target.value)} />
            <label>Describe your goal (optional)</label>
            <textarea placeholder="Add more details about what you want to achieve..." value={description} onChange={e => setDescription(e.target.value)} />
            <label>Target date (optional)</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            {error && <p className="text-danger mb-4">{error}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : (editingGoal ? 'Save Changes' : 'Create Goal')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
