import { 
  users, 
  children, 
  events,
  eventParticipations, 
  posts,
  postVotes,
  eventRsvps,
  notifications,
  universityConnections,
  userConnections,
  cuidotecas,
  cuidotecaEnrollments,
  cuidadorEnrollments,
  messages,
  institutionDocuments,
  passwordResetTokens,
  type User, 
  type InsertUser,
  type Child,
  type InsertChild,
  type Event,
  type InsertEvent,
  type EventParticipation,
  type InsertEventParticipation,
  type Post,
  type InsertPost,
  type PostVote,
  type InsertPostVote,
  type EventRsvp,
  type InsertEventRsvp,
  type Notification,
  type InsertNotification,
  type UniversityConnection,
  type InsertUniversityConnection,
  type UserConnection,
  type InsertUserConnection,
  type Cuidoteca,
  type InsertCuidoteca,
  type CuidotecaEnrollment,
  type InsertCuidotecaEnrollment,
  type CuidadorEnrollment,
  type InsertCuidadorEnrollment,
  type Message,
  type InsertMessage,
  type InstitutionDocument,
  type InsertInstitutionDocument,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type UserWithChildren,
  type ChildWithEventParticipations,
  type PostWithAuthor,
  type EventWithParticipations,
  type InstitutionWithConnections,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getPublicUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUserWithChildren(id: number): Promise<UserWithChildren | undefined>;
  
  // Child operations
  getChild(id: number): Promise<Child | undefined>;
  getChildrenByParent(parentId: number): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: number): Promise<void>;
  getChildWithEventParticipations(id: number): Promise<ChildWithEventParticipations | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByInstitution(institutionId: number): Promise<EventWithParticipations[]>;
  getEventsWithParticipationsByUser(userId: number): Promise<EventWithParticipations[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Event Participation operations
  getEventParticipation(id: number): Promise<EventParticipation | undefined>;
  getEventParticipationsByUser(userId: number): Promise<EventParticipation[]>;
  getEventParticipationsByEvent(eventId: number): Promise<EventParticipation[]>;
  createEventParticipation(participation: InsertEventParticipation): Promise<EventParticipation>;
  updateEventParticipation(id: number, participation: Partial<InsertEventParticipation>): Promise<EventParticipation>;
  deleteEventParticipation(id: number): Promise<void>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getAllPosts(): Promise<PostWithAuthor[]>;
  getInstitutionPosts(institutionId: number): Promise<PostWithAuthor[]>;
  getConnectedUsersPostsForInstitution(institutionId: number): Promise<PostWithAuthor[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  
  // Post voting operations
  voteOnPost(vote: InsertPostVote): Promise<PostVote>;
  getUserVoteOnPost(postId: number, userId: number): Promise<PostVote | undefined>;
  removeVoteFromPost(postId: number, userId: number): Promise<void>;
  updatePostVoteCounts(postId: number): Promise<void>;
  
  // Event RSVP methods
  rsvpToEvent(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getUserRsvpForEvent(eventId: number, userId: number): Promise<EventRsvp | null>;
  getEventRsvps(eventId: number): Promise<Array<EventRsvp & { user: User }>>;
  getEventRsvpCount(eventId: number): Promise<{ going: number; notGoing: number }>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // University connection operations
  getInstitutions(): Promise<InstitutionWithConnections[]>;
  getInstitutionById(id: number): Promise<InstitutionWithConnections | undefined>;
  getInstitutionConnectedUsers(institutionId: number): Promise<User[]>;
  getInstitutionConnectedStudents(institutionId: number): Promise<User[]>;
  getInstitutionConnectedCuidadores(institutionId: number): Promise<User[]>;
  connectToInstitution(userId: number, institutionId: number): Promise<UniversityConnection>;
  disconnectFromInstitution(userId: number, institutionId: number): Promise<void>;
  getUserConnections(userId: number): Promise<UniversityConnection[]>;
  
  // Cuidoteca operations
  getCuidotecasByInstitution(institutionId: number): Promise<Cuidoteca[]>;
  getCuidoteca(id: number): Promise<Cuidoteca | undefined>;
  createCuidoteca(cuidoteca: InsertCuidoteca): Promise<Cuidoteca>;
  updateCuidoteca(id: number, cuidoteca: Partial<InsertCuidoteca>): Promise<Cuidoteca>;
  deleteCuidoteca(id: number): Promise<void>;
  
  // Cuidoteca enrollment operations
  getCuidotecaEnrollments(cuidotecaId: number): Promise<CuidotecaEnrollment[]>;
  getChildEnrollments(childId: number): Promise<CuidotecaEnrollment[]>;
  enrollChildInCuidoteca(enrollment: InsertCuidotecaEnrollment): Promise<CuidotecaEnrollment>;
  updateEnrollmentStatus(id: number, status: string): Promise<CuidotecaEnrollment>;
  removeChildFromCuidoteca(enrollmentId: number): Promise<void>;
  
  // Parent enrollment operations
  getParentChildrenEnrollments(parentId: number): Promise<any[]>;
  
  // Cuidador enrollment operations
  getCuidadorEnrollments(cuidadorId: number): Promise<any[]>;
  enrollCuidadorInCuidoteca(enrollment: InsertCuidadorEnrollment): Promise<CuidadorEnrollment>;
  getPendingCuidadorEnrollmentsByInstitution(institutionId: number): Promise<any[]>;
  updateCuidadorEnrollmentStatus(id: number, status: string): Promise<CuidadorEnrollment>;
  getCuidadorEnrollmentDetails(id: number): Promise<any>;
  cancelCuidadorEnrollment(id: number): Promise<void>;

  // Additional enrollment operations
  getEnrollmentDetails(id: number): Promise<any>;
  cancelEnrollment(id: number): Promise<void>;

  // Profile picture operations
  updateUserProfilePicture(id: number, profilePictureData: string): Promise<User>;
  
  // Message operations
  getMessages(userId: number, otherUserId: number): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<void>;
  getUserConversations(userId: number): Promise<any[]>;

  // User connection operations
  createUserConnection(connection: InsertUserConnection): Promise<UserConnection>;
  getUserConnectionById(id: number): Promise<UserConnection | undefined>;
  updateUserConnectionStatus(id: number, status: string, acceptedAt?: Date): Promise<UserConnection>;
  getUserConnectionsByUser(userId: number): Promise<UserConnection[]>;
  getAcceptedUserConnections(userId: number): Promise<User[]>;
  getUserConnectionBetweenUsers(user1Id: number, user2Id: number): Promise<UserConnection | undefined>;
  removeUserConnection(connectionId: number): Promise<void>;

  // Document operations
  getInstitutionDocuments(institutionId: number): Promise<InstitutionDocument[]>;
  getAllPublicDocuments(): Promise<InstitutionDocument[]>;
  createInstitutionDocument(document: InsertInstitutionDocument): Promise<InstitutionDocument>;
  updateInstitutionDocument(id: number, document: Partial<InsertInstitutionDocument>): Promise<InstitutionDocument>;
  deleteInstitutionDocument(id: number): Promise<void>;

  // Admin operations
  getAdminStats(): Promise<{
    totalFamilies: number;
    activeChildren: number;
    todaySchedules: number;
    waitingList: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getPublicUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      universityId: users.universityId,
      course: users.course,
      semester: users.semester,
      address: users.address,
      role: users.role,
      institutionName: users.institutionName,
      memberCount: users.memberCount,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      // Exclude only password field
      password: users.password // This will be excluded from the response
    }).from(users).where(eq(users.id, id));
    
    if (!user) return undefined;
    
    // Remove password from response for security
    const { password, ...publicUser } = user;
    return publicUser as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserWithChildren(id: number): Promise<UserWithChildren | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        children: true,
      },
    });
    return user;
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async getChildrenByParent(parentId: number): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const [child] = await db.insert(children).values(insertChild).returning();
    return child;
  }

  async updateChild(id: number, updateChild: Partial<InsertChild>): Promise<Child> {
    const [child] = await db
      .update(children)
      .set(updateChild)
      .where(eq(children.id, id))
      .returning();
    return child;
  }

  async deleteChild(id: number): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  async getChildWithEventParticipations(id: number): Promise<ChildWithEventParticipations | undefined> {
    const child = await db.query.children.findFirst({
      where: eq(children.id, id),
      with: {
        eventParticipations: true,
      },
    });
    return child;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByInstitution(institutionId: number): Promise<EventWithParticipations[]> {
    return await db.query.events.findMany({
      where: eq(events.institutionId, institutionId),
      with: {
        participations: {
          with: {
            user: true,
            child: true,
          },
        },
      },
    });
  }

  async getEventsWithParticipationsByUser(userId: number): Promise<EventWithParticipations[]> {
    const userParticipations = await db.select({ eventId: eventParticipations.eventId })
      .from(eventParticipations)
      .where(eq(eventParticipations.userId, userId));
    
    const eventIds = userParticipations.map(p => p.eventId);
    
    if (eventIds.length === 0) {
      return [];
    }
    
    return await db.query.events.findMany({
      with: {
        participations: {
          with: {
            user: true,
            child: true,
          },
        },
        institution: true,
      },
      where: (events, { inArray }) => inArray(events.id, eventIds),
    });
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(updateEvent)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Event Participation operations
  async getEventParticipation(id: number): Promise<EventParticipation | undefined> {
    const [participation] = await db.select().from(eventParticipations).where(eq(eventParticipations.id, id));
    return participation || undefined;
  }

  async getEventParticipationsByUser(userId: number): Promise<EventParticipation[]> {
    return await db.select().from(eventParticipations).where(eq(eventParticipations.userId, userId));
  }

  async getEventParticipationsByEvent(eventId: number): Promise<EventParticipation[]> {
    return await db.select().from(eventParticipations).where(eq(eventParticipations.eventId, eventId));
  }

  async createEventParticipation(insertParticipation: InsertEventParticipation): Promise<EventParticipation> {
    const [participation] = await db.insert(eventParticipations).values(insertParticipation).returning();
    return participation;
  }

  async updateEventParticipation(id: number, updateParticipation: Partial<InsertEventParticipation>): Promise<EventParticipation> {
    const [participation] = await db
      .update(eventParticipations)
      .set(updateParticipation)
      .where(eq(eventParticipations.id, id))
      .returning();
    return participation;
  }

  async deleteEventParticipation(id: number): Promise<void> {
    await db.delete(eventParticipations).where(eq(eventParticipations.id, id));
  }



  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getAllPosts(): Promise<PostWithAuthor[]> {
    return await db.query.posts.findMany({
      with: {
        author: true,
      },
      orderBy: [desc(posts.pinned), desc(posts.createdAt)],
    });
  }

  async getInstitutionPosts(institutionId: number): Promise<PostWithAuthor[]> {
    return await db.query.posts.findMany({
      where: eq(posts.institutionId, institutionId),
      with: {
        author: true,
      },
      orderBy: [desc(posts.pinned), desc(posts.createdAt)],
    });
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: number, updatePost: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set(updatePost)
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getConnectedUsersPostsForInstitution(institutionId: number): Promise<PostWithAuthor[]> {
    // Get all users connected to this institution
    const connectedUsers = await db.query.universityConnections.findMany({
      where: eq(universityConnections.institutionId, institutionId),
      with: {
        user: true,
      },
    });

    if (connectedUsers.length === 0) {
      return [];
    }

    const userIds = connectedUsers.map(conn => conn.userId);

    // Get all posts from connected users where the post is associated with this institution
    return await db.query.posts.findMany({
      where: and(
        eq(posts.institutionId, institutionId)
        // This will include all posts made in this institution's community by connected users
      ),
      with: {
        author: true,
      },
      orderBy: desc(posts.createdAt),
    });
  }

  async voteOnPost(vote: InsertPostVote): Promise<PostVote> {
    // First, remove any existing vote from this user on this post
    await this.removeVoteFromPost(vote.postId, vote.userId);
    
    // Insert the new vote
    const [newVote] = await db.insert(postVotes).values(vote).returning();
    
    // Update post vote counts
    await this.updatePostVoteCounts(vote.postId);
    
    return newVote;
  }

  async getUserVoteOnPost(postId: number, userId: number): Promise<PostVote | undefined> {
    const [vote] = await db.select().from(postVotes).where(
      and(eq(postVotes.postId, postId), eq(postVotes.userId, userId))
    );
    return vote || undefined;
  }

  async removeVoteFromPost(postId: number, userId: number): Promise<void> {
    await db.delete(postVotes).where(
      and(eq(postVotes.postId, postId), eq(postVotes.userId, userId))
    );
  }

  async updatePostVoteCounts(postId: number): Promise<void> {
    // Count upvotes and downvotes
    const upvoteCount = await db.select().from(postVotes).where(
      and(eq(postVotes.postId, postId), eq(postVotes.voteType, 'upvote'))
    );
    
    const downvoteCount = await db.select().from(postVotes).where(
      and(eq(postVotes.postId, postId), eq(postVotes.voteType, 'downvote'))
    );

    // Update the post with new counts
    await db.update(posts)
      .set({
        upvotes: upvoteCount.length,
        downvotes: downvoteCount.length,
      })
      .where(eq(posts.id, postId));
  }

  // Event RSVP operations
  async rsvpToEvent(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [newRsvp] = await db
      .insert(eventRsvps)
      .values(rsvp)
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.userId],
        set: { status: rsvp.status }
      })
      .returning();
    return newRsvp;
  }

  async getUserRsvpForEvent(eventId: number, userId: number): Promise<EventRsvp | null> {
    const rsvp = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);
    return rsvp[0] || null;
  }

  async getEventRsvps(eventId: number): Promise<Array<EventRsvp & { user: User }>> {
    const results = await db
      .select({
        id: eventRsvps.id,
        eventId: eventRsvps.eventId,
        userId: eventRsvps.userId,
        status: eventRsvps.status,
        createdAt: eventRsvps.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        }
      })
      .from(eventRsvps)
      .innerJoin(users, eq(eventRsvps.userId, users.id))
      .where(eq(eventRsvps.eventId, eventId));
    
    return results as Array<EventRsvp & { user: User }>;
  }

  async getEventRsvpCount(eventId: number): Promise<{ going: number; notGoing: number }> {
    const goingRsvps = await db.select().from(eventRsvps).where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, 'going'))
    );
    
    const notGoingRsvps = await db.select().from(eventRsvps).where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, 'not_going'))
    );

    return {
      going: goingRsvps.length,
      notGoing: notGoingRsvps.length
    };
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getInstitutions(): Promise<InstitutionWithConnections[]> {
    const institutions = await db.query.users.findMany({
      where: eq(users.role, "institution"),
      with: {
        institutionConnections: true,
      },
    });

    return institutions.map(institution => ({
      ...institution,
      connectionCount: institution.institutionConnections.length,
    }));
  }

  async getInstitutionById(id: number): Promise<InstitutionWithConnections | undefined> {
    const institution = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.role, "institution")),
      with: {
        institutionConnections: true,
      },
    });

    if (!institution) return undefined;

    return {
      ...institution,
      connectionCount: institution.institutionConnections.length,
    };
  }

  async getInstitutionConnectedUsers(institutionId: number): Promise<User[]> {
    const connections = await db.query.universityConnections.findMany({
      where: eq(universityConnections.institutionId, institutionId),
      with: {
        user: true,
      },
    });

    return connections.map(connection => connection.user);
  }

  async getInstitutionConnectedStudents(institutionId: number): Promise<User[]> {
    const connections = await db.query.universityConnections.findMany({
      where: eq(universityConnections.institutionId, institutionId),
      with: {
        user: true,
      },
    });

    return connections.map(connection => connection.user).filter(user => user.role === 'parent');
  }

  async getInstitutionConnectedCuidadores(institutionId: number): Promise<User[]> {
    const connections = await db.query.universityConnections.findMany({
      where: eq(universityConnections.institutionId, institutionId),
      with: {
        user: true,
      },
    });

    return connections.map(connection => connection.user).filter(user => user.role === 'cuidador');
  }

  async connectToInstitution(userId: number, institutionId: number): Promise<UniversityConnection> {
    const [connection] = await db
      .insert(universityConnections)
      .values({ userId, institutionId })
      .returning();
    
    // Automatically create reverse connection (institution to user)
    // Check if reverse connection already exists to avoid duplicates
    const existingReverseConnection = await db.query.universityConnections.findFirst({
      where: and(
        eq(universityConnections.userId, institutionId),
        eq(universityConnections.institutionId, userId)
      )
    });
    
    if (!existingReverseConnection) {
      await db
        .insert(universityConnections)
        .values({ userId: institutionId, institutionId: userId });
    }
    
    return connection;
  }

  async disconnectFromInstitution(userId: number, institutionId: number): Promise<void> {
    // Remove both directions of connection
    await db
      .delete(universityConnections)
      .where(
        and(
          eq(universityConnections.userId, userId),
          eq(universityConnections.institutionId, institutionId)
        )
      );
    
    // Also remove reverse connection
    await db
      .delete(universityConnections)
      .where(
        and(
          eq(universityConnections.userId, institutionId),
          eq(universityConnections.institutionId, userId)
        )
      );
  }

  async getUserConnections(userId: number): Promise<UniversityConnection[]> {
    return await db
      .select()
      .from(universityConnections)
      .where(eq(universityConnections.userId, userId));
  }

  async getUserInstitutionConnections(userId: number): Promise<User[]> {
    const connections = await db.query.universityConnections.findMany({
      where: eq(universityConnections.userId, userId),
      with: {
        institution: true,
      },
    });

    return connections.map(connection => connection.institution).filter(inst => inst.role === 'institution');
  }

  // Cuidoteca operations
  async getCuidotecasByInstitution(institutionId: number): Promise<Cuidoteca[]> {
    return await db
      .select()
      .from(cuidotecas)
      .where(eq(cuidotecas.institutionId, institutionId));
  }

  async getAllCuidotecas(): Promise<Cuidoteca[]> {
    return await db.select().from(cuidotecas);
  }

  async getCuidoteca(id: number): Promise<Cuidoteca | undefined> {
    const [cuidoteca] = await db
      .select()
      .from(cuidotecas)
      .where(eq(cuidotecas.id, id));
    return cuidoteca || undefined;
  }

  async createCuidoteca(insertCuidoteca: InsertCuidoteca): Promise<Cuidoteca> {
    const [cuidoteca] = await db
      .insert(cuidotecas)
      .values(insertCuidoteca)
      .returning();
    return cuidoteca;
  }

  async updateCuidoteca(id: number, updateCuidoteca: Partial<InsertCuidoteca>): Promise<Cuidoteca> {
    const [cuidoteca] = await db
      .update(cuidotecas)
      .set(updateCuidoteca)
      .where(eq(cuidotecas.id, id))
      .returning();
    return cuidoteca;
  }

  async deleteCuidoteca(id: number): Promise<void> {
    await db.delete(cuidotecas).where(eq(cuidotecas.id, id));
  }

  // Cuidoteca enrollment operations
  async getCuidotecaEnrollments(cuidotecaId: number): Promise<CuidotecaEnrollment[]> {
    return await db
      .select()
      .from(cuidotecaEnrollments)
      .where(eq(cuidotecaEnrollments.cuidotecaId, cuidotecaId));
  }

  async getChildEnrollments(childId: number): Promise<CuidotecaEnrollment[]> {
    return await db
      .select()
      .from(cuidotecaEnrollments)
      .where(eq(cuidotecaEnrollments.childId, childId));
  }

  async enrollChildInCuidoteca(enrollment: InsertCuidotecaEnrollment): Promise<CuidotecaEnrollment> {
    const [newEnrollment] = await db
      .insert(cuidotecaEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async updateEnrollmentStatus(id: number, status: string): Promise<CuidotecaEnrollment> {
    const [enrollment] = await db
      .update(cuidotecaEnrollments)
      .set({ status: status as any })
      .where(eq(cuidotecaEnrollments.id, id))
      .returning();
    return enrollment;
  }

  async removeChildFromCuidoteca(enrollmentId: number): Promise<void> {
    await db.delete(cuidotecaEnrollments).where(eq(cuidotecaEnrollments.id, enrollmentId));
  }

  async getPendingEnrollmentsByInstitution(institutionId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidotecaEnrollments.id,
        status: cuidotecaEnrollments.status,
        requestedDays: cuidotecaEnrollments.requestedDays,
        requestedHours: cuidotecaEnrollments.requestedHours,
        child: {
          id: children.id,
          name: children.name,
          age: children.age,
          specialNeeds: children.specialNeeds,
        },
        parent: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        cuidoteca: {
          id: cuidotecas.id,
          name: cuidotecas.name,
          hours: cuidotecas.hours,
        },
      })
      .from(cuidotecaEnrollments)
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(users, eq(children.parentId, users.id))
      .innerJoin(cuidotecas, eq(cuidotecaEnrollments.cuidotecaId, cuidotecas.id))
      .where(
        and(
          eq(cuidotecaEnrollments.status, 'pending'),
          eq(cuidotecas.institutionId, institutionId)
        )
      );
    
    return result;
  }

  async getEnrollmentDetails(enrollmentId: number): Promise<any> {
    const [result] = await db
      .select({
        parentId: children.parentId,
        childName: children.name,
        cuidotecaName: cuidotecas.name,
      })
      .from(cuidotecaEnrollments)
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(cuidotecas, eq(cuidotecaEnrollments.cuidotecaId, cuidotecas.id))
      .where(eq(cuidotecaEnrollments.id, enrollmentId));
    
    return result;
  }

  async getInstitutionEnrollments(institutionId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidotecaEnrollments.id,
        status: cuidotecaEnrollments.status,
        cuidotecaId: cuidotecaEnrollments.cuidotecaId,
        cuidotecaName: cuidotecas.name,
        childId: children.id,
        childName: children.name,
        childAge: children.age,
        parentName: users.name,
      })
      .from(cuidotecaEnrollments)
      .innerJoin(cuidotecas, eq(cuidotecaEnrollments.cuidotecaId, cuidotecas.id))
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(users, eq(children.parentId, users.id))
      .where(eq(cuidotecas.institutionId, institutionId));
    
    return result;
  }

  async getParentChildrenEnrollments(parentId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidotecaEnrollments.id,
        childId: cuidotecaEnrollments.childId,
        cuidotecaId: cuidotecaEnrollments.cuidotecaId,
        status: cuidotecaEnrollments.status,
        requestedDays: cuidotecaEnrollments.requestedDays,
        requestedHours: cuidotecaEnrollments.requestedHours,
        enrollmentDate: cuidotecaEnrollments.enrollmentDate,
        cuidoteca: {
          id: cuidotecas.id,
          name: cuidotecas.name,
          institutionId: cuidotecas.institutionId,
        },
        institution: {
          id: users.id,
          name: users.name,
          institutionName: users.institutionName,
        },
      })
      .from(cuidotecaEnrollments)
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(cuidotecas, eq(cuidotecaEnrollments.cuidotecaId, cuidotecas.id))
      .innerJoin(users, eq(cuidotecas.institutionId, users.id))
      .where(eq(children.parentId, parentId));
    
    return result;
  }

  async getCuidadorEnrollments(cuidadorId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidadorEnrollments.id,
        cuidadorId: cuidadorEnrollments.cuidadorId,
        cuidotecaId: cuidadorEnrollments.cuidotecaId,
        status: cuidadorEnrollments.status,
        requestedDays: cuidadorEnrollments.requestedDays,
        requestedHours: cuidadorEnrollments.requestedHours,
        enrollmentDate: cuidadorEnrollments.enrollmentDate,
        cuidoteca: {
          id: cuidotecas.id,
          name: cuidotecas.name,
          institutionId: cuidotecas.institutionId,
        },
        institution: {
          id: users.id,
          name: users.name,
          institutionName: users.institutionName,
        },
      })
      .from(cuidadorEnrollments)
      .innerJoin(cuidotecas, eq(cuidadorEnrollments.cuidotecaId, cuidotecas.id))
      .innerJoin(users, eq(cuidotecas.institutionId, users.id))
      .where(eq(cuidadorEnrollments.cuidadorId, cuidadorId));
    
    return result;
  }

  async enrollCuidadorInCuidoteca(enrollment: InsertCuidadorEnrollment): Promise<CuidadorEnrollment> {
    const [newEnrollment] = await db
      .insert(cuidadorEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async getPendingCuidadorEnrollmentsByInstitution(institutionId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidadorEnrollments.id,
        status: cuidadorEnrollments.status,
        requestedDays: cuidadorEnrollments.requestedDays,
        requestedHours: cuidadorEnrollments.requestedHours,
        enrollmentDate: cuidadorEnrollments.enrollmentDate,
        cuidador: {
          id: users.id,
          name: users.name,
          email: users.email,
          course: users.course,
          semester: users.semester,
        },
        cuidoteca: {
          id: cuidotecas.id,
          name: cuidotecas.name,
          hours: cuidotecas.hours,
        },
      })
      .from(cuidadorEnrollments)
      .innerJoin(users, eq(cuidadorEnrollments.cuidadorId, users.id))
      .innerJoin(cuidotecas, eq(cuidadorEnrollments.cuidotecaId, cuidotecas.id))
      .where(
        and(
          eq(cuidadorEnrollments.status, 'pending'),
          eq(cuidotecas.institutionId, institutionId)
        )
      );
    
    return result;
  }

  async updateCuidadorEnrollmentStatus(id: number, status: string): Promise<CuidadorEnrollment> {
    const [enrollment] = await db
      .update(cuidadorEnrollments)
      .set({ status: status as any })
      .where(eq(cuidadorEnrollments.id, id))
      .returning();
    return enrollment;
  }

  async getCuidadorEnrollmentDetails(id: number): Promise<any> {
    const [result] = await db
      .select({
        cuidadorId: cuidadorEnrollments.cuidadorId,
        cuidotecaName: cuidotecas.name,
      })
      .from(cuidadorEnrollments)
      .innerJoin(cuidotecas, eq(cuidadorEnrollments.cuidotecaId, cuidotecas.id))
      .where(eq(cuidadorEnrollments.id, id));
    
    return result;
  }

  async cancelCuidadorEnrollment(id: number): Promise<void> {
    await db.delete(cuidadorEnrollments).where(eq(cuidadorEnrollments.id, id));
  }

  async cancelEnrollment(id: number): Promise<void> {
    await db.delete(cuidotecaEnrollments).where(eq(cuidotecaEnrollments.id, id));
  }

  async getCuidotecaById(id: number): Promise<any> {
    const [cuidoteca] = await db
      .select({
        id: cuidotecas.id,
        name: cuidotecas.name,
        hours: cuidotecas.hours,
        institutionId: cuidotecas.institutionId,
        institution: {
          id: users.id,
          name: users.name,
          institutionName: users.institutionName,
        },
      })
      .from(cuidotecas)
      .innerJoin(users, eq(cuidotecas.institutionId, users.id))
      .where(eq(cuidotecas.id, id));
    
    return cuidoteca;
  }

  async getCuidotecaApprovedCuidadores(cuidotecaId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidadorEnrollments.id,
        cuidadorId: cuidadorEnrollments.cuidadorId,
        status: cuidadorEnrollments.status,
        requestedDays: cuidadorEnrollments.requestedDays,
        requestedHours: cuidadorEnrollments.requestedHours,
        enrollmentDate: cuidadorEnrollments.enrollmentDate,
        cuidador: {
          id: users.id,
          name: users.name,
          email: users.email,
          course: users.course,
          semester: users.semester,
        },
      })
      .from(cuidadorEnrollments)
      .innerJoin(users, eq(cuidadorEnrollments.cuidadorId, users.id))
      .where(
        and(
          eq(cuidadorEnrollments.cuidotecaId, cuidotecaId),
          eq(cuidadorEnrollments.status, 'confirmed')
        )
      );
    
    return result;
  }

  async getCuidotecaApprovedChildren(cuidotecaId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidotecaEnrollments.id,
        childId: cuidotecaEnrollments.childId,
        status: cuidotecaEnrollments.status,
        requestedDays: cuidotecaEnrollments.requestedDays,
        requestedHours: cuidotecaEnrollments.requestedHours,
        enrollmentDate: cuidotecaEnrollments.enrollmentDate,
        child: {
          id: children.id,
          name: children.name,
          age: children.age,
          specialNeeds: children.specialNeeds,
        },
        parent: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(cuidotecaEnrollments)
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(users, eq(children.parentId, users.id))
      .where(
        and(
          eq(cuidotecaEnrollments.cuidotecaId, cuidotecaId),
          eq(cuidotecaEnrollments.status, 'confirmed')
        )
      );
    
    return result;
  }

  async getInstitutionApprovedChildrenCount(institutionId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(cuidotecaEnrollments)
      .innerJoin(cuidotecas, eq(cuidotecaEnrollments.cuidotecaId, cuidotecas.id))
      .where(
        and(
          eq(cuidotecas.institutionId, institutionId),
          eq(cuidotecaEnrollments.status, 'confirmed')
        )
      );
    
    return result[0]?.count || 0;
  }

  async getCuidotecaPendingChildren(cuidotecaId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidotecaEnrollments.id,
        childId: cuidotecaEnrollments.childId,
        status: cuidotecaEnrollments.status,
        requestedDays: cuidotecaEnrollments.requestedDays,
        requestedHours: cuidotecaEnrollments.requestedHours,
        enrollmentDate: cuidotecaEnrollments.enrollmentDate,
        child: {
          id: children.id,
          name: children.name,
          age: children.age,
          specialNeeds: children.specialNeeds,
        },
        parent: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(cuidotecaEnrollments)
      .innerJoin(children, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(users, eq(children.parentId, users.id))
      .where(
        and(
          eq(cuidotecaEnrollments.cuidotecaId, cuidotecaId),
          eq(cuidotecaEnrollments.status, 'pending')
        )
      );
    
    return result;
  }

  async getCuidotecaPendingCuidadores(cuidotecaId: number): Promise<any[]> {
    const result = await db
      .select({
        id: cuidadorEnrollments.id,
        cuidadorId: cuidadorEnrollments.cuidadorId,
        status: cuidadorEnrollments.status,
        requestedDays: cuidadorEnrollments.requestedDays,
        requestedHours: cuidadorEnrollments.requestedHours,
        enrollmentDate: cuidadorEnrollments.enrollmentDate,
        cuidador: {
          id: users.id,
          name: users.name,
          email: users.email,
          course: users.course,
          semester: users.semester,
        },
      })
      .from(cuidadorEnrollments)
      .innerJoin(users, eq(cuidadorEnrollments.cuidadorId, users.id))
      .where(
        and(
          eq(cuidadorEnrollments.cuidotecaId, cuidotecaId),
          eq(cuidadorEnrollments.status, 'pending')
        )
      );
    
    return result;
  }

  async getAdminStats(): Promise<{
    totalFamilies: number;
    activeChildren: number;
    todaySchedules: number;
    waitingList: number;
  }> {
    const [familiesCount] = await db
      .select({ count: db.$count(users.id) })
      .from(users)
      .where(eq(users.role, "parent"));

    const [childrenCount] = await db
      .select({ count: db.$count(children.id) })
      .from(children);

    const [schedulesCount] = await db
      .select({ count: db.$count(eventParticipations.id) })
      .from(eventParticipations)
      .where(eq(eventParticipations.status, "confirmed"));

    const [pendingCount] = await db
      .select({ count: db.$count(eventParticipations.id) })
      .from(eventParticipations)
      .where(eq(eventParticipations.status, "pending"));

    return {
      totalFamilies: familiesCount?.count || 0,
      activeChildren: childrenCount?.count || 0,
      todaySchedules: schedulesCount?.count || 0,
      waitingList: pendingCount?.count || 0,
    };
  }

  // Profile picture operations
  async updateUserProfilePicture(id: number, profilePictureData: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ profilePicture: profilePictureData })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Message operations
  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, otherUserId)
        )
      )
      .union(
        db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.senderId, otherUserId),
              eq(messages.receiverId, userId)
            )
          )
      )
      .orderBy(messages.createdAt);
    
    return result;
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async sendBulkMessage(senderId: number, recipientIds: number[], content: string): Promise<Message[]> {
    const messageValues = recipientIds.map(recipientId => ({
      senderId,
      receiverId: recipientId,
      content
    }));
    
    const newMessages = await db
      .insert(messages)
      .values(messageValues)
      .returning();
    
    return newMessages;
  }

  // Get parents who have children with confirmed enrollments in institution's cuidotecas
  async getParentsWithApprovedChildren(institutionId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(users)
      .innerJoin(children, eq(children.parentId, users.id))
      .innerJoin(cuidotecaEnrollments, eq(cuidotecaEnrollments.childId, children.id))
      .innerJoin(cuidotecas, eq(cuidotecas.id, cuidotecaEnrollments.cuidotecaId))
      .where(
        and(
          eq(cuidotecas.institutionId, institutionId),
          eq(cuidotecaEnrollments.status, 'confirmed'),
          eq(users.role, 'parent')
        )
      );
    
    // Remove duplicates by converting to Map and back to array
    const uniqueUsers = new Map();
    result.forEach(item => {
      uniqueUsers.set(item.user.id, item.user);
    });
    
    return Array.from(uniqueUsers.values());
  }

  // Get cuidadores with confirmed enrollments in institution's cuidotecas
  async getCuidadoresWithApprovedEnrollments(institutionId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(users)
      .innerJoin(cuidadorEnrollments, eq(cuidadorEnrollments.cuidadorId, users.id))
      .innerJoin(cuidotecas, eq(cuidotecas.id, cuidadorEnrollments.cuidotecaId))
      .where(
        and(
          eq(cuidotecas.institutionId, institutionId),
          eq(cuidadorEnrollments.status, 'confirmed'),
          eq(users.role, 'cuidador')
        )
      );
    
    // Remove duplicates by converting to Map and back to array
    const uniqueUsers = new Map();
    result.forEach(item => {
      uniqueUsers.set(item.user.id, item.user);
    });
    
    return Array.from(uniqueUsers.values());
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
  }

  async getUserConversations(userId: number): Promise<any[]> {
    // Get all unique conversations for this user
    const result = await db
      .select({
        otherUserId: messages.senderId,
        otherUserName: users.name,
        otherUserProfilePicture: users.profilePicture,
        lastMessage: messages.content,
        lastMessageDate: messages.createdAt,
        unreadCount: messages.read,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.receiverId, userId))
      .union(
        db
          .select({
            otherUserId: messages.receiverId,
            otherUserName: users.name,
            otherUserProfilePicture: users.profilePicture,
            lastMessage: messages.content,
            lastMessageDate: messages.createdAt,
            unreadCount: messages.read,
          })
          .from(messages)
          .innerJoin(users, eq(messages.receiverId, users.id))
          .where(eq(messages.senderId, userId))
      )
      .orderBy(desc(messages.createdAt));
    
    // Group by other user and get most recent conversation
    const conversationsMap = new Map();
    
    result.forEach((row) => {
      if (!conversationsMap.has(row.otherUserId) || 
          row.lastMessageDate > conversationsMap.get(row.otherUserId).lastMessageDate) {
        conversationsMap.set(row.otherUserId, row);
      }
    });
    
    return Array.from(conversationsMap.values());
  }

  // User connection operations
  async createUserConnection(connection: InsertUserConnection): Promise<UserConnection> {
    const [newConnection] = await db
      .insert(userConnections)
      .values(connection)
      .returning();
    
    return newConnection;
  }

  async getUserConnectionById(id: number): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections)
      .where(eq(userConnections.id, id));
    
    return connection || undefined;
  }

  async updateUserConnectionStatus(id: number, status: string, acceptedAt?: Date): Promise<UserConnection> {
    const updateData: any = { status };
    if (acceptedAt) {
      updateData.acceptedAt = acceptedAt;
    }

    const [updatedConnection] = await db
      .update(userConnections)
      .set(updateData)
      .where(eq(userConnections.id, id))
      .returning();
    
    return updatedConnection;
  }

  async getUserConnectionsByUser(userId: number): Promise<UserConnection[]> {
    const connections = await db
      .select()
      .from(userConnections)
      .where(
        and(
          eq(userConnections.recipientId, userId),
          eq(userConnections.status, "pending")
        )
      );
    
    return connections;
  }

  async getAcceptedUserConnections(userId: number): Promise<User[]> {
    // Get connections where user is requester and status is accepted
    const requesterConnections = await db
      .select()
      .from(users)
      .innerJoin(userConnections, eq(userConnections.recipientId, users.id))
      .where(
        and(
          eq(userConnections.requesterId, userId),
          eq(userConnections.status, "accepted")
        )
      );

    // Get connections where user is recipient and status is accepted
    const recipientConnections = await db
      .select()
      .from(users)
      .innerJoin(userConnections, eq(userConnections.requesterId, users.id))
      .where(
        and(
          eq(userConnections.recipientId, userId),
          eq(userConnections.status, "accepted")
        )
      );

    // Combine and return unique users
    const allConnectedUsers = [
      ...requesterConnections.map(c => c.users),
      ...recipientConnections.map(c => c.users)
    ];

    // Remove duplicates based on user ID
    const uniqueUsers = allConnectedUsers.filter((user, index, self) => 
      self.findIndex(u => u.id === user.id) === index
    );

    return uniqueUsers;
  }

  async getUserConnectionBetweenUsers(user1Id: number, user2Id: number): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections)
      .where(
        and(
          eq(userConnections.requesterId, user1Id),
          eq(userConnections.recipientId, user2Id)
        )
      )
      .union(
        db
          .select()
          .from(userConnections)
          .where(
            and(
              eq(userConnections.requesterId, user2Id),
              eq(userConnections.recipientId, user1Id)
            )
          )
      );
    
    return connection || undefined;
  }

  async removeUserConnection(connectionId: number): Promise<void> {
    // First, delete any notifications that reference this connection
    await db.delete(notifications).where(eq(notifications.connectionRequestId, connectionId));
    
    // Then delete the connection itself
    await db.delete(userConnections).where(eq(userConnections.id, connectionId));
  }

  async removeNotificationByConnectionRequestId(connectionRequestId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.connectionRequestId, connectionRequestId));
  }

  async getConnectedUsersToInstitution(institutionId: number): Promise<User[]> {
    const connectedUsers = await db
      .select()
      .from(users)
      .innerJoin(universityConnections, eq(universityConnections.userId, users.id))
      .where(eq(universityConnections.institutionId, institutionId));
    
    return connectedUsers.map(row => row.users);
  }

  // Document operations
  async getInstitutionDocuments(institutionId: number): Promise<InstitutionDocument[]> {
    const documents = await db
      .select()
      .from(institutionDocuments)
      .where(eq(institutionDocuments.institutionId, institutionId))
      .orderBy(desc(institutionDocuments.createdAt));
    
    return documents;
  }

  async getAllPublicDocuments(): Promise<InstitutionDocument[]> {
    const documents = await db
      .select({
        id: institutionDocuments.id,
        institutionId: institutionDocuments.institutionId,
        title: institutionDocuments.title,
        description: institutionDocuments.description,
        fileName: institutionDocuments.fileName,
        fileUrl: institutionDocuments.fileUrl,
        fileSize: institutionDocuments.fileSize,
        fileType: institutionDocuments.fileType,
        isPublic: institutionDocuments.isPublic,
        createdAt: institutionDocuments.createdAt,
        institutionName: users.institutionName,
        authorName: users.name,
      })
      .from(institutionDocuments)
      .innerJoin(users, eq(institutionDocuments.institutionId, users.id))
      .where(eq(institutionDocuments.isPublic, true))
      .orderBy(desc(institutionDocuments.createdAt));
    
    return documents;
  }

  async createInstitutionDocument(document: InsertInstitutionDocument): Promise<InstitutionDocument> {
    const [newDocument] = await db
      .insert(institutionDocuments)
      .values(document)
      .returning();
    
    return newDocument;
  }

  async updateInstitutionDocument(id: number, document: Partial<InsertInstitutionDocument>): Promise<InstitutionDocument> {
    const [updatedDocument] = await db
      .update(institutionDocuments)
      .set(document)
      .where(eq(institutionDocuments.id, id))
      .returning();
    
    return updatedDocument;
  }

  async deleteInstitutionDocument(id: number): Promise<void> {
    await db.delete(institutionDocuments).where(eq(institutionDocuments.id, id));
  }

  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      );
    
    return resetToken || undefined;
  }

  async markPasswordResetTokenAsUsed(id: number): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
  }



  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }
}

export const storage = new DatabaseStorage();
