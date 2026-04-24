import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { AuthPage } from './components/Auth';
import { OnboardingPage } from './components/Onboarding';
import { HomePage } from './components/HomePage';
import { LearnPage } from './components/LearnPage';
import { LessonPlayer } from './components/LessonPlayer';
import { GamesPage } from './components/GamesPage';
import { ProgressPage } from './components/ProgressPage';
import { useRouter, useRouteMatch } from './lib/router';

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const { route } = useRouter();

  const lessonMatch = useRouteMatch('/lesson/:id');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (profile && !profile.onboarding_completed) {
    return <OnboardingPage />;
  }

  return (
    <Layout>
      {route === '/' && <HomePage />}
      {route === '/learn' && <LearnPage />}
      {route === '/games' && <GamesPage />}
      {route === '/progress' && <ProgressPage />}
      {lessonMatch.matches && lessonMatch.params.id && <LessonPlayer lessonId={lessonMatch.params.id} />}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
