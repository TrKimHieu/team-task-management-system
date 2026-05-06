import React, { useEffect, useState } from 'react';
import { Tag, Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Label } from '../../types';
import { labelService } from '../../services/labelService';

interface LabelSectionProps {
  taskId: string;
  projectId: string;
  theme: 'light' | 'dark';
  onUpdate: () => void;
}

export const LabelSection: React.FC<LabelSectionProps> = ({ taskId, projectId, theme, onUpdate }) => {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('bg-slate-500');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const COLORS = ['bg-slate-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500'];

  useEffect(() => {
    loadLabels();
  }, [projectId, taskId]);

  const loadLabels = async () => {
    try {
      const [available, taskLbls] = await Promise.all([
        labelService.getByProjectId(projectId),
        labelService.getTaskLabels(taskId)
      ]);
      setAvailableLabels(available);
      setTaskLabels(taskLbls);
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      await labelService.create(projectId, { name: newLabelName, color: newLabelColor });
      setNewLabelName('');
      setShowAddForm(false);
      loadLabels();
    } catch (error) {
      console.error('Failed to add label:', error);
    }
  };

  const handleAssignLabel = async (labelId: string) => {
    try {
      await labelService.assignToTask(taskId, labelId);
      loadLabels();
      onUpdate();
    } catch (error) {
      console.error('Failed to assign label:', error);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await labelService.removeFromTask(taskId, labelId);
      loadLabels();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove label:', error);
    }
  };

  const handleUpdateLabel = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await labelService.update(id, { name: editName, color: editColor });
      setEditingId(null);
      loadLabels();
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleDeleteLabel = async (id: string) => {
    if (!window.confirm('Delete this label?')) return;
    try {
      await labelService.delete(id);
      loadLabels();
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Tag size={16} />
          <span>Labels</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn('p-1 rounded transition-colors', theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}
        >
          <Plus size={14} />
        </button>
      </div>

      {showAddForm && (
        <div className="space-y-2 p-2 rounded-xl border" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
          <input
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label name..."
            className={cn('w-full px-2 py-1 rounded text-sm outline-none', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50')}
          />
          <div className="flex gap-1 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewLabelColor(color)}
                className={`w-6 h-6 rounded-full ${color} ${newLabelColor === color ? 'ring-2 ring-offset-2' : ''}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddLabel} className="px-3 py-1 rounded bg-blue-600 text-white text-xs">Add</button>
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1 rounded text-xs" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {taskLabels.map((label) => (
          <span key={label.id} className={`px-2 py-0.5 rounded text-xs text-white ${label.color} flex items-center gap-1`}>
            {label.name}
            <button onClick={() => handleRemoveLabel(label.id)} className="hover:text-slate-200">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {availableLabels.filter(l => !taskLabels.find(tl => tl.id === l.id)).map((label) => (
          <div key={label.id} className={cn('flex items-center justify-between p-1 rounded text-sm', theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}>
            {editingId === label.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-xs"
                  autoFocus
                />
                <button onClick={() => handleUpdateLabel(label.id)} className="text-blue-500"><Check size={12} /></button>
                <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={12} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => handleAssignLabel(label.id)} className="flex items-center gap-2 flex-1">
                  <span className={`w-3 h-3 rounded-full ${label.color}`} />
                  <span>{label.name}</span>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(label.id); setEditName(label.name); setEditColor(label.color); }} className="p-0.5 hover:text-blue-500">
                    <Edit2 size={10} />
                  </button>
                  <button onClick={() => handleDeleteLabel(label.id)} className="p-0.5 hover:text-rose-500">
                    <Trash2 size={10} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
