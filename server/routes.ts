import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertParentSchema, insertInstitutionSchema, insertCuidadorSchema, insertChildSchema, insertScheduleSchema, insertPostSchema, insertNotificationSchema } from "@shared/schema";

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
      } else if (role === 'cuidador') {
        userData = insertCuidadorSchema.parse(req.body);
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

  // Get user by ID
  app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return limited user info for privacy
      res.json({
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        role: user.role,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.get('/api/users/public/:id', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getPublicUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get public user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
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

  app.get('/api/institutions/:id/connections', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const connectedUsers = await storage.getInstitutionConnectedUsers(institutionId);
      res.json(connectedUsers);
    } catch (error) {
      console.error('Get institution connections error:', error);
      res.status(500).json({ message: 'Failed to get institution connections' });
    }
  });

  // Get connected students (parents) and cuidadores separately
  app.get('/api/institutions/:id/connected-students', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const connectedStudents = await storage.getInstitutionConnectedStudents(institutionId);
      res.json(connectedStudents);
    } catch (error) {
      console.error('Get connected students error:', error);
      res.status(500).json({ message: 'Failed to get connected students' });
    }
  });

  app.get('/api/institutions/:id/connected-cuidadores', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const connectedCuidadores = await storage.getInstitutionConnectedCuidadores(institutionId);
      res.json(connectedCuidadores);
    } catch (error) {
      console.error('Get connected cuidadores error:', error);
      res.status(500).json({ message: 'Failed to get connected cuidadores' });
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

  // Cuidoteca routes
  app.get('/api/cuidotecas', authenticateToken, async (req, res) => {
    try {
      if (req.user.role === 'institution') {
        const cuidotecas = await storage.getCuidotecasByInstitution(req.user.id);
        res.json(cuidotecas);
      } else {
        // For parents, return all cuidotecas
        const cuidotecas = await storage.getAllCuidotecas();
        res.json(cuidotecas);
      }
    } catch (error) {
      console.error('Get cuidotecas error:', error);
      res.status(500).json({ message: 'Failed to get cuidotecas' });
    }
  });

  app.get('/api/cuidotecas/:id', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }
      
      const cuidoteca = await storage.getCuidoteca(cuidotecaId);
      if (!cuidoteca) {
        return res.status(404).json({ message: 'Cuidoteca not found' });
      }
      res.json(cuidoteca);
    } catch (error) {
      console.error('Get cuidoteca error:', error);
      res.status(500).json({ message: 'Failed to get cuidoteca' });
    }
  });

  app.post('/api/cuidotecas', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can create cuidotecas' });
      }
      
      const cuidotecaData = { ...req.body, institutionId: req.user.id };
      const cuidoteca = await storage.createCuidoteca(cuidotecaData);
      res.status(201).json(cuidoteca);
    } catch (error) {
      console.error('Create cuidoteca error:', error);
      res.status(500).json({ message: 'Failed to create cuidoteca' });
    }
  });

  app.put('/api/cuidotecas/:id', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      const cuidoteca = await storage.getCuidoteca(cuidotecaId);
      
      if (!cuidoteca) {
        return res.status(404).json({ message: 'Cuidoteca not found' });
      }
      
      if (req.user.role !== 'institution' || cuidoteca.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const updatedCuidoteca = await storage.updateCuidoteca(cuidotecaId, req.body);
      res.json(updatedCuidoteca);
    } catch (error) {
      console.error('Update cuidoteca error:', error);
      res.status(500).json({ message: 'Failed to update cuidoteca' });
    }
  });

  app.delete('/api/cuidotecas/:id', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      const cuidoteca = await storage.getCuidoteca(cuidotecaId);
      
      if (!cuidoteca) {
        return res.status(404).json({ message: 'Cuidoteca not found' });
      }
      
      if (req.user.role !== 'institution' || cuidoteca.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      await storage.deleteCuidoteca(cuidotecaId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete cuidoteca error:', error);
      res.status(500).json({ message: 'Failed to delete cuidoteca' });
    }
  });

  // Cuidoteca enrollment routes
  app.get('/api/cuidotecas/:id/enrollments', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      const enrollments = await storage.getCuidotecaEnrollments(cuidotecaId);
      res.json(enrollments);
    } catch (error) {
      console.error('Get enrollments error:', error);
      res.status(500).json({ message: 'Failed to get enrollments' });
    }
  });

  app.post('/api/cuidotecas/:id/enroll', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'parent') {
        return res.status(403).json({ message: 'Only parents can enroll children' });
      }
      
      const cuidotecaId = parseInt(req.params.id);
      const { childId, requestedDays, requestedHours } = req.body;
      
      // Validate child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ message: 'Child not found or not owned by user' });
      }
      
      const enrollment = await storage.enrollChildInCuidoteca({
        cuidotecaId,
        childId,
        status: 'pending',
        requestedDays,
        requestedHours
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Enroll child error:', error);
      res.status(500).json({ message: 'Failed to enroll child' });
    }
  });

  app.get('/api/children/:id/enrollments', authenticateToken, async (req, res) => {
    try {
      const childId = parseInt(req.params.id);
      const enrollments = await storage.getChildEnrollments(childId);
      res.json(enrollments);
    } catch (error) {
      console.error('Get child enrollments error:', error);
      res.status(500).json({ message: 'Failed to get child enrollments' });
    }
  });

  // Parent enrollment routes
  app.get('/api/enrollments/my-children', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'parent') {
        return res.status(403).json({ message: 'Only parents can view their children enrollments' });
      }
      const enrollments = await storage.getParentChildrenEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error('Get parent enrollments error:', error);
      res.status(500).json({ message: 'Failed to get enrollments' });
    }
  });

  // Cuidador enrollment routes
  app.get('/api/enrollments/my-cuidador', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'cuidador') {
        return res.status(403).json({ message: 'Only cuidadores can view their enrollments' });
      }
      const enrollments = await storage.getCuidadorEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error('Get cuidador enrollments error:', error);
      res.status(500).json({ message: 'Failed to get enrollments' });
    }
  });

  app.post('/api/cuidotecas/:id/enroll-cuidador', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'cuidador') {
        return res.status(403).json({ message: 'Only cuidadores can enroll in cuidotecas' });
      }

      const cuidotecaId = parseInt(req.params.id);
      const { requestedDays, requestedHours } = req.body;

      // Validate enrollment data
      const enrollmentData = {
        cuidotecaId,
        cuidadorId: req.user.id,
        requestedDays,
        requestedHours,
      };

      const enrollment = await storage.enrollCuidadorInCuidoteca(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Cuidador enrollment error:', error);
      res.status(400).json({ message: 'Failed to enroll cuidador' });
    }
  });

  // Enrollment management routes
  app.get('/api/enrollments/pending', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can view pending enrollments' });
      }
      const enrollments = await storage.getPendingEnrollmentsByInstitution(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error('Get pending enrollments error:', error);
      res.status(500).json({ message: 'Failed to get pending enrollments' });
    }
  });

  // Get pending cuidador enrollments for institutions
  app.get('/api/enrollments/pending-cuidadores', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can view pending cuidador enrollments' });
      }
      const enrollments = await storage.getPendingCuidadorEnrollmentsByInstitution(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error('Get pending cuidador enrollments error:', error);
      res.status(500).json({ message: 'Failed to get pending cuidador enrollments' });
    }
  });

  app.put('/api/enrollments/:id/approve', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can approve enrollments' });
      }
      
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.updateEnrollmentStatus(enrollmentId, 'confirmed');
      
      // Create notification for parent
      const enrollmentWithDetails = await storage.getEnrollmentDetails(enrollmentId);
      await storage.createNotification({
        userId: enrollmentWithDetails.parentId,
        message: `Sua criança ${enrollmentWithDetails.childName} foi aceita na cuidoteca ${enrollmentWithDetails.cuidotecaName}!`
      });
      
      res.json(enrollment);
    } catch (error) {
      console.error('Approve enrollment error:', error);
      res.status(500).json({ message: 'Failed to approve enrollment' });
    }
  });

  app.put('/api/enrollments/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can reject enrollments' });
      }
      
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.updateEnrollmentStatus(enrollmentId, 'cancelled');
      
      // Create notification for parent
      const enrollmentWithDetails = await storage.getEnrollmentDetails(enrollmentId);
      await storage.createNotification({
        userId: enrollmentWithDetails.parentId,
        message: `A inscrição da sua criança ${enrollmentWithDetails.childName} na cuidoteca ${enrollmentWithDetails.cuidotecaName} foi rejeitada.`
      });
      
      res.json(enrollment);
    } catch (error) {
      console.error('Reject enrollment error:', error);
      res.status(500).json({ message: 'Failed to reject enrollment' });
    }
  });

  // Cuidador enrollment approval/rejection routes
  app.put('/api/cuidador-enrollments/:id/approve', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can approve cuidador enrollments' });
      }
      
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.updateCuidadorEnrollmentStatus(enrollmentId, 'confirmed');
      
      // Create notification for cuidador
      const enrollmentWithDetails = await storage.getCuidadorEnrollmentDetails(enrollmentId);
      await storage.createNotification({
        userId: enrollmentWithDetails.cuidadorId,
        message: `Sua inscrição na cuidoteca ${enrollmentWithDetails.cuidotecaName} foi aprovada!`
      });
      
      res.json(enrollment);
    } catch (error) {
      console.error('Approve cuidador enrollment error:', error);
      res.status(500).json({ message: 'Failed to approve cuidador enrollment' });
    }
  });

  app.put('/api/cuidador-enrollments/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can reject cuidador enrollments' });
      }
      
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.updateCuidadorEnrollmentStatus(enrollmentId, 'cancelled');
      
      // Create notification for cuidador
      const enrollmentWithDetails = await storage.getCuidadorEnrollmentDetails(enrollmentId);
      await storage.createNotification({
        userId: enrollmentWithDetails.cuidadorId,
        message: `Sua inscrição na cuidoteca ${enrollmentWithDetails.cuidotecaName} foi rejeitada.`
      });
      
      res.json(enrollment);
    } catch (error) {
      console.error('Reject cuidador enrollment error:', error);
      res.status(500).json({ message: 'Failed to reject cuidador enrollment' });
    }
  });

  // Enrollment cancellation routes
  app.delete('/api/enrollments/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (req.user.role === 'parent') {
        // Verify the enrollment belongs to this parent's child
        const enrollmentDetails = await storage.getEnrollmentDetails(enrollmentId);
        if (!enrollmentDetails || enrollmentDetails.parentId !== req.user.id) {
          return res.status(403).json({ message: 'Unauthorized to cancel this enrollment' });
        }
        
        await storage.cancelEnrollment(enrollmentId);
        res.status(204).send();
      } else {
        return res.status(403).json({ message: 'Only parents can cancel child enrollments' });
      }
    } catch (error) {
      console.error('Cancel enrollment error:', error);
      res.status(500).json({ message: 'Failed to cancel enrollment' });
    }
  });

  app.delete('/api/cuidador-enrollments/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (req.user.role === 'cuidador') {
        // Verify the enrollment belongs to this cuidador
        const enrollmentDetails = await storage.getCuidadorEnrollmentDetails(enrollmentId);
        if (!enrollmentDetails || enrollmentDetails.cuidadorId !== req.user.id) {
          return res.status(403).json({ message: 'Unauthorized to cancel this enrollment' });
        }
        
        await storage.cancelCuidadorEnrollment(enrollmentId);
        res.status(204).send();
      } else {
        return res.status(403).json({ message: 'Only cuidadores can cancel their enrollments' });
      }
    } catch (error) {
      console.error('Cancel cuidador enrollment error:', error);
      res.status(500).json({ message: 'Failed to cancel cuidador enrollment' });
    }
  });

  // Get cuidoteca detail
  app.get('/api/cuidotecas/:id', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }

      const cuidoteca = await storage.getCuidotecaById(cuidotecaId);
      if (!cuidoteca) {
        return res.status(404).json({ message: 'Cuidoteca not found' });
      }

      res.json(cuidoteca);
    } catch (error) {
      console.error('Get cuidoteca detail error:', error);
      res.status(500).json({ message: 'Failed to get cuidoteca details' });
    }
  });

  // Get cuidoteca approved cuidadores
  app.get('/api/cuidotecas/:id/approved-cuidadores', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }

      const cuidadores = await storage.getCuidotecaApprovedCuidadores(cuidotecaId);
      res.json(cuidadores);
    } catch (error) {
      console.error('Get approved cuidadores error:', error);
      res.status(500).json({ message: 'Failed to get approved cuidadores' });
    }
  });

  // Get cuidoteca approved children
  app.get('/api/cuidotecas/:id/approved-children', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }

      const children = await storage.getCuidotecaApprovedChildren(cuidotecaId);
      res.json(children);
    } catch (error) {
      console.error('Get approved children error:', error);
      res.status(500).json({ message: 'Failed to get approved children' });
    }
  });

  // Get cuidoteca pending children
  app.get('/api/cuidotecas/:id/pending-children', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }

      const children = await storage.getCuidotecaPendingChildren(cuidotecaId);
      res.json(children);
    } catch (error) {
      console.error('Get pending children error:', error);
      res.status(500).json({ message: 'Failed to get pending children' });
    }
  });

  // Get cuidoteca pending cuidadores
  app.get('/api/cuidotecas/:id/pending-cuidadores', authenticateToken, async (req, res) => {
    try {
      const cuidotecaId = parseInt(req.params.id);
      if (isNaN(cuidotecaId)) {
        return res.status(400).json({ message: 'Invalid cuidoteca ID' });
      }

      const cuidadores = await storage.getCuidotecaPendingCuidadores(cuidotecaId);
      res.json(cuidadores);
    } catch (error) {
      console.error('Get pending cuidadores error:', error);
      res.status(500).json({ message: 'Failed to get pending cuidadores' });
    }
  });

  // Profile picture upload
  app.post('/api/users/profile-picture', authenticateToken, async (req, res) => {
    try {
      const { profilePictureData } = req.body;
      
      if (!profilePictureData) {
        return res.status(400).json({ message: 'Profile picture data is required' });
      }

      const updatedUser = await storage.updateUserProfilePicture(req.user.id, profilePictureData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ message: 'Failed to upload profile picture' });
    }
  });

  // Message routes
  app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/messages/:otherUserId', authenticateToken, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.otherUserId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const messages = await storage.getMessages(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }

      const message = await storage.sendMessage({
        senderId: req.user.id,
        receiverId,
        content,
      });
      
      res.json(message);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.put('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }

      await storage.markMessageAsRead(messageId);
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Mark message as read error:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  });

  // Get enrolled children for cuidotecas
  app.get('/api/cuidotecas/enrollments', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can view enrollments' });
      }
      
      // Get all enrollments for cuidotecas owned by this institution
      const cuidotecas = await storage.getCuidotecasByInstitution(req.user.id);
      const allEnrollments = [];
      
      for (const cuidoteca of cuidotecas) {
        const enrollments = await storage.getCuidotecaEnrollments(cuidoteca.id);
        allEnrollments.push(...enrollments);
      }
      
      res.json(allEnrollments);
    } catch (error) {
      console.error('Get institution enrollments error:', error);
      res.status(500).json({ message: 'Failed to get enrollments' });
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
