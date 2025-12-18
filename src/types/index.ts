/**
 * @fileoverview Core type definitions for Study Buddy application
 * Contains comprehensive TypeScript interfaces for all major entities
 * @version 1.0.0
 */

/**
 * Unique identifier type for database records
 */
export type ID = string | number;

/**
 * ISO 8601 timestamp string format
 */
export type ISOTimestamp = string;

/**
 * User authentication status
 */
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

/**
 * User role in the application
 */
export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task status in the workflow
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

/**
 * Note visibility levels
 */
export enum NoteVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

/**
 * Study session activity type
 */
export enum StudySessionType {
  FOCUSED = 'focused',
  GROUP = 'group',
  COLLABORATIVE = 'collaborative',
  BREAK = 'break',
  REVIEW = 'review',
  EXAM_PREP = 'exam_prep',
}

/**
 * Calendar event type
 */
export enum EventType {
  STUDY = 'study',
  CLASS = 'class',
  EXAM = 'exam',
  ASSIGNMENT_DUE = 'assignment_due',
  MEETING = 'meeting',
  REMINDER = 'reminder',
  MILESTONE = 'milestone',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Payment method type
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  UPI = 'upi',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Subscription plan type
 */
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

/**
 * Recurrence frequency for events and sessions
 */
export enum RecurrenceFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * User profile interface with comprehensive user information
 * @interface UserProfile
 */
export interface UserProfile {
  /** Unique identifier for the user */
  id: ID;
  
  /** User's email address */
  email: string;
  
  /** User's full name */
  name: string;
  
  /** Optional user avatar/profile picture URL */
  avatar?: string;
  
  /** User's bio or description */
  bio?: string;
  
  /** User's role in the application */
  role: UserRole;
  
  /** User's subscription plan */
  subscriptionPlan: SubscriptionPlan;
  
  /** Whether the email is verified */
  emailVerified: boolean;
  
  /** User's phone number (optional) */
  phoneNumber?: string;
  
  /** User's preferred language */
  preferredLanguage: string;
  
  /** User's timezone */
  timezone: string;
  
  /** Account creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last account update timestamp */
  updatedAt: ISOTimestamp;
  
  /** Last login timestamp */
  lastLoginAt?: ISOTimestamp;
  
  /** Whether the account is active */
  isActive: boolean;
  
  /** Subscription expiry date */
  subscriptionExpiresAt?: ISOTimestamp;
  
  /** User's total study hours */
  totalStudyHours?: number;
  
  /** User's learning goals or subjects */
  learningGoals?: string[];
  
  /** User's notification preferences */
  notificationPreferences?: NotificationPreferences;
}

/**
 * Notification preferences interface
 * @interface NotificationPreferences
 */
export interface NotificationPreferences {
  /** Enable email notifications */
  emailNotifications: boolean;
  
  /** Enable push notifications */
  pushNotifications: boolean;
  
  /** Enable in-app notifications */
  inAppNotifications: boolean;
  
  /** Enable study reminders */
  studyReminders: boolean;
  
  /** Enable assignment reminders */
  assignmentReminders: boolean;
  
  /** Enable marketing emails */
  marketingEmails: boolean;
}

/**
 * Transaction interface for financial operations
 * @interface Transaction
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: ID;
  
  /** User ID associated with the transaction */
  userId: ID;
  
  /** Transaction amount in base currency */
  amount: number;
  
  /** Currency code (e.g., 'USD', 'INR') */
  currency: string;
  
  /** Payment method used */
  paymentMethod: PaymentMethod;
  
  /** Transaction status */
  status: TransactionStatus;
  
  /** Transaction type (e.g., subscription, purchase, refund) */
  type: 'subscription' | 'purchase' | 'refund' | 'adjustment';
  
  /** Description of the transaction */
  description: string;
  
  /** Transaction reference/receipt ID */
  referenceId?: string;
  
  /** External payment gateway transaction ID */
  gatewayTransactionId?: string;
  
  /** Transaction creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Transaction completion timestamp */
  completedAt?: ISOTimestamp;
  
  /** Related subscription ID (if applicable) */
  subscriptionId?: ID;
  
  /** Metadata object for additional information */
  metadata?: Record<string, any>;
  
  /** Failure reason (if status is FAILED) */
  failureReason?: string;
}

/**
 * Task interface for managing study tasks and assignments
 * @interface Task
 */
