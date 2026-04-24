import { useAuth } from '../contexts/AuthContext';
import { Link } from '../lib/router';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { BookOpen, Flame, Trophy, Target, ChevronRight, Star, Zap } from 'lucide-react';
import { CEFR_LABELS, type Lesson } from '../lib/types';

export function HomePage() {
  const { profile, user } = useAuth();
  const [todayXp, setTodayXp] = useState(0);
  const [todayLessons, setTodayLessons] = useState(0);
  const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<{ title: string; icon: string; xp: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    supabase.from('daily_activity').select('*').eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => {
        if (data) { setTodayXp(data.xp_earned); setTodayLessons(data.lessons_completed); }
      });

    supabase.from('lessons').select('*').eq('cefr_level', profile?.cefr_level || 'A0').order('unit_number').order('lesson_number').limit(3)
      .then(({ data }) => { if (data) setRecommendedLessons(data as Lesson[]); });

    if (profile) {
      supabase.from('user_achievements').select('achievement_id, achievements(title, icon, xp_reward)').eq('user_id', user.id).eq('is_new', true).order('unlocked_at', { ascending: false }).limit(3)
        .then(({ data }) => {
          if (data) setRecentAchievements(data.map((d: any) => ({ title: d.achievements.title, icon: d.achievements.icon, xp: d.achievements.xp_reward })));
        });
    }
  }, [user, profile]);

  if (!profile) return null;

  const dailyGoalProgress = Math.min((todayXp / profile.daily_goal) * 100, 100);
  const goalMet = todayXp >= profile.daily_goal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {profile.display_name || 'Estudiante'}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Listo para aprender algo nuevo hoy?</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <span className="font-semibold">Meta diaria</span>
          </div>
          <span className="text-sm opacity-90">{todayXp} / {profile.daily_goal} XP</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${dailyGoalProgress}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-90">{goalMet ? 'Meta cumplida!' : `Faltan ${profile.daily_goal - todayXp} XP`}</span>
          <span className="opacity-90">{todayLessons} lecciones hoy</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.streak_count}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Dias seguidos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.total_xp_earned}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">XP total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
          <BookOpen className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.total_lessons_completed}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Lecciones</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{profile.cefr_level}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-white">{CEFR_LABELS[profile.cefr_level]}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tu nivel actual</div>
        </div>
        <Link to="/learn" className="text-emerald-600 dark:text-emerald-400">
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {recommendedLessons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            Sigue aprendiendo
          </h2>
          <div className="space-y-2">
            {recommendedLessons.map(lesson => (
              <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="block bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{lesson.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{lesson.description}</div>
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+{lesson.xp_reward} XP</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentAchievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Logros nuevos
          </h2>
          <div className="space-y-2">
            {recentAchievements.map((a, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-center gap-3 border border-amber-200 dark:border-amber-800">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{a.title}</div>
                </div>
                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">+{a.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}
