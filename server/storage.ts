import { 
  users, 
  children, 
  schedules, 
  posts, 
  notifications,
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
  type UserWithChildren,
  type ChildWithSchedules,
  type PostWithAuthor,
  type ScheduleWithChild,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
    return await db.query.schedules.findMany({
      with: {
        child: true,
      },
      where: eq(children.parentId, parentId),
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
