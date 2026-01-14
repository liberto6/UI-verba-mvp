export type TaskStatus = 'pending' | 'completed';
export type TaskLevel = 'A2' | 'B1' | 'B2' | 'C1';

export interface Task {
  id: string;
  topic: string;
  description: string;
  level: TaskLevel;
  status: TaskStatus;
}

// NOTE: In a production environment:
// 1. This data would be fetched from a backend API (e.g., GET /api/student/tasks).
// 2. Teachers would have a separate interface to create and assign these tasks to specific students or groups.
// 3. Status updates (pending -> completed) would be persisted to the database.

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    topic: 'Talking about hobbies',
    description: 'Have a 10-15 minute conversation about your free time activities and interests.',
    level: 'B1',
    status: 'pending'
  },
  {
    id: 't2',
    topic: 'Ordering food in a restaurant',
    description: 'Practice ordering a full meal including appetizers, main course, and dessert.',
    level: 'A2',
    status: 'pending'
  },
  {
    id: 't3',
    topic: 'Discussing travel plans',
    description: 'Talk about your upcoming vacation or a past trip you enjoyed.',
    level: 'B1',
    status: 'completed'
  },
  {
    id: 't4',
    topic: 'Job interview practice',
    description: 'Simulate a job interview for a role you are interested in.',
    level: 'B2',
    status: 'pending'
  },
  {
    id: 't5',
    topic: 'Describing a picture',
    description: 'Describe a complex image with details about people, setting, and actions.',
    level: 'A2',
    status: 'completed'
  }
];
