import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/index.js'; 
import { users } from './db/schema.js'; 
import { auth } from './db/auth.js';
import { toNodeHandler } from 'better-auth/node';
import apiRouter from './routes/index.js';
//import express, { Request, Response, NextFunction } from 'express';


const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use(express.json());

// 1. Auth Handler
app.all("/api/auth/*", toNodeHandler(auth));
//app.all("/api/auth/{*any}", toNodeHandler(auth));

//app.use(express.json());


// 2. Health Check (Top Level)
app.get('/api/health', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);

    //check if user authenticated
    const session = await auth.api.getSession({
      headers: req.headers as any
    });
    res.json({ 
      status: 'active', 
      dbConnection: 'connected', 
      userCount: allUsers.length, 
      authenticated: !!session, //
      user: session ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      } : null
    });
  } catch (error) {
    console.error('Health check error: ', error);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

// 3. API Routes
app.use("/api", apiRouter);

// 4. Root
app.get('/', (req, res) => res.send('GradEval360 API Online.'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server runing on http://localhost:' + PORT);
  console.log('Test Okta: http://localhost:' + PORT + '/api/auth/signin/okta');
  console.log('Test health: http://localhost:' + PORT + '/api/health');
});

