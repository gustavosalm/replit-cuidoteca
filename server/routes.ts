import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { posts } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertParentSchema, insertInstitutionSchema, insertCuidadorSchema, insertChildSchema, insertEventSchema, insertEventParticipationSchema, insertPostSchema, insertNotificationSchema, insertInstitutionDocumentSchema } from "@shared/schema";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        name: string;
        institutionName?: string;
      };
    }
  }
}

// Type guard for authenticated requests
function isAuthenticated(req: Express.Request): req is Express.Request & { user: NonNullable<Express.Request['user']> } {
  return req.user !== undefined;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      institutionName: decoded.institutionName,
    };
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
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name,
          institutionName: user.institutionName
        },
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
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name,
          institutionName: user.institutionName
        },
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

  app.put('/api/users/me/password', authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      // Get current user to verify password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Get user connections (must be before the :id route)
  app.get('/api/users/connections', authenticateToken, async (req, res) => {
    try {
      const connections = await storage.getUserConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      console.error('Get user connections error:', error);
      res.status(500).json({ message: 'Failed to get user connections' });
    }
  });

  // Direct user connection route (for parent-cuidador connections)
  app.post('/api/users/:id/connect', authenticateToken, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Get target user info
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify users can connect (parent-cuidador, parent-parent, cuidador-cuidador relationships)
      const canConnect = 
        (currentUser.role === 'parent' && targetUser.role === 'cuidador') ||
        (currentUser.role === 'cuidador' && targetUser.role === 'parent') ||
        (currentUser.role === 'parent' && targetUser.role === 'parent') ||
        (currentUser.role === 'cuidador' && targetUser.role === 'cuidador');
        
      if (!canConnect) {
        return res.status(400).json({ message: 'Users cannot connect directly' });
      }
      
      // Create user connection request
      const connection = await storage.createUserConnection({
        requesterId: currentUser.id,
        recipientId: targetUserId,
        status: 'pending'
      });
      
      // Create notification for target user with connection request metadata
      await storage.createNotification({
        userId: targetUserId,
        message: `${currentUser.name} gostaria de se conectar com você`,
        type: 'connection_request',
        connectionRequestId: connection.id
      });
      
      res.status(200).json({ message: 'Connection request sent' });
    } catch (error) {
      console.error('Connect users error:', error);
      res.status(500).json({ message: 'Failed to send connection request' });
    }
  });

  // Accept connection request
  app.put('/api/connection-requests/:id/accept', authenticateToken, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Get connection request
      const connection = await storage.getUserConnectionById(connectionId);
      if (!connection) {
        return res.status(404).json({ message: 'Connection request not found' });
      }
      
      // Verify current user is the recipient
      if (connection.recipientId !== currentUser.id) {
        return res.status(403).json({ message: 'Unauthorized to accept this connection' });
      }
      
      // Update connection status
      await storage.updateUserConnectionStatus(connectionId, 'accepted', new Date());
      
      // Remove the original connection request notification
      await storage.removeNotificationByConnectionRequestId(connectionId);
      
      // Get requester info
      const requester = await storage.getUser(connection.requesterId);
      if (requester) {
        // Create notification for requester
        await storage.createNotification({
          userId: connection.requesterId,
          message: `${currentUser.name} aceitou sua solicitação de conexão`
        });
      }
      
      res.json({ message: 'Connection accepted successfully' });
    } catch (error) {
      console.error('Accept connection error:', error);
      res.status(500).json({ message: 'Failed to accept connection' });
    }
  });

  // Decline connection request
  app.put('/api/connection-requests/:id/decline', authenticateToken, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Get connection request
      const connection = await storage.getUserConnectionById(connectionId);
      if (!connection) {
        return res.status(404).json({ message: 'Connection request not found' });
      }
      
      // Verify current user is the recipient
      if (connection.recipientId !== currentUser.id) {
        return res.status(403).json({ message: 'Unauthorized to decline this connection' });
      }
      
      // Update connection status
      await storage.updateUserConnectionStatus(connectionId, 'declined');
      
      // Remove the original connection request notification
      await storage.removeNotificationByConnectionRequestId(connectionId);
      
      res.json({ message: 'Connection declined successfully' });
    } catch (error) {
      console.error('Decline connection error:', error);
      res.status(500).json({ message: 'Failed to decline connection' });
    }
  });

  // Get user's connections (accepted connections)
  app.get('/api/users/:id/connections', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const connections = await storage.getAcceptedUserConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Get user connections error:', error);
      res.status(500).json({ message: 'Failed to get user connections' });
    }
  });

  // Get current user's connected users for messaging
  app.get('/api/users/me/connected-users', authenticateToken, async (req, res) => {
    try {
      const currentUserId = req.user.id;
      let connectedUsers = [];
      
      if (req.user.role === 'institution') {
        // For institutions, get all users connected to this institution
        connectedUsers = await storage.getInstitutionConnectedUsers(currentUserId);
      } else {
        // For regular users, get their user-to-user connections
        connectedUsers = await storage.getAcceptedUserConnections(currentUserId);
      }
      
      res.json(connectedUsers);
    } catch (error) {
      console.error('Get connected users error:', error);
      res.status(500).json({ message: 'Failed to get connected users' });
    }
  });

  // Get user's connected institutions
  app.get('/api/users/:id/institutions', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const institutions = await storage.getUserInstitutionConnections(userId);
      res.json(institutions);
    } catch (error) {
      console.error('Get user institutions error:', error);
      res.status(500).json({ message: 'Failed to get user institutions' });
    }
  });

  // Check if users are connected
  app.get('/api/users/:id/connection-status', authenticateToken, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.id);
      const currentUserId = req.user.id;
      
      // Find existing connection between users
      const connection = await storage.getUserConnectionBetweenUsers(currentUserId, targetUserId);
      
      if (!connection) {
        return res.json({
          connected: false,
          pending: false,
          incoming: false,
          connectionId: null
        });
      }
      
      const isConnected = connection.status === 'accepted';
      const isPending = connection.status === 'pending';
      const isSentByCurrentUser = connection.requesterId === currentUserId;
      const isIncomingRequest = connection.recipientId === currentUserId && isPending;
      
      res.json({
        connected: isConnected,
        pending: isPending && isSentByCurrentUser, // Only show as pending if current user sent it
        incoming: isIncomingRequest, // Show as incoming if current user is recipient
        connectionId: connection.id
      });
    } catch (error) {
      console.error('Check connection status error:', error);
      res.status(500).json({ message: 'Failed to check connection status' });
    }
  });

  // Remove connection
  app.delete('/api/connections/:id', authenticateToken, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Get connection to verify user can remove it
      const connection = await storage.getUserConnectionById(connectionId);
      if (!connection) {
        return res.status(404).json({ message: 'Connection not found' });
      }
      
      // Verify current user is part of this connection
      if (connection.requesterId !== currentUser.id && connection.recipientId !== currentUser.id) {
        return res.status(403).json({ message: 'Unauthorized to remove this connection' });
      }
      
      // Remove the connection
      await storage.removeUserConnection(connectionId);
      
      res.json({ message: 'Connection removed successfully' });
    } catch (error) {
      console.error('Remove connection error:', error);
      res.status(500).json({ message: 'Failed to remove connection' });
    }
  });

  // Get user by ID
  app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const user = await storage.getUser(userId);
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

  // Event routes
  app.get('/api/events', authenticateToken, async (req, res) => {
    try {
      let events: any[] = [];
      
      if (req.user.role === 'institution') {
        // Institutions get their own events
        events = await storage.getEventsByInstitution(req.user.id);
      } else {
        // Parents and cuidadores get events from their connected institutions
        const userConnections = await storage.getUserConnections(req.user.id);
        
        if (userConnections.length === 0) {
          return res.json([]);
        }
        
        for (const connection of userConnections) {
          const institutionEvents = await storage.getEventsByInstitution(connection.institutionId);
          events.push(...institutionEvents);
        }
        
        // Sort by creation date (newest first)
        events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Enhance events with RSVP data
      const enhancedEvents = await Promise.all(events.map(async (event) => {
        const rsvpCounts = await storage.getEventRsvpCount(event.id);
        let userRsvp = null;
        
        // Get user's RSVP if not an institution
        if (req.user.role !== 'institution') {
          userRsvp = await storage.getUserRsvpForEvent(event.id, req.user.id);
        }
        
        return {
          ...event,
          rsvpCounts,
          userRsvp
        };
      }));
      
      res.json(enhancedEvents);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Failed to get events' });
    }
  });

  // Get single event
  app.get('/api/events/:id', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check if user has access to this event
      const hasAccess = req.user.role === 'institution' || 
        await storage.isUserConnectedToInstitution(req.user.id, event.institutionId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'No access to this event' });
      }
      
      // Get RSVP counts
      const rsvpCounts = await storage.getEventRsvpCount(event.id);
      
      // Get user's RSVP if not an institution
      let userRsvp = null;
      if (req.user.role !== 'institution') {
        userRsvp = await storage.getUserRsvpForEvent(event.id, req.user.id);
      }
      
      res.json({
        ...event,
        rsvpCounts,
        userRsvp
      });
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({ message: 'Failed to get event' });
    }
  });

  // Create event (only institutions)
  app.post('/api/events', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can create events' });
      }

      const eventData = insertEventSchema.parse({
        ...req.body,
        institutionId: req.user.id
      });
      
      const event = await storage.createEvent(eventData);
      
      // Send invitations to all connected users
      const connectedUsers = await storage.getInstitutionConnectedUsers(req.user.id);
      const parentAndCuidadorUsers = connectedUsers.filter(user => 
        user.role === 'parent' || user.role === 'cuidador'
      );
      
      // Create notifications for all connected users
      const notificationPromises = parentAndCuidadorUsers.map(user =>
        storage.createNotification({
          userId: user.id,
          message: `Novo evento "${event.title}" criado por ${req.user.institutionName || req.user.name}. Faça check-in para participar!`,
          type: 'event_created',
          eventId: event.id
        })
      );
      
      await Promise.all(notificationPromises);
      
      res.status(201).json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(400).json({ message: 'Failed to create event' });
    }
  });

  // Update event (only institutions)
  app.put('/api/events/:id', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updates = req.body;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Only institution that created the event can update it
      if (req.user.role !== 'institution' || event.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this event' });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, updates);
      res.json(updatedEvent);
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  // Delete event (only institutions)
  app.delete('/api/events/:id', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Only institution that created the event can delete it
      if (req.user.role !== 'institution' || event.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this event' });
      }
      
      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  // Event RSVP endpoints
  app.post('/api/events/:id/rsvp', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['going', 'not_going'].includes(status)) {
        return res.status(400).json({ message: 'Invalid RSVP status' });
      }

      const rsvp = await storage.rsvpToEvent({
        eventId,
        userId: req.user.id,
        status
      });

      res.json(rsvp);
    } catch (error) {
      console.error('RSVP error:', error);
      res.status(500).json({ message: 'Failed to RSVP to event' });
    }
  });

  app.get('/api/events/:id/rsvp', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rsvp = await storage.getUserRsvpForEvent(eventId, req.user.id);
      res.json(rsvp);
    } catch (error) {
      console.error('Get RSVP error:', error);
      res.status(500).json({ message: 'Failed to get RSVP status' });
    }
  });

  app.get('/api/events/:id/rsvps', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rsvps = await storage.getEventRsvps(eventId);
      const counts = await storage.getEventRsvpCount(eventId);
      
      res.json({
        rsvps,
        counts
      });
    } catch (error) {
      console.error('Get event RSVPs error:', error);
      res.status(500).json({ message: 'Failed to get event RSVPs' });
    }
  });

  // Check-in to event (parents and cuidadores)
  app.post('/api/events/:id/checkin', authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { status, childId } = req.body; // status: 'confirmed' or 'cancelled'
      
      if (req.user.role === 'institution') {
        return res.status(403).json({ message: 'Institutions cannot check-in to events' });
      }
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Verify child belongs to user (if provided)
      if (childId && req.user.role === 'parent') {
        const child = await storage.getChild(childId);
        if (!child || child.parentId !== req.user.id) {
          return res.status(404).json({ message: 'Child not found' });
        }
      }
      
      // Check if participation already exists
      const existingParticipations = await storage.getEventParticipationsByEvent(eventId);
      const userParticipation = existingParticipations.find(p => 
        p.userId === req.user.id && (!childId || p.childId === childId)
      );
      
      if (userParticipation) {
        // Update existing participation
        const updatedParticipation = await storage.updateEventParticipation(userParticipation.id, { status });
        res.json(updatedParticipation);
      } else {
        // Create new participation
        const participationData = insertEventParticipationSchema.parse({
          eventId,
          userId: req.user.id,
          childId: req.user.role === 'parent' ? childId : null,
          status
        });
        
        const participation = await storage.createEventParticipation(participationData);
        res.status(201).json(participation);
      }
    } catch (error) {
      console.error('Event check-in error:', error);
      res.status(500).json({ message: 'Failed to check-in to event' });
    }
  });

  // Posts routes
  app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
      let allPosts: any[] = [];

      if (req.user.role === 'institution') {
        // Institutions see all posts from their institution (including their own posts and posts from connected users)
        allPosts = await storage.getInstitutionPosts(req.user.id);
      } else {
        // Regular users see posts from their connected institutions
        const userConnections = await storage.getUserConnections(req.user.id);
        
        if (userConnections.length === 0) {
          return res.json([]);
        }
        
        // Get posts from all connected institutions
        for (const connection of userConnections) {
          const institutionPosts = await storage.getInstitutionPosts(connection.institutionId);
          allPosts.push(...institutionPosts);
        }
      }
      
      // Sort by pinned status first, then by creation date (newest first)
      allPosts.sort((a, b) => {
        // First sort by pinned status (pinned posts come first)
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // Then sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(allPosts);
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ message: 'Failed to get posts' });
    }
  });

  app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
      let institutionId: number;
      
      if (req.user.role === 'institution') {
        // Institutions post in their own community
        institutionId = req.user.id;
      } else {
        // Get user's connected institutions to post in the first one
        const userConnections = await storage.getUserConnections(req.user.id);
        
        if (userConnections.length === 0) {
          return res.status(400).json({ message: 'Conecte-se à sua instituição para começar a postar' });
        }
        
        institutionId = userConnections[0].institutionId;
      }
      
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: req.user.id,
        institutionId: institutionId,
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(400).json({ message: 'Failed to create post' });
    }
  });

  // Vote on post (upvote)
  app.put('/api/posts/:id/upvote', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user already voted on this post
      const existingVote = await storage.getUserVoteOnPost(postId, req.user.id);
      
      if (existingVote && existingVote.voteType === 'upvote') {
        // User already upvoted, remove the vote
        await storage.removeVoteFromPost(postId, req.user.id);
        await storage.updatePostVoteCounts(postId);
      } else {
        // Create or update vote to upvote
        await storage.voteOnPost({
          postId,
          userId: req.user.id,
          voteType: 'upvote'
        });

        // Send notification to post author (if not voting on own post)
        if (post.authorId !== req.user.id) {
          await storage.createNotification({
            userId: post.authorId,
            message: `${req.user.name} deu upvote no seu post`,
            type: 'vote'
          });
        }
      }
      
      const updatedPost = await storage.getPost(postId);
      res.json(updatedPost);
    } catch (error) {
      console.error('Upvote post error:', error);
      res.status(500).json({ message: 'Failed to upvote post' });
    }
  });

  // Vote on post (downvote)
  app.put('/api/posts/:id/downvote', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user already voted on this post
      const existingVote = await storage.getUserVoteOnPost(postId, req.user.id);
      
      if (existingVote && existingVote.voteType === 'downvote') {
        // User already downvoted, remove the vote
        await storage.removeVoteFromPost(postId, req.user.id);
        await storage.updatePostVoteCounts(postId);
      } else {
        // Create or update vote to downvote
        await storage.voteOnPost({
          postId,
          userId: req.user.id,
          voteType: 'downvote'
        });

        // Send notification to post author (if not voting on own post)
        if (post.authorId !== req.user.id) {
          await storage.createNotification({
            userId: post.authorId,
            message: `${req.user.name} deu downvote no seu post`,
            type: 'vote'
          });
        }
      }
      
      const updatedPost = await storage.getPost(postId);
      res.json(updatedPost);
    } catch (error) {
      console.error('Downvote post error:', error);
      res.status(500).json({ message: 'Failed to downvote post' });
    }
  });

  // Delete a post (only post author can delete)
  app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Only the post author can delete their post
      if (post.authorId !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own posts' });
      }
      
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Pin/unpin a post (only institution can pin posts in their community)
  app.put('/api/posts/:id/pin', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Only institutions can pin posts in their community
      if (req.user.role !== 'institution' || post.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Only the institution admin can pin posts in their community' });
      }
      
      // Toggle pin status
      const newPinnedStatus = !post.pinned;
      await storage.updatePost(postId, { pinned: newPinnedStatus });
      
      const updatedPost = await storage.getPost(postId);
      res.json(updatedPost);
    } catch (error) {
      console.error('Pin post error:', error);
      res.status(500).json({ message: 'Failed to pin post' });
    }
  });

  // Flag/unflag a post (only institution admin of the community can flag)
  app.put('/api/posts/:id/flag', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Only institutions can flag posts in their community
      if (req.user.role !== 'institution' || post.institutionId !== req.user.id) {
        return res.status(403).json({ message: 'Only the institution admin can flag posts in their community' });
      }
      
      // Toggle flag status
      const newFlaggedStatus = !post.flagged;
      await storage.updatePost(postId, { flagged: newFlaggedStatus });
      
      // Send notification to post author when flagged (not when unflagged)
      if (newFlaggedStatus && post.authorId !== req.user.id) {
        try {
          await storage.createNotification({
            userId: post.authorId,
            message: `Seu post foi sinalizado pelo admin de ${req.user.institutionName || req.user.name}`,
            type: 'post_flagged',
            postId: post.id
          });
        } catch (notificationError) {
          console.error('Failed to send flag notification:', notificationError);
          // Don't fail the flag operation if notification fails
        }
      }
      
      const updatedPost = await storage.getPost(postId);
      res.json(updatedPost);
    } catch (error) {
      console.error('Flag post error:', error);
      res.status(500).json({ message: 'Failed to flag post' });
    }
  });

  // Get user's vote on a specific post
  app.get('/api/posts/:id/my-vote', authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const vote = await storage.getUserVoteOnPost(postId, req.user.id);
      res.json(vote || null);
    } catch (error) {
      console.error('Get user vote error:', error);
      res.status(500).json({ message: 'Failed to get user vote' });
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

  // Get institution approved children count
  app.get('/api/institutions/:id/approved-children-count', authenticateToken, async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const count = await storage.getInstitutionApprovedChildrenCount(institutionId);
      res.json({ count });
    } catch (error) {
      console.error('Get approved children count error:', error);
      res.status(500).json({ message: 'Failed to get approved children count' });
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
      
      // Notify all connected users about the new cuidoteca
      try {
        const connectedUsers = await storage.getConnectedUsersToInstitution(req.user.id);
        
        // Create notifications for each connected user
        const notificationPromises = connectedUsers.map(user => 
          storage.createNotification({
            userId: user.id,
            message: `Nova cuidoteca "${cuidoteca.name}" criada por ${req.user.institutionName || req.user.name}`,
            type: 'cuidoteca_created',
            cuidotecaId: cuidoteca.id
          })
        );
        
        await Promise.all(notificationPromises);
      } catch (notificationError) {
        console.error('Failed to send cuidoteca notifications:', notificationError);
        // Don't fail the cuidoteca creation if notifications fail
      }
      
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
      
      // Get cuidoteca details to validate age range
      const cuidoteca = await storage.getCuidoteca(cuidotecaId);
      if (!cuidoteca) {
        return res.status(404).json({ message: 'Cuidoteca not found' });
      }
      
      // Check if child's age is within the cuidoteca's age range
      if (child.age < cuidoteca.minAge || child.age > cuidoteca.maxAge) {
        return res.status(400).json({ 
          message: `Idade da criança (${child.age} anos) está fora da faixa etária aceita pela cuidoteca (${cuidoteca.minAge}-${cuidoteca.maxAge} anos)` 
        });
      }
      
      const enrollment = await storage.enrollChildInCuidoteca({
        cuidotecaId,
        childId,
        status: 'pending',
        requestedDays,
        requestedHours
      });
      
      // Notify the institution about the new enrollment
      await storage.createNotification({
        userId: cuidoteca.institutionId,
        message: `Nova inscrição: ${child.name} se inscreveu na cuidoteca ${cuidoteca.name}`,
        type: 'enrollment_request'
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
      
      // Get cuidoteca details to notify the institution
      const cuidoteca = await storage.getCuidoteca(cuidotecaId);
      if (cuidoteca) {
        await storage.createNotification({
          userId: cuidoteca.institutionId,
          message: `Novo cuidador: ${req.user.name} se inscreveu na cuidoteca ${cuidoteca.name}`
        });
      }
      
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

  // Bulk message sending for institutions
  app.post('/api/messages/bulk', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can send bulk messages' });
      }

      const { targetGroup, content } = req.body;
      
      if (!content || !targetGroup) {
        return res.status(400).json({ message: 'Content and target group are required' });
      }
      
      // Get target users based on target group
      let targetUsers = [];
      
      if (targetGroup === 'parents') {
        // All connected parents
        const connectedUsers = await storage.getInstitutionConnectedUsers(req.user.id);
        targetUsers = connectedUsers.filter(user => user.role === 'parent');
      } else if (targetGroup === 'cuidadores') {
        // All connected cuidadores
        const connectedUsers = await storage.getInstitutionConnectedUsers(req.user.id);
        targetUsers = connectedUsers.filter(user => user.role === 'cuidador');
      } else if (targetGroup === 'all') {
        // All connected users (parents and cuidadores)
        const connectedUsers = await storage.getInstitutionConnectedUsers(req.user.id);
        targetUsers = connectedUsers.filter(user => user.role === 'parent' || user.role === 'cuidador');
      } else if (targetGroup === 'approved-parents') {
        // Parents with children approved in institution's cuidotecas
        targetUsers = await storage.getParentsWithApprovedChildren(req.user.id);
      } else if (targetGroup === 'approved-cuidadores') {
        // Cuidadores approved in institution's cuidotecas
        targetUsers = await storage.getCuidadoresWithApprovedEnrollments(req.user.id);
      } else if (targetGroup === 'approved-all') {
        // Both approved parents and approved cuidadores
        const approvedParents = await storage.getParentsWithApprovedChildren(req.user.id);
        const approvedCuidadores = await storage.getCuidadoresWithApprovedEnrollments(req.user.id);
        targetUsers = [...approvedParents, ...approvedCuidadores];
      } else {
        return res.status(400).json({ message: 'Invalid target group. Use "parents", "cuidadores", "all", "approved-parents", "approved-cuidadores", or "approved-all"' });
      }
      
      if (targetUsers.length === 0) {
        return res.status(400).json({ message: 'No users found for the selected group' });
      }
      
      const recipientIds = targetUsers.map(user => user.id);
      const messages = await storage.sendBulkMessage(req.user.id, recipientIds, content);
      
      res.status(201).json({ 
        message: `Message sent to ${targetUsers.length} users`,
        recipientCount: targetUsers.length,
        sentMessages: messages.length
      });
    } catch (error) {
      console.error('Send bulk message error:', error);
      res.status(500).json({ message: 'Failed to send bulk message' });
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

  // Document routes
  app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
      if (req.user.role === 'institution') {
        // Institutions can see their own documents
        const documents = await storage.getInstitutionDocuments(req.user.id);
        res.json(documents);
      } else {
        // Other users see all public documents
        const documents = await storage.getAllPublicDocuments();
        res.json(documents);
      }
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: 'Failed to get documents' });
    }
  });

  app.post('/api/documents', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can upload documents' });
      }

      const documentData = insertInstitutionDocumentSchema.parse({
        ...req.body,
        institutionId: req.user.id
      });

      const document = await storage.createInstitutionDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error('Create document error:', error);
      res.status(500).json({ message: 'Failed to create document' });
    }
  });

  app.put('/api/documents/:id', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can update documents' });
      }

      const documentId = parseInt(req.params.id);
      const updateData = insertInstitutionDocumentSchema.partial().parse(req.body);

      const document = await storage.updateInstitutionDocument(documentId, updateData);
      res.json(document);
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({ message: 'Failed to update document' });
    }
  });

  app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: 'Only institutions can delete documents' });
      }

      const documentId = parseInt(req.params.id);
      await storage.deleteInstitutionDocument(documentId);
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Failed to delete document' });
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
