import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Flame, BookOpen, Star, Target, Award, BarChart3, Clock } from 'lucide-react';
import { CEFR_LABELS, getLevelProgress, type DailyActivity, type Achievement, type UserAchievement, type WeakArea } from '../lib/types';

export function ProgressPage() {
  const { profile, user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<DailyActivity[]>([]);
  const [achievements, setAchievements] = useState<(UserAchievement & { achievement: Achievement })[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    Promise.all([
      supabase.from('daily_activity').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo.toISOString().split('T')[0]).order('date'),
      supabase.from('user_achievements').select('*, achievement:achievements(*)').eq('user_id', user.id).order('unlocked_at', { ascending: false }),
      supabase.from('weak_areas').select('*').eq('user_id', user.id).order('error_count', { ascending: false }).limit(5),
      supabase.from('daily_activity').select('time_spent_seconds').eq('user_id', user.id),
    ]).then(([activityRes, achievementsRes, weakRes, timeRes]) => {
      if (activityRes.data) setWeeklyData(activityRes.data as DailyActivity[]);
      if (achievementsRes.data) setAchievements(achievementsRes.data as any);
      if (weakRes.data) setWeakAreas(weakRes.data as WeakArea[]);
      if (timeRes.data) setTotalTime(timeRes.data.reduce((sum: number, d: any) => sum + d.time_spent_seconds, 0));
      setLoading(false);
    });
  }, [user]);

  if (!profile || loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  const lp = getLevelProgress(profile.xp);
  const totalDays = weeklyData.length;
  const avgXpPerDay = totalDays > 0 ? Math.round(weeklyData.reduce((s, d) => s + d.xp_earned, 0) / totalDays) : 0;
  const maxDayXp = Math.max(...weeklyData.map(d => d.xp_earned), 1);

  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const activity = weeklyData.find(a => a.date === dateStr);
    return { day: days[d.getDay()], xp: activity?.xp_earned || 0, lessons: activity?.lessons_completed || 0, date: dateStr };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tu Progreso</h1>

      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm opacity-90">Nivel actual</div>
            <div className="text-3xl font-bold">Nivel {lp.level}</div>
          </div>
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold">{profile.cefr_level}</span>
          </div>
        </div>
        <div className="text-sm opacity-90 mb-1">{CEFR_LABELS[profile.cefr_level]}</div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${lp.percentage}%` }} />
        </div>
        <div className="text-xs opacity-80 mt-1">{lp.current}/{lp.needed} XP para el siguiente nivel</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Flame} label="Dias seguidos" value={profile.streak_count.toString()} color="text-orange-500" />
        <StatCard icon={Star} label="XP total" value={profile.total_xp_earned.toString()} color="text-amber-500" />
        <StatCard icon={BookOpen} label="Lecciones hechas" value={profile.total_lessons_completed.toString()} color="text-emerald-500" />
        <StatCard icon={Clock} label="Tiempo invertido" value={formatTime(totalTime)} color="text-blue-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" /> Actividad semanal
        </h3>
        <div className="flex items-end gap-2 h-32">
          {last7Days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{d.xp}</div>
              <div className="w-full flex-1 flex items-end">
                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500" style={{ height: d.xp > 0 ? `${Math.max((d.xp / maxDayXp) * 100, 8)}%` : '4px' }} />
              </div>
              <div className="text-xs text-gray-400">{d.day}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>Promedio: {avgXpPerDay} XP/dia</span>
          <span>Meta diaria: {profile.daily_goal} XP</span>
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Logros ({achievements.length})
          </h3>
          <div className="space-y-2">
            {achievements.slice(0, 6).map((ua: any) => (
              <div key={ua.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{ua.achievement.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{ua.achievement.description}</div>
                </div>
                {ua.achievement.xp_reward > 0 && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">+{ua.achievement.xp_reward} XP</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {weakAreas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" /> Areas a mejorar
          </h3>
          <div className="space-y-2">
            {weakAreas.map(wa => {
              const total = wa.error_count + wa.correct_count;
              const accuracy = total > 0 ? Math.round((wa.correct_count / total) * 100) : 0;
              return (
                <div key={wa.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">{wa.category}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{wa.subcategory || 'General'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${accuracy < 60 ? 'text-red-500' : accuracy < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{accuracy}%</div>
                    <div className="text-xs text-gray-400">{total} intentos</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
