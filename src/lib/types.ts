export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type LessonType = 'vocabulary' | 'grammar' | 'phrases' | 'reading' | 'listening';
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type AchievementCategory = 'streak' | 'lessons' | 'xp' | 'special';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string;
  avatar: string;
  cefr_level: CefrLevel;
  xp: number;
  level: number;
  streak_count: number;
  longest_streak: number;
  last_lesson_at: string | null;
  total_lessons_completed: number;
  total_xp_earned: number;
  daily_goal: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  cefr_level: CefrLevel;
  unit_number: number;
  lesson_number: number;
  lesson_type: LessonType;
  content: LessonContent;
  xp_reward: number;
  estimated_minutes: number;
  is_premium: boolean;
  teacher_note: string;
  cultural_tip: string;
  common_mistake: string;
  pronunciation_tip: string;
  created_at: string;
}

export interface LessonContent {
  explanation: string;
  passage?: string;
  examples: { english: string; translation: string; note?: string }[];
  exercises: Exercise[];
}

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchingExercise;

export interface MultipleChoiceExercise {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct: number;
}

export interface FillBlankExercise {
  type: 'fill_blank';
  sentence: string;
  answer: string;
  hint: string;
}

export interface MatchingExercise {
  type: 'matching';
  pairs: string[][];
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  score: number;
  best_score: number;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  threshold: number;
  xp_reward: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  is_new: boolean;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  date: string;
  xp_earned: number;
  lessons_completed: number;
  time_spent_seconds: number;
  created_at: string;
}

export interface WeakArea {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  error_count: number;
  correct_count: number;
  last_practiced_at: string | null;
  created_at: string;
}

export const CEFR_LEVELS: CefrLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];

export const CEFR_LABELS: Record<CefrLevel, string> = {
  A0: 'Principiante absoluto',
  A1: 'Elemental',
  A2: 'Pre-Intermedio',
  B1: 'Intermedio',
  B2: 'Intermedio alto',
  C1: 'Avanzado',
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  vocabulary: 'Vocabulario',
  grammar: 'Gramatica',
  phrases: 'Frases',
  reading: 'Lectura',
  listening: 'Escucha',
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

export function getLevelProgress(xp: number): { level: number; current: number; needed: number; percentage: number } {
  const level = getLevelFromXp(xp);
  const xpForCurrentLevel = xpForLevel(level);
  const xpSpentOnPreviousLevels = totalXpForLevel(level);
  const current = xp - xpSpentOnPreviousLevels;
  return {
    level,
    current,
    needed: xpForCurrentLevel,
    percentage: Math.min((current / xpForCurrentLevel) * 100, 100),
  };
}
