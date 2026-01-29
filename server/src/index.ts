import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/index.js'; 
import { users } from './db/schema.js'; 
import { auth } from './db/auth.js';
import { toNodeHandler } from 'better-auth/node';
import apiRouter from './routes/index.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// 1. Health Check (Top Level)
app.get('/health', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json({ 
      status: 'active', 
      dbConnection: 'connected', 
      userCount: allUsers.length 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

// 2. Auth Handler
app.all("/api/auth/*", toNodeHandler(auth));

// 3. API Routes
app.use("/api", apiRouter);

// 4. Root
app.get('/', (req, res) => res.send('GradEval360 API Online.'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));