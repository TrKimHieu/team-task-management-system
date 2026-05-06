import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2, Edit2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Comment, AuthUser } from '../../types';
import { commentService } from '../../services/commentService';

interface CommentSectionProps {
  taskId: string;
  theme: 'light' | 'dark';
  authUser?: AuthUser;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId, theme, authUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await commentService.getByTaskId(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentService.create(taskId, newComment);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleUpdateComment = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await commentService.update(id, editContent);
      setEditingId(null);
      setEditContent('');
      loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentService.delete(id);
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare size={16} />
        <span>Comments ({comments.length})</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className={cn('p-3 rounded-xl text-sm', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50')}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs text-white', comment.user_color || 'bg-slate-500')}>
                  {comment.avatar || comment.user_name?.charAt(0)}
                </div>
                <span className="font-medium">{comment.user_name}</span>
                <span className="text-xs text-slate-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              {comment.user_id === authUser?.id && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="p-1 hover:text-blue-500">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:text-rose-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
            {editingId === comment.id ? (
              <div className="flex gap-2">
                <input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 px-2 py-1 rounded border text-xs"
                  autoFocus
                />
                <button onClick={() => handleUpdateComment(comment.id)} className="text-blue-500 text-xs">Save</button>
                <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs">Cancel</button>
              </div>
            ) : (
              <p className={cn('text-sm', theme === 'dark' ? 'text-slate-300' : 'text-slate-600')}>{comment.content}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className={cn('flex-1 px-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-500', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
        />
        <button onClick={handleAddComment} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
