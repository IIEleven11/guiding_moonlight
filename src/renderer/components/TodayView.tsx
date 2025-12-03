import React from 'react';
import { Task, Goal } from '../../shared/types';

interface TodayViewProps {
  tasks: Task[];
  goals: Goal[];
  onTaskComplete: (task: Task) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ tasks, goals, onTaskComplete }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.scheduledDate === today);
  const pendingTasks = todayTasks.filter(t => t.status === 'pending');
  const completedTasks = todayTasks.filter(t => t.status === 'completed');
  
  const getGoalTitle = (goalId: string): string => {
    const goal = goals.find(g => g.id === goalId);
    return goal?.title || 'Unknown Goal';
  };

  const formatDate = (): string => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <h2 className="section-title">{formatDate()}</h2>
      
      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks for today</h3>
          <p>Add a goal to get started with your daily tasks.</p>
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className="card">
              <h3 className="mb-4" style={{ color: '#e0e0e0' }}>To Do ({pendingTasks.length})</h3>
              {pendingTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div
                    className="task-checkbox"
                    onClick={() => onTaskComplete(task)}
                  />
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-description">{task.description}</div>
                    <div className="task-meta">
                      <span>Goal: {getGoalTitle(task.goalId)}</span>
                      <span className={`difficulty-${task.difficulty}`}>
                        {task.difficulty}
                      </span>
                      <span>{task.estimatedMinutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="card">
              <h3 className="mb-4" style={{ color: '#4caf50' }}>Completed ({completedTasks.length})</h3>
              {completedTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-checkbox completed">✓</div>
                  <div className="task-content">
                    <div className="task-title completed">{task.title}</div>
                    <div className="task-meta">
                      <span>Goal: {getGoalTitle(task.goalId)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

