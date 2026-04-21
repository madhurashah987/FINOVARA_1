import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin
  let firebaseAdminApp: App;
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
      : null;

    if (getApps().length === 0) {
      if (serviceAccount) {
        firebaseAdminApp = initializeApp({
          credential: cert(serviceAccount)
        });
        console.log("Firebase Admin initialized with Service Account.");
      } else {
        // Fallback to default (works in some cloud environments)
        firebaseAdminApp = initializeApp();
        console.log("Firebase Admin initialized with default credentials.");
      }
    } else {
      firebaseAdminApp = getApps()[0];
    }
  } catch (error) {
    console.error("Firebase Admin initialization failed. Admin API routes may not work securely.", error);
  }

  const db = getFirestore();
  const auth = getAuth();

  // Admin Middleware
  const adminOnly = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Check if user is admin in Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      
      const superAdmins = ['madhura.shah@mitwpu.edu.in', 'demo@finovara.ai'];
      const isSuperAdmin = decodedToken.email && superAdmins.includes(decodedToken.email);
      const isAdminRole = userData?.role === 'admin';

      if (isSuperAdmin || isAdminRole) {
        (req as any).user = decodedToken;
        next();
      } else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    } catch (error) {
      console.error('Auth Verification Error:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  // --- API ROUTES ---

  // User Management APIs
  app.get("/api/admin/users", adminOnly, async (req, res) => {
    try {
      const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
      const users = usersSnapshot.docs.map(doc => doc.data());
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post("/api/admin/users/:uid/role", adminOnly, async (req, res) => {
    const { uid } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      await db.collection('users').doc(uid).update({ role });
      // Log the action
      await db.collection('system_logs').add({
        timestamp: new Date(),
        action: 'ROLE_CHANGE',
        details: `Role for ${uid} changed to ${role}`,
        adminEmail: (req as any).user.email
      });
      res.json({ success: true, role });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  app.delete("/api/admin/users/:uid", adminOnly, async (req, res) => {
    const { uid } = req.params;
    try {
      // Delete from Auth if possible (Admin SDK allows this)
      await auth.deleteUser(uid);
      // Delete from Firestore
      await db.collection('users').doc(uid).delete();
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete User Error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.get("/api/admin/logs", adminOnly, async (req, res) => {
    try {
      const logsSnapshot = await db.collection('system_logs').orderBy('timestamp', 'desc').limit(100).get();
      const logs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore timestamp to JS Date for JSON
        if (data.timestamp) data.timestamp = data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
        return data;
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
