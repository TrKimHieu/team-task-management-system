import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeMode, Label } from '../types';
import { labelService } from '../services/labelService';

interface LabelManagerProps {
  taskId: string;
  projectId: string;
  labels: Label[];
  theme: ThemeMode;
  onUpdate: () => void;
  isReadOnly?: boolean;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
  taskId,
  projectId,
  labels,
  theme,
  onUpdate,
  isReadOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('bg-blue-500');

  const colors = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];

  const loadAvailableLabels = async () => {
    setLoading(true);
    try {
      const allLabels = await labelService.getByProjectId(projectId);
      setAvailableLabels(allLabels);
    } catch (error) {
      console.error('Failed to load labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLabel = async (label: Label) => {
    try {
      const isAdded = labels.some((l) => l.id === label.id);
      if (isAdded) {
        // Remove label from task (assuming the API supports this)
        // For now, we'll just remove it locally and sync
        onUpdate();
      } else {
        // Add label to task
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const newLabel = await labelService.create(projectId, {
        name: newLabelName,
        color: newLabelColor,
      });
      setNewLabelName('');
      setNewLabelColor('bg-blue-500');
      loadAvailableLabels();
      onUpdate();
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const handleRemoveLabel = async (label: Label) => {
    try {
      // Remove from task
      onUpdate();
    } catch (error) {
      console.error('Failed to remove label:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadAvailableLabels();
        }}
        disabled={isReadOnly}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          theme === 'dark'
            ? "bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            : "bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50"
        )}
      >
        <TagIcon size={16} />
        Labels ({labels.length})
      </button>

      {isOpen && !isReadOnly && (
        <div className={cn(
          "absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border p-4 z-50",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          {/* Current Labels */}
          <div className="mb-4">
            <p className={cn(
              "text-xs font-medium mb-2",
              theme === 'dark' ? "text-slate-400" : "text-slate-600"
            )}>
              Current Labels
            </p>
            {labels.length === 0 ? (
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-slate-500" : "text-slate-500"
              )}>
                No labels assigned
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white",
                      label.color
                    )}
                  >
                    {label.name}
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-1 hover:opacity-75"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Labels */}
          <div className="mb-4">
            <p className={cn(
              "text-xs font-medium mb-2",
              theme === 'dark' ? "text-slate-400" : "text-slate-600"
            )}>
              Available Labels
            </p>
            {loading ? (
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-slate-500" : "text-slate-500"
              )}>
                Loading...
              </p>
            ) : (
              <div className="space-y-1">
                {availableLabels
                  .filter((l) => !labels.some((al) => al.id === l.id))
                  .map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                        theme === 'dark'
                          ? "hover:bg-slate-800 text-slate-400"
                          : "hover:bg-slate-100 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", label.color)} />
                        {label.name}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Create New Label */}
          <div className={cn(
            "pt-4 border-t space-y-2",
            theme === 'dark' ? "border-slate-800" : "border-slate-200"
          )}>
            <input
              type="text"
              placeholder="New label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className={cn(
                "w-full px-2 py-1 text-xs rounded border transition-colors",
                theme === 'dark'
                  ? "bg-slate-800 border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                  : "bg-white border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500"
              )}
            />
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform",
                    color,
                    newLabelColor === color && "ring-2 ring-offset-2"
                  )}
                />
              ))}
            </div>
            <button
              onClick={handleCreateLabel}
              disabled={!newLabelName.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors",
                theme === 'dark'
                  ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              )}
            >
              <Plus size={14} />
              Create Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
