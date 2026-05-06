# Integration Instructions

## Integrating NotificationCenter into TeamTaskApp

### Step 1: Import in TeamTaskApp.tsx

```typescript
import { NotificationCenter } from './components/NotificationCenter';
```

### Step 2: Add State for Notification Panel

```typescript
// In TeamTaskApp.tsx, add:
const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
```

### Step 3: Update NotificationBell Component

In the header/top-bar where NotificationBell is used, update to:

```typescript
<button
  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
  className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
>
  <Bell size={20} />
  {/* Add unread count badge if needed */}
</button>

{/* Place the NotificationCenter below */}
<NotificationCenter 
  theme={theme}
  isOpen={notificationsPanelOpen}
  onClose={() => setNotificationsPanelOpen(false)}
/>
```

### Step 4: Poll for Notifications

Add this useEffect in TeamTaskApp to periodically fetch notifications:

```typescript
useEffect(() => {
  if (!authUser) return;
  
  // Poll for notifications every 30 seconds
  const interval = setInterval(async () => {
    try {
      const notifications = await notificationService.getAll();
      // Update notification state if needed
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [authUser]);
```

### Step 5: Create notificationService

Create `src/services/notificationService.ts`:

```typescript
import { api } from './api';
import { Notification } from '../types';

export const notificationService = {
  async getAll() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async delete(notificationId: string) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  async deleteAll() {
    const response = await api.delete('/notifications');
    return response.data;
  }
};
```

---

## Testing Drag & Drop

### Manual Testing Checklist

```
[ ] Drag task within same column
[ ] Drag task between columns
[ ] Drag task to empty column
[ ] Verify visual feedback during drag
[ ] Verify task order persists on refresh
[ ] Test on mobile/tablet
[ ] Test with multiple tasks
[ ] Verify error handling (network error during drag)
```

### Expected Behavior

1. **Visual Feedback:**
   - Dragged card scales up slightly
   - Blue ring around dragged card
   - Destination column highlights blue
   - Placeholder shows in destination

2. **State Management:**
   - Optimistic update (immediate visual change)
   - API call in background
   - Rollback on error

3. **Performance:**
   - Smooth 60fps animations
   - No janky movements
   - Memory efficient

---

## Database Migrations Needed

If implementing advanced features, create these migrations:

### Subtasks Table
```sql
CREATE TABLE subtasks (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### Task Dependencies
```sql
ALTER TABLE tasks ADD COLUMN depends_on VARCHAR(36);
ALTER TABLE tasks ADD FOREIGN KEY (depends_on) REFERENCES tasks(id) ON DELETE SET NULL;
```

### Time Tracking
```sql
ALTER TABLE tasks ADD COLUMN time_spent INT DEFAULT 0; -- in minutes
ALTER TABLE tasks ADD COLUMN time_estimate INT; -- in minutes
```

### Audit Logs
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(36) NOT NULL,
  changes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## API Endpoints to Implement

### Notifications
```
GET    /api/notifications              - Get all notifications
PATCH  /api/notifications/:id/read     - Mark as read
PATCH  /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
DELETE /api/notifications              - Delete all
```

### Subtasks
```
GET    /api/tasks/:taskId/subtasks     - Get all subtasks
POST   /api/tasks/:taskId/subtasks     - Create subtask
PUT    /api/subtasks/:id               - Update subtask
DELETE /api/subtasks/:id               - Delete subtask
PATCH  /api/subtasks/:id/reorder       - Reorder subtasks
```

### Time Tracking
```
POST   /api/tasks/:taskId/time-entries - Create time entry
GET    /api/tasks/:taskId/time-entries - Get time entries
DELETE /api/time-entries/:id           - Delete time entry
GET    /api/reports/time               - Get time report
```

---

## Component Integration Points

### In KanbanBoard/TaskCard
```typescript
// Add these props to TaskCard
onToggleSubtask?: (taskId: string, subtaskId: string) => void;
onAddSubtask?: (taskId: string) => void;

// Add these props to KanbanBoard
onToggleNotifications?: () => void;
unreadNotificationCount?: number;
```

### In TaskModal/TaskDetail
```typescript
// Show tabs:
// - Details (title, description, priority, etc.)
// - Subtasks
// - Attachments
// - Comments
// - Activity Log
// - Time Tracking
// - Related Tasks (dependencies)
```

---

## Performance Optimization Tips

1. **Memoization:**
   ```typescript
   const tasksByColumn = useMemo(() => {
     // Calculate filtered tasks
   }, [tasks, filter]);
   ```

2. **Code Splitting:**
   ```typescript
   const CalendarView = lazy(() => import('./views/CalendarView'));
   ```

3. **Virtual Scrolling:**
   Use `react-window` for long task lists

4. **Debouncing:**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce((value: string) => setSearch(value), 300),
     []
   );
   ```

---

**Last Updated:** May 5, 2026
**Version:** 1.0.0
