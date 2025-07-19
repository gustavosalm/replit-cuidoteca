import { 
  users, 
  children, 
  schedules, 
  posts, 
  notifications,
  universityConnections,
  cuidotecas,
  cuidotecaEnrollments,
  cuidadorEnrollments,
  type User, 
  type InsertUser,
  type Child,
  type InsertChild,
  type Schedule,
  type InsertSchedule,
  type Post,
  type InsertPost,
  type Notification,
  type InsertNotification,
  type UniversityConnection,
  type InsertUniversityConnection,
  type Cuidoteca,
  type InsertCuidoteca,
  type CuidotecaEnrollment,
  type InsertCuidotecaEnrollment,
  type CuidadorEnrollment,
  type InsertCuidadorEnrollment,
  type UserWithChildren,
  type ChildWithSchedules,
  type PostWithAuthor,
  type ScheduleWithChild,
  type InstitutionWithConnections,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  getChildWithSchedules(id: number): Promise<ChildWithSchedules | undefined>;
  
  // Schedule operations
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedulesByChild(childId: number): Promise<Schedule[]>;
  getSchedulesByParent(parentId: number): Promise<ScheduleWithChild[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getAllPosts(): Promise<PostWithAuthor[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  
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
      // Exclude sensitive fields like password
    }).from(users).where(eq(users.id, id));
    return user || undefined;
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

  async getChildWithSchedules(id: number): Promise<ChildWithSchedules | undefined> {
    const child = await db.query.children.findFirst({
      where: eq(children.id, id),
      with: {
        schedules: true,
      },
    });
    return child;
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async getSchedulesByChild(childId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.childId, childId));
  }

  async getSchedulesByParent(parentId: number): Promise<ScheduleWithChild[]> {
    const childrenOfParent = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const childIds = childrenOfParent.map(child => child.id);
    
    if (childIds.length === 0) {
      return [];
    }
    
    return await db.query.schedules.findMany({
      with: {
        child: true,
      },
      where: (schedules, { inArray }) => inArray(schedules.childId, childIds),
    });
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values(insertSchedule).returning();
    return schedule;
  }

  async updateSchedule(id: number, updateSchedule: Partial<InsertSchedule>): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set(updateSchedule)
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
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
      orderBy: desc(posts.createdAt),
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
    return connection;
  }

  async disconnectFromInstitution(userId: number, institutionId: number): Promise<void> {
    await db
      .delete(universityConnections)
      .where(
        and(
          eq(universityConnections.userId, userId),
          eq(universityConnections.institutionId, institutionId)
        )
      );
  }

  async getUserConnections(userId: number): Promise<UniversityConnection[]> {
    return await db
      .select()
      .from(universityConnections)
      .where(eq(universityConnections.userId, userId));
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
      .select({ count: db.$count(schedules.id) })
      .from(schedules)
      .where(eq(schedules.status, "confirmed"));

    const [pendingCount] = await db
      .select({ count: db.$count(schedules.id) })
      .from(schedules)
      .where(eq(schedules.status, "pending"));

    return {
      totalFamilies: familiesCount?.count || 0,
      activeChildren: childrenCount?.count || 0,
      todaySchedules: schedulesCount?.count || 0,
      waitingList: pendingCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
