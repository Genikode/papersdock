export type Status = 'pending' | 'answered' | 'resolved';
export type Category = 'Computer Science' | 'Mathematics' | 'Database';

export type Message = {
  id: string;
  author: 'student' | 'instructor';
  name: string;
  text: string;
  createdAt: string; // ISO
};

export type Query = {
  id: string;
  title: string;
  student: string;
  category: Category;
  paper?: string;
  chapter?: string;
  askedAt: string; // ISO
  status: Status;
  messages: Message[];
};
