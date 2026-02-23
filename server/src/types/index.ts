export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  title: string;
  avatar: string;
  status: 'idle' | 'thinking' | 'busy';
  knowledgeTopics: string;
  createdAt: string;
}

export interface Message {
  id: number;
  agentId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ApiKeys {
  userId: string;
  openai_key?: string;
  anthropic_key?: string;
  google_key?: string;
  groq_key?: string;
  encrypted: boolean;
}