export interface Task {
  /** Unique task identifier */
  id: ID;
  
  /** ID of the user who created the task */
  userId: ID;
  
  /** Task title */
  title: string;
  
  /** Detailed task description */
  description: string;
  
  /** Task priority level */
  priority: TaskPriority;
  
  /** Current task status */
  status: TaskStatus;
  
  /** Due date for the task */
  dueDate: ISOTimestamp;
  
  /** Estimated time to complete (in minutes) */
  estimatedDuration?: number;
  
  /** Actual time spent (in minutes) */
  actualDuration?: number;
  
  /** Subject or category of the task */
  subject?: string;
  
  /** Completion percentage (0-100) */
  completionPercentage: number;
  
  /** Array of subtask IDs */
  subtaskIds?: ID[];
  
  /** Associated calendar event ID */
  calendarEventId?: ID;
  
  /** Associated note IDs */
  attachedNoteIds?: ID[];
  
  /** Array of file attachments */
  attachments?: Attachment[];
  
  /** Task tags for organization */
  tags?: string[];
  
  /** Whether task has been completed */
  isCompleted: boolean;
  
  /** Completion date if completed */
  completedAt?: ISOTimestamp;
  
  /** Task creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
  
  /** Reminder settings for the task */
  reminders?: Reminder[];
  
  /** Assigned collaborators (for group tasks) */
  assignedTo?: ID[];
}

/**
 * Note interface for study notes and annotations
 * @interface Note
 */
export interface Note {
  /** Unique note identifier */
  id: ID;
  
  /** ID of the user who created the note */
  userId: ID;
  
  /** Note title */
  title: string;
  
  /** Note content (markdown supported) */
  content: string;
  
  /** Subject or category of the note */
  subject?: string;
  
  /** Associated task ID */
  taskId?: ID;
  
  /** Associated calendar event ID */
  eventId?: ID;
  
  /** Note visibility level */
  visibility: NoteVisibility;
  
  /** Array of tags for organization */
  tags?: string[];
  
  /** Array of file attachments */
  attachments?: Attachment[];
  
  /** IDs of users the note is shared with */
  sharedWith?: ID[];
  
  /** Color code for visual organization */
  color?: string;
  
  /** Whether note is pinned */
  isPinned: boolean;
  
  /** Whether note is archived */
  isArchived: boolean;
  
  /** Note creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
  
  /** Editing history */
  editHistory?: EditHistoryEntry[];
  
  /** AI-generated summary (optional) */
  aiSummary?: string;
}

/**
 * Edit history entry for tracking changes
 * @interface EditHistoryEntry
 */
export interface EditHistoryEntry {
  /** Timestamp of the edit */
  timestamp: ISOTimestamp;
  
  /** User ID of the editor */
  userId: ID;
  
  /** Previous content version */
  previousContent: string;
  
  /** Change description */
  changeDescription?: string;
}

/**
 * Calendar event interface for scheduling
 * @interface CalendarEvent
 */
export interface CalendarEvent {
  /** Unique event identifier */
  id: ID;
  
  /** ID of the user who created the event */
  userId: ID;
  
  /** Event title */
  title: string;
  
  /** Event description */
  description: string;
  
  /** Event type */
  type: EventType;
  
  /** Event start time */
  startTime: ISOTimestamp;
  
  /** Event end time */
  endTime: ISOTimestamp;
  
  /** Event location (physical or virtual) */
  location?: string;
  
  /** Meeting or conference URL */
  meetingUrl?: string;
  
  /** Whether event is all-day */
  isAllDay: boolean;
  
  /** Event recurrence settings */
  recurrence?: RecurrenceSettings;
  
  /** Event color code for visual organization */
  color?: string;
  
  /** IDs of attendees */
  attendees?: ID[];
  
  /** Subject/category associated with the event */
  subject?: string;
  
  /** Associated task ID */
  taskId?: ID;
  
  /** Associated note IDs */
  noteIds?: ID[];
  
  /** Event reminders */
  reminders?: Reminder[];
  
  /** Whether the user is attending */
  isAttending?: boolean;
  
  /** Event creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
}

/**
 * Recurrence settings for recurring events
 * @interface RecurrenceSettings
 */
export interface RecurrenceSettings {
  /** Recurrence frequency */
  frequency: RecurrenceFrequency;
  
  /** Interval between recurrences */
  interval: number;
  
