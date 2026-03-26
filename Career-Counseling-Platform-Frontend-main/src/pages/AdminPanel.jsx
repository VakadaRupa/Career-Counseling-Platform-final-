import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/ui/BaseComponents';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Briefcase, MessageSquare, Shield, Trash2, Edit2, Check, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Check if admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }


  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] transition-colors duration-300">

      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] transition-colors">Admin Control Panel</h1>
              <p className="text-[var(--text-secondary)] transition-colors">Manage platform users, content, and system settings.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-64 shrink-0">
            <Card className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors">
              <TabButton 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')}
                icon={<Users size={18} />}
                label="User Management"
              />
              <TabButton 
                active={activeTab === 'resources'} 
                onClick={() => setActiveTab('resources')}
                icon={<BookOpen size={18} />}
                label="Resources"
              />
              <TabButton 
                active={activeTab === 'jobs'} 
                onClick={() => setActiveTab('jobs')}
                icon={<Briefcase size={18} />}
                label="Job Listings"
              />
              <TabButton 
                active={activeTab === 'forum'} 
                onClick={() => setActiveTab('forum')}
                icon={<MessageSquare size={18} />}
                label="Forum Moderation"
              />
            </Card>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'resources' && <ContentManagement type="Resources" />}
            {activeTab === 'jobs' && <ContentManagement type="Jobs" />}
            {activeTab === 'forum' && <ContentManagement type="Forum" />}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        active 
          ? 'bg-brand-500/10 text-brand-500' 
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([
    { id: '1', name: 'John Admin', email: 'admin@example.com', role: 'admin', joined: '2024-01-15' },
    { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'user', joined: '2024-02-10' },
    { id: '3', name: 'Bob Smith', email: 'bob@example.com', role: 'user', joined: '2024-03-01' },
  ]);

  const toggleRole = (id) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
    ));
  };

  const deleteUser = (id) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <Card className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors">
      <div className="border-b border-[var(--border-subtle)] px-6 py-4">
        <h2 className="font-semibold text-[var(--text-primary)] transition-colors">Platform Users</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-secondary)] text-xs font-semibold uppercase text-[var(--text-secondary)]/60 transition-colors">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] transition-colors">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-[var(--text-primary)] transition-colors">{u.name}</div>
                  <div className="text-[var(--text-secondary)] transition-colors">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)] transition-colors">{u.joined}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleRole(u.id)} title="Toggle Role">
                      <Shield size={16} className={u.role === 'admin' ? 'text-amber-600' : 'text-gray-400'} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id)} className="text-red-500">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ContentManagement({ type }) {
  return (
    <Card className="p-12 text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 transition-colors">
        {type === 'Resources' && <BookOpen size={32} />}
        {type === 'Jobs' && <Briefcase size={32} />}
        {type === 'Forum' && <MessageSquare size={32} />}
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] transition-colors">{type} Management</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--text-secondary)] transition-colors">
        You can manage {type.toLowerCase()} directly on their respective pages using the admin edit/delete controls.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={() => window.location.href = `/${type.toLowerCase() === 'forum' ? 'forum' : type.toLowerCase()}`}>
          Go to {type} Page
        </Button>
      </div>
    </Card>
  );
}
