import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/sqlite';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes (we'll create these next)
// import authRoutes from './routes/auth';
// import agentRoutes from './routes/agents';
// import chatRoutes from './routes/chat';
// import settingsRoutes from './routes/settings';

// app.use('/api/auth', authRoutes);
// app.use('/api/agents', agentRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
