/**
 * types/index.ts
 *
 * Canonical TypeScript types for EduShare frontend.
 * All API responses map to these types.
 */

// ─── Re-export Prisma enums for client use ────────────────────────────────────

export type Role = "STUDENT" | "FACULTY" | "ADMIN";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED";
export type ReportReason =
  | "INAPPROPRIATE"
  | "BULLYING"
  | "UNRELATED"
  | "SPAM"
  | "OTHER";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id:         string;
  email:      string;
  name:       string;
  avatarUrl:  string | null;
  department: string | null;
  role:       Role;
  isActive:   boolean;
  createdAt:  string | Date;
  updatedAt:  string | Date;
}

export interface ClassSection {
  id:          string;
  name:        string;
  subject:     string;
  description: string | null;
  classCode:   string;
  inviteLink:  string | null;
  isArchived:  boolean;
  createdAt:   string;
  facultyId:   string;
  joinedAt?:   string;
  faculty?:    Pick<UserProfile, "id" | "name" | "avatarUrl" | "email">;
  members?:    ClassMember[];
  _count?: {
    posts:   number;
    members: number;
  };
}

export interface ClassMember {
  id:        string;
  classId:   string;
  studentId: string;
  joinedAt:  string;
  student:   Pick<UserProfile, "id" | "name" | "avatarUrl" | "email" | "department">;
}

export interface PostFile {
  id:       string;
  fileName: string;
  fileUrl:  string;
  fileType: string;
  fileSize: number;
  postId:   string;
}

export interface Post {
  id:                 string;
  content:            string;
  category:           string | null;
  isPinned:           boolean;
  isSubmissionPost:   boolean;
  submissionDeadline: string | null;
  attachedLink:       string | null;
  createdAt:          string;
  updatedAt:          string;
  classId:            string;
  authorId:           string;
  author:             Pick<UserProfile, "id" | "name" | "avatarUrl" | "role">;
  files:              PostFile[];
  class?:             { id: string; name: string; classCode: string };
  comments?:          Comment[];
  _count?: {
    comments:    number;
    submissions: number;
  };
}

export interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  postId:    string;
  authorId:  string;
  author:    Pick<UserProfile, "id" | "name" | "avatarUrl" | "role">;
}

export interface Submission {
  id:          string;
  fileUrl:     string;
  fileName:    string;
  fileType:    string;
  status:      SubmissionStatus;
  score?:      number | null;
  feedback?:   string | null;
  submittedAt: string;
  updatedAt:   string;
  postId:      string;
  studentId:   string;
  student?:    Pick<UserProfile, "id" | "name" | "avatarUrl" | "email">;
}

export interface Notification {
  id:          string;
  type:        string;
  message:     string;
  isRead:      boolean;
  referenceId: string | null;
  createdAt:   string;
  userId:      string;
}

export interface Report {
  id:             string;
  reason:         ReportReason;
  description:    string | null;
  status:         ReportStatus;
  actionTaken:    string | null;
  createdAt:      string;
  resolvedAt:     string | null;
  reporterId:     string;
  reportedUserId: string | null;
  postId:         string | null;
  reporter?:      Pick<UserProfile, "id" | "name" | "email" | "avatarUrl" | "role">;
  reportedUser?:  Pick<UserProfile, "id" | "name" | "email" | "avatarUrl" | "role">;
  post?: {
    id:      string;
    content: string;
    class:   { id: string; name: string };
    author:  { id: string; name: string };
  };
}

export interface AnalyticsOverview {
  totalUsers:       number;
  totalStudents:    number;
  totalFaculty:     number;
  totalClasses:     number;
  activeClasses:    number;
  totalPosts:       number;
  totalSubmissions: number;
  pendingReports:   number;
  submissionRate:   number;
}

export interface AnalyticsData {
  overview:        AnalyticsOverview;
  recentUsers:     Pick<UserProfile, "id" | "name" | "email" | "role" | "createdAt" | "department">[];
  monthlyActivity: { date: string; post_count: number }[];
  topClasses:      (ClassSection & { _count: { posts: number; members: number } })[];
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount:   number;
}

