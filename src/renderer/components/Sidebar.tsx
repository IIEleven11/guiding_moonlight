import React from 'react';

export type View = 'today' | 'goals' | 'settings';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <div className="sidebar">
      <div
        className={`nav-item ${currentView === 'today' ? 'active' : ''}`}
        onClick={() => onNavigate('today')}
      >
        Today's Tasks
      </div>
      <div
        className={`nav-item ${currentView === 'goals' ? 'active' : ''}`}
        onClick={() => onNavigate('goals')}
      >
        Goals
      </div>
      <div
        className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        Settings
      </div>
    </div>
  );
};

