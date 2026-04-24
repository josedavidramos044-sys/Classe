import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from '../lib/router';
import { BookOpen, Lock, CheckCircle, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { CEFR_LEVELS, CEFR_LABELS, LESSON_TYPE_LABELS, type CefrLevel, type Lesson, type LessonProgress } from '../lib/types';

export function LearnPage() {
  const { profile, user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [expandedLevel, setExpandedLevel] = useState<CefrLevel | null>(profile?.cefr_level || 'A0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('lessons').select('*').order('cefr_level').order('unit_number').order('lesson_number'),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
    ]).then(([lessonsRes, progressRes]) => {
      if (lessonsRes.data) setLessons(lessonsRes.data as Lesson[]);
      if (progressRes.data) {
        const map: Record<string, LessonProgress> = {};
        progressRes.data.forEach((p: LessonProgress) => { map[p.lesson_id] = p; });
        setProgress(map);
      }
      setLoading(false);
    });
  }, [user]);

  if (!profile) return null;

  const lessonsByLevel = CEFR_LEVELS.reduce((acc, level) => {
    acc[level] = lessons.filter(l => l.cefr_level === level);
    return acc;
  }, {} as Record<CefrLevel, Lesson[]>);

  const isLevelUnlocked = (level: CefrLevel): boolean => {
    const levelIdx = CEFR_LEVELS.indexOf(level);
    const currentIdx = CEFR_LEVELS.indexOf(profile.cefr_level);
    return levelIdx <= currentIdx + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aprende Ingles</h1>
      {CEFR_LEVELS.map(level => {
        const levelLessons = lessonsByLevel[level] || [];
        const unlocked = isLevelUnlocked(level);
        const isExpanded = expandedLevel === level;
        const completedCount = levelLessons.filter(l => progress[l.id]?.status === 'completed').length;

        return (
          <div key={level} className={`rounded-xl border transition-all ${unlocked ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'}`}>
            <button onClick={() => setExpandedLevel(isExpanded ? null : level)} className="w-full flex items-center gap-3 p-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unlocked ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {unlocked ? <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{level}</span> : <Lock className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">{CEFR_LABELS[level]}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {unlocked ? `${completedCount}/${levelLessons.length} lecciones` : 'Completa el nivel anterior para desbloquear'}
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && unlocked && (
              <div className="px-4 pb-4 space-y-2">
                {levelLessons.map(lesson => {
                  const p = progress[lesson.id];
                  const status = p?.status || 'available';
                  const isCompleted = status === 'completed';
                  const isInProgress = status === 'in_progress';
                  return (
                    <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="block flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30' : isInProgress ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : isInProgress ? <PlayCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <BookOpen className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{lesson.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{LESSON_TYPE_LABELS[lesson.lesson_type]} &middot; {lesson.estimated_minutes} min</div>
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+{lesson.xp_reward} XP</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