  /** Days of week for weekly recurrence (0=Sunday, 6=Saturday) */
  daysOfWeek?: number[];
  
  /** Day of month for monthly recurrence */
  dayOfMonth?: number;
  
  /** Month of year for yearly recurrence */
  month?: number;
  
  /** Recurrence end date */
  endDate?: ISOTimestamp;
  
  /** Maximum number of occurrences */
  maxOccurrences?: number;
}

/**
 * Study session interface for tracking study activities
 * @interface StudySession
 */
export interface StudySession {
  /** Unique session identifier */
  id: ID;
  
  /** ID of the user conducting the study session */
  userId: ID;
  
  /** Session title */
  title: string;
  
  /** Session description */
  description?: string;
  
  /** Type of study session */
  type: StudySessionType;
  
  /** Subject being studied */
  subject: string;
  
  /** Session start time */
  startTime: ISOTimestamp;
  
  /** Session end time */
  endTime?: ISOTimestamp;
  
  /** Session duration in minutes */
  durationMinutes?: number;
  
  /** Topics covered during the session */
  topics?: string[];
  
  /** Session goals */
  goals?: string[];
  
  /** Session notes or summary */
  notes?: string;
  
  /** Associated task IDs */
  taskIds?: ID[];
  
  /** Associated note IDs */
  noteIds?: ID[];
  
  /** Productivity score (0-100) */
  productivityScore?: number;
  
  /** Mood/energy level at start (1-5) */
  moodStart?: number;
  
  /** Mood/energy level at end (1-5) */
  moodEnd?: number;
  
  /** Collaborators in the session */
  participants?: ID[];
  
  /** Whether session is completed */
  isCompleted: boolean;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
  
  /** Session creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
}

/**
 * Reminder interface for notifications
 * @interface Reminder
 */
export interface Reminder {
  /** Unique reminder identifier */
  id: ID;
  
  /** Reminder type */
  type: 'before' | 'on_time' | 'after';
  
  /** Time before the event (in minutes) */
  minutesBefore?: number;
  
  /** Reminder notification method */
  notificationMethod: 'email' | 'push' | 'in_app' | 'sms';
  
  /** Whether reminder has been sent */
  isSent: boolean;
  
  /** Reminder sent timestamp */
  sentAt?: ISOTimestamp;
}

/**
 * File attachment interface
 * @interface Attachment
 */
export interface Attachment {
  /** Unique attachment identifier */
  id: ID;
  
  /** File name */
  fileName: string;
  
  /** File MIME type */
  mimeType: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** File storage URL */
  fileUrl: string;
  
  /** File upload timestamp */
  uploadedAt: ISOTimestamp;
}

/**
 * Pagination metadata interface
 * @interface PaginationMeta
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Total number of items */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a next page */
  hasNextPage: boolean;
  
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Generic paginated response wrapper
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * API response wrapper for successful responses
 * @interface ApiResponse
 */
export interface ApiResponse<T> {
  /** Success status */
  success: boolean;
  
  /** Response data */
  data: T;
  
  /** Response message */
  message?: string;
  
  /** Response timestamp */
  timestamp: ISOTimestamp;
}

/**
 * API error response interface
 * @interface ApiErrorResponse
 */
export interface ApiErrorResponse {
  /** Error status flag */
  success: false;
  
  /** Error code */
  errorCode: string;
  
  /** Error message */
  message: string;
  
  /** Error details */
  details?: Record<string, any>;
  
  /** HTTP status code */
  statusCode: number;
  
  /** Error timestamp */
  timestamp: ISOTimestamp;
}

/**
 * Study statistics interface
 * @interface StudyStatistics
 */
export interface StudyStatistics {
  /** User ID */
  userId: ID;
  
  /** Total study hours */
  totalStudyHours: number;
  
  /** Total sessions completed */
  totalSessions: number;
  
  /** Average session duration in minutes */
  averageSessionDuration: number;
  
  /** Tasks completed */
  tasksCompleted: number;
  
  /** Notes created */
  notesCreated: number;
  
  /** Current streak (consecutive days) */
  currentStreak: number;
  
  /** Longest streak (consecutive days) */
  longestStreak: number;
  
  /** Study time by subject */
  studyTimeBySubject: Record<string, number>;
  
  /** Productivity trend (percentage change) */
  productivityTrend?: number;
  
  /** Last updated timestamp */
  updatedAt: ISOTimestamp;
}

/**
 * Learning goal interface
 * @interface LearningGoal
 */
export interface LearningGoal {
  /** Unique goal identifier */
  id: ID;
  
