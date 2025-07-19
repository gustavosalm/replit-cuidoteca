import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["parent", "coordinator", "caregiver", "institution", "cuidador"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["pending", "confirmed", "cancelled"]);
export const dayOfWeekEnum = pgEnum("day_of_week", ["monday", "tuesday", "wednesday", "thursday", "friday"]);
export const periodEnum = pgEnum("period", ["morning", "afternoon", "full_day"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  universityId: text("university_id"),
  course: text("course"),
  semester: text("semester"),
  address: text("address"),
  role: userRoleEnum("role").notNull().default("parent"),
  // Institution-specific fields
  institutionName: text("institution_name"),
  memberCount: integer("member_count").default(0),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  specialNeeds: text("special_needs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  period: periodEnum("period").notNull(),
  status: scheduleStatusEnum("status").notNull().default("pending"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const universityConnections = pgTable("university_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  institutionId: integer("institution_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cuidotecas = pgTable("cuidotecas", {
  id: serial("id").primaryKey(),
  institutionId: integer("institution_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  hours: text("hours").notNull(), // e.g. "08:00-12:00"
  days: text("days").array().notNull(), // array of days
  assignedCaretakers: text("assigned_caretakers").array().default([]).notNull(),
  maxCapacity: integer("max_capacity").default(20).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cuidotecaEnrollments = pgTable("cuidoteca_enrollments", {
  id: serial("id").primaryKey(),
  cuidotecaId: integer("cuidoteca_id").references(() => cuidotecas.id).notNull(),
  childId: integer("child_id").references(() => children.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: scheduleStatusEnum("status").notNull().default("pending"),
  requestedDays: text("requested_days").array().notNull(),
  requestedHours: text("requested_hours").notNull(),
});

export const cuidadorEnrollments = pgTable("cuidador_enrollments", {
  id: serial("id").primaryKey(),
  cuidotecaId: integer("cuidoteca_id").references(() => cuidotecas.id).notNull(),
  cuidadorId: integer("cuidador_id").references(() => users.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: scheduleStatusEnum("status").notNull().default("pending"),
  requestedDays: text("requested_days").array().notNull(),
  requestedHours: text("requested_hours").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  posts: many(posts),
  notifications: many(notifications),
  userConnections: many(universityConnections, {
    relationName: "userConnections",
  }),
  institutionConnections: many(universityConnections, {
    relationName: "institutionConnections",
  }),
  cuidotecas: many(cuidotecas),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  schedules: many(schedules),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  child: one(children, {
    fields: [schedules.childId],
    references: [children.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const universityConnectionsRelations = relations(universityConnections, ({ one }) => ({
  user: one(users, {
    fields: [universityConnections.userId],
    references: [users.id],
    relationName: "userConnections",
  }),
  institution: one(users, {
    fields: [universityConnections.institutionId],
    references: [users.id],
    relationName: "institutionConnections",
  }),
}));

export const cuidotecasRelations = relations(cuidotecas, ({ one, many }) => ({
  institution: one(users, {
    fields: [cuidotecas.institutionId],
    references: [users.id],
  }),
  enrollments: many(cuidotecaEnrollments),
}));

export const cuidotecaEnrollmentsRelations = relations(cuidotecaEnrollments, ({ one }) => ({
  cuidoteca: one(cuidotecas, {
    fields: [cuidotecaEnrollments.cuidotecaId],
    references: [cuidotecas.id],
  }),
  child: one(children, {
    fields: [cuidotecaEnrollments.childId],
    references: [children.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  memberCount: true, // This will be calculated automatically
});

// Separate schemas for different registration types
export const insertParentSchema = insertUserSchema.extend({
  role: z.literal("parent").default("parent"),
}).omit({
  institutionName: true, // Parents don't need institution name
});

export const insertInstitutionSchema = insertUserSchema.extend({
  role: z.literal("institution").default("institution"),
  institutionName: z.string().min(1, "Institution name is required"),
}).omit({
  universityId: true,
  course: true,
  semester: true,
  phone: true,
  address: true, // Institutions don't need these personal fields
});

export const insertCuidadorSchema = insertUserSchema.extend({
  role: z.literal("cuidador").default("cuidador"),
}).omit({
  institutionName: true, // Cuidadores don't need institution name
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likes: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

export const insertUniversityConnectionSchema = createInsertSchema(universityConnections).omit({
  id: true,
  createdAt: true,
});

export const insertCuidotecaSchema = createInsertSchema(cuidotecas).omit({
  id: true,
  createdAt: true,
});

export const insertCuidotecaEnrollmentSchema = createInsertSchema(cuidotecaEnrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertCuidadorEnrollmentSchema = createInsertSchema(cuidadorEnrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertParent = z.infer<typeof insertParentSchema>;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type InsertCuidador = z.infer<typeof insertCuidadorSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UniversityConnection = typeof universityConnections.$inferSelect;
export type InsertUniversityConnection = z.infer<typeof insertUniversityConnectionSchema>;
export type Cuidoteca = typeof cuidotecas.$inferSelect;
export type InsertCuidoteca = z.infer<typeof insertCuidotecaSchema>;
export type CuidotecaEnrollment = typeof cuidotecaEnrollments.$inferSelect;
export type InsertCuidotecaEnrollment = z.infer<typeof insertCuidotecaEnrollmentSchema>;
export type CuidadorEnrollment = typeof cuidadorEnrollments.$inferSelect;
export type InsertCuidadorEnrollment = z.infer<typeof insertCuidadorEnrollmentSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Extended types for queries with relations
export type UserWithChildren = User & {
  children: Child[];
};

export type ChildWithSchedules = Child & {
  schedules: Schedule[];
};

export type PostWithAuthor = Post & {
  author: User;
};

export type ScheduleWithChild = Schedule & {
  child: Child;
};

export type InstitutionWithConnections = User & {
  institutionConnections: UniversityConnection[];
  connectionCount?: number;
};