// ─── Phase 2: Lesson + Assessment Types ──────────────────────────────────────

export type LessonStatus   = "LOCKED" | "UNLOCKED" | "COMPLETED";
export type AssessmentType = "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "MATCHING" | "TRUE_OR_FALSE" | "SHORT_ANSWER";
export type AttemptStatus  = "IN_PROGRESS" | "PASSED" | "FAILED";

export interface Lesson {
  id:            string;
  classId:       string;
  title:         string;
  description:   string | null;
  order:         number;
  videoUrl:      string;
  videoKey:      string;
  videoDuration: number;
  thumbnailUrl:  string | null;
  isPublished:   boolean;
  createdAt:     string | Date;
  updatedAt:     string | Date;
  assessment?:   Assessment | null;
  progress?:     LessonProgress | null;
}

export interface LessonProgress {
  id:             string;
  lessonId:       string;
  studentId:      string;
  watchedSeconds: number;
  highestSecond:  number;
  isCompleted:    boolean;
  completedAt:    string | null;
  lastHeartbeat:  string;
  updatedAt:      string;
}

export interface LessonWithStatus extends Lesson {
  status:            LessonStatus;
  progress:          LessonProgress | null;
  canTakeAssessment: boolean;
  assessmentPassed:  boolean;
}

export interface Assessment {
  id:               string;
  lessonId:         string;
  title:            string;
  instructions:     string | null;
  passingScore:     number;
  maxAttempts:      number;
  timeLimitMins:    number | null;
  shuffleQuestions: boolean;
  showResults:      boolean;
  createdAt:        string;
  updatedAt:        string;
  questions?:       Question[];
  attempts?:        AssessmentAttempt[];
  _count?: {
    questions: number;
    attempts:  number;
  };
}

export interface Question {
  id:           string;
  assessmentId: string;
  type:         AssessmentType;
  order:        number;
  questionText: string;
  points:       number;
  imageUrl:     string | null;
  explanation:  string | null;
  choices?:     QuestionChoice[];
  matchPairs?:  MatchPair[];
}

export interface QuestionChoice {
  id:         string;
  questionId: string;
  choiceText: string;
  isCorrect:  boolean;
  order:      number;
}

export interface MatchPair {
  id:         string;
  questionId: string;
  leftItem:   string;
  rightItem:  string;
  order:      number;
}

export interface AssessmentAttempt {
  id:            string;
  assessmentId:  string;
  studentId:     string;
  attemptNumber: number;
  score:         number | null;
  totalPoints:   number | null;
  earnedPoints:  number | null;
  status:        AttemptStatus;
  startedAt:     string;
  submittedAt:   string | null;
  timeLimitEnd:  string | null;
  answers?:      StudentAnswer[];
  student?:      Pick<UserProfile, "id" | "name" | "avatarUrl" | "email">;
}

export interface StudentAnswer {
  id:                string;
  attemptId:         string;
  questionId:        string;
  selectedChoiceIds: string[];
  matchAnswers:      { leftItem: string; selectedRightItem: string }[] | null;
  textAnswer:        string | null;
  isCorrect:         boolean | null;
  pointsEarned:      number;
}

// Shape returned to student during an active attempt
// isCorrect is NEVER exposed until after submission
export interface AttemptQuestion {
  id:           string;
  type:         AssessmentType;
  order:        number;
  questionText: string;
  points:       number;
  imageUrl:     string | null;
  choices?:     Omit<QuestionChoice, "isCorrect">[];
  matchPairs?: {
    id:       string;
    leftItem: string;
    order:    number;
  }[];
  shuffledRightItems?: string[];
  currentAnswer?:      StudentAnswer | null;
}

export interface AttemptSession {
  attempt:       AssessmentAttempt;
  assessment:    Assessment;
  questions:     AttemptQuestion[];
  timeRemaining: number | null;
}

export interface LessonResults {
  lesson:      Lesson;
  assessment:  Assessment;
  attempts:    AssessmentAttempt[];
  bestAttempt: AssessmentAttempt | null;
  hasPassed:   boolean;
}

