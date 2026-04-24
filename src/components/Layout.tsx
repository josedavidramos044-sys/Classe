import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useRouter } from '../lib/router';
import { Home, BarChart3, Trophy, BookOpen, Sun, Moon, LogOut, Flame } from 'lucide-react';
import { getLevelProgress } from '../lib/types';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { route } = useRouter();

  if (!user) return <>{children}</>;

  const lp = profile ? getLevelProgress(profile.xp) : null;

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/learn', icon: BookOpen, label: 'Lecciones' },
    { path: '/games', icon: Trophy, label: 'Juegos' },
    { path: '/progress', icon: BarChart3, label: 'Progreso' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">LinguaLeap</span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{profile.streak_count}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="font-semibold">{profile.xp} XP</span>
                </div>
              </div>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === 'light' ? <Moon className="w-4 h-4 text-gray-600" /> : <Sun className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        {lp && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Nivel {lp.level}</span>
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${lp.percentage}%` }}
                />
              </div>
              <span>{lp.current}/{lp.needed} XP</span>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 pt-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = route === path || (path !== '/' && route.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