  /** User ID */
  userId: ID;
  
  /** Goal title */
  title: string;
  
  /** Goal description */
  description: string;
  
  /** Subject area */
  subject: string;
  
  /** Goal target (e.g., "Complete 50 hours", "Score 90%") */
  target: string;
  
  /** Current progress */
  currentProgress: number;
  
  /** Progress unit (e.g., "hours", "%", "tasks") */
  progressUnit: string;
  
  /** Goal deadline */
  deadline: ISOTimestamp;
  
  /** Goal status */
  status: 'active' | 'completed' | 'abandoned';
  
  /** Whether goal is completed */
  isCompleted: boolean;
  
  /** Goal creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
}

/**
 * Subscription interface
 * @interface Subscription
 */
export interface Subscription {
  /** Unique subscription identifier */
  id: ID;
  
  /** User ID */
  userId: ID;
  
  /** Subscription plan */
  plan: SubscriptionPlan;
  
  /** Subscription status */
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  
  /** Subscription start date */
  startDate: ISOTimestamp;
  
  /** Subscription end date */
  endDate: ISOTimestamp;
  
  /** Auto-renewal enabled */
  autoRenew: boolean;
  
  /** Subscription price */
  price: number;
  
  /** Billing currency */
  currency: string;
  
  /** Billing cycle (e.g., "monthly", "yearly") */
  billingCycle: 'monthly' | 'yearly';
  
  /** Last payment date */
  lastPaymentDate?: ISOTimestamp;
  
  /** Next billing date */
  nextBillingDate?: ISOTimestamp;
  
  /** Subscription creation timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
}

/**
 * Notification interface
 * @interface Notification
 */
export interface Notification {
  /** Unique notification identifier */
  id: ID;
  
  /** User ID */
  userId: ID;
  
  /** Notification title */
  title: string;
  
  /** Notification message */
  message: string;
  
  /** Notification type */
  type: 'reminder' | 'assignment' | 'achievement' | 'system' | 'social';
  
  /** Associated entity ID (e.g., task, event) */
  entityId?: ID;
  
  /** Associated entity type */
  entityType?: string;
  
  /** Whether notification has been read */
  isRead: boolean;
  
  /** Read timestamp */
  readAt?: ISOTimestamp;
  
  /** Notification creation timestamp */
  createdAt: ISOTimestamp;
}

/**
 * Achievement/Badge interface
 * @interface Achievement
 */
export interface Achievement {
  /** Unique achievement identifier */
  id: ID;
  
  /** Achievement name */
  name: string;
  
  /** Achievement description */
  description: string;
  
  /** Achievement icon URL */
  iconUrl: string;
  
  /** Achievement criteria */
  criteria: string;
  
  /** Rarity level */
  rarityLevel: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  /** Points awarded */
  pointsAwarded: number;
}

/**
 * User achievement progress interface
 * @interface UserAchievement
 */
export interface UserAchievement {
  /** Unique record identifier */
  id: ID;
  
  /** User ID */
  userId: ID;
  
  /** Achievement ID */
  achievementId: ID;
  
  /** Progress towards achievement (0-100) */
  progress: number;
  
  /** Whether achievement is unlocked */
  isUnlocked: boolean;
  
  /** Unlock timestamp */
  unlockedAt?: ISOTimestamp;
  
  /** Record creation timestamp */
  createdAt: ISOTimestamp;
}

/**
 * Study material interface
 * @interface StudyMaterial
 */
export interface StudyMaterial {
  /** Unique material identifier */
  id: ID;
  
  /** Material title */
  title: string;
  
  /** Material description */
  description: string;
  
  /** Subject area */
  subject: string;
  
  /** Material type (e.g., "pdf", "video", "article") */
  type: string;
  
  /** Material URL */
  url: string;
  
  /** Difficulty level */
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  
  /** Creator ID */
  createdBy: ID;
  
  /** Associated task IDs */
  taskIds?: ID[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Upload timestamp */
  createdAt: ISOTimestamp;
  
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
}

export default {
  // Enums
  AuthStatus,
  UserRole,
  TaskPriority,
  TaskStatus,
  NoteVisibility,
  StudySessionType,
  EventType,
  TransactionStatus,
  PaymentMethod,
  SubscriptionPlan,
  RecurrenceFrequency,
};
