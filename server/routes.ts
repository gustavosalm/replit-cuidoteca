import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertParentSchema, insertInstitutionSchema, insertChildSchema, insertScheduleSchema, insertPostSchema, insertNotificationSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { role } = req.body;
      
      // Validate based on role type
      let userData;
      if (role === 'institution') {
        userData = insertInstitutionSchema.parse(req.body);
      } else {
        userData = insertParentSchema.parse(req.body);
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Login failed' });
    }
  });

  // User routes
  app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserWithChildren(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.put('/api/users/me', authenticateToken, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.user.id, updates);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Children routes
  app.get('/api/children', authenticateToken, async (req, res) => {
    try {
      const children = await storage.getChildrenByParent(req.user.id);
      res.json(children);
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({ message: 'Failed to get children' });
    }
  });

  app.post('/api/children', authenticateToken, async (req, res) => {
    try {
      const childData = insertChildSchema.parse({
        ...req.body,
        parentId: req.user.id,
      });
      
      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (error) {
      console.error('Create child error:', error);
      res.status(400).json({ message: 'Failed to create child' });
    }
  });

  app.put('/api/children/:id', authenticateToken, async (req, res) => {
    try {
      const childId = parseInt(req.params.id);
      const updates = req.body;
      
      // Verify child belongs to user
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(404).json({ message: 'Child not found' });
      }
      
      const updatedChild = await storage.updateChild(childId, updates);
      res.json(updatedChild);
    } catch (error) {
      console.error('Update child error:', error);
      res.status(500).json({ message: 'Failed to update child' });
    }
  });

  app.delete('/api/children/:id', authenticateToken, async (req, res) => {
    try {
      const childId = parseInt(req.params.id);
      
      // Verify child belongs to user
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(404).json({ message: 'Child not found' });
      }
      
      await storage.deleteChild(childId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete child error:', error);
      res.status(500).json({ message: 'Failed to delete child' });
    }
  });

  // Schedule routes
  app.get('/api/schedules', authenticateToken, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByParent(req.user.id);
      res.json(schedules);
    } catch (error) {
      console.error('Get schedules error:', error);
      res.status(500).json({ message: 'Failed to get schedules' });
    }
  });

  app.post('/api/schedules', authenticateToken, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      
      // Verify child belongs to user
      const child = await storage.getChild(scheduleData.childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(404).json({ message: 'Child not found' });
      }
      
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Create schedule error:', error);
      res.status(400).json({ message: 'Failed to create schedule' });
    }
  });

  app.put('/api/schedules/:id', authenticateToken, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const updates = req.body;
      
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      // Verify child belongs to user
      const child = await storage.getChild(schedule.childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      const updatedSchedule = await storage.updateSchedule(scheduleId, updates);
      res.json(updatedSchedule);
    } catch (error) {
      console.error('Update schedule error:', error);
      res.status(500).json({ message: 'Failed to update schedule' });
    }
  });

  app.delete('/api/schedules/:id', authenticateToken, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      // Verify child belongs to user
      const child = await storage.getChild(schedule.childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      await storage.deleteSchedule(scheduleId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({ message: 'Failed to delete schedule' });
    }
  });

  // Posts routes
  app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ message: 'Failed to get posts' });
    }
  });

  app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: req.user.id,
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(400).json({ message: 'Failed to create post' });
    }
  });

  app.put('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const updatedPost = await storage.updatePost(postId, {
        likes: post.likes + 1,
      });
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ message: 'Failed to like post' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });

  app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.status(204).send();
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Institutions routes
  app.get('/api/institutions', authenticateToken, async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error('Get institutions error:', error);
      res.status(500).json({ message: 'Failed to get institutions' });
    }
  });

  app.get('/api/institutions/:id', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const institution = await storage.getInstitutionById(institutionId);
      
      if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
      }
      
      res.json(institution);
    } catch (error) {
      console.error('Get institution error:', error);
      res.status(500).json({ message: 'Failed to get institution' });
    }
  });

  app.post('/api/institutions/:id/connect', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if institution exists
      const institution = await storage.getInstitutionById(institutionId);
      if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
      }
      
      // Check if already connected
      const existingConnections = await storage.getUserConnections(userId);
      const alreadyConnected = existingConnections.some(conn => conn.institutionId === institutionId);
      
      if (alreadyConnected) {
        return res.status(400).json({ message: 'Already connected to this institution' });
      }
      
      const connection = await storage.connectToInstitution(userId, institutionId);
      res.status(201).json(connection);
    } catch (error) {
      console.error('Connect to institution error:', error);
      res.status(500).json({ message: 'Failed to connect to institution' });
    }
  });

  app.delete('/api/institutions/:id/connect', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const userId = req.user.id;
      
      await storage.disconnectFromInstitution(userId, institutionId);
      res.status(204).send();
    } catch (error) {
      console.error('Disconnect from institution error:', error);
      res.status(500).json({ message: 'Failed to disconnect from institution' });
    }
  });

  app.get('/api/users/connections', authenticateToken, async (req, res) => {
    try {
      const connections = await storage.getUserConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      console.error('Get user connections error:', error);
      res.status(500).json({ message: 'Failed to get user connections' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: 'Failed to get admin stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
