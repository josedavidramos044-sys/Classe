import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Lesson, LessonContent, Exercise, MultipleChoiceExercise, FillBlankExercise, MatchingExercise as MatchingExerciseType } from '../lib/types';
import { ArrowLeft, ArrowRight, Check, X, Star, Zap, BookOpen, Lightbulb, MessageCircle, Pen, Volume2, Eye, Sparkles, AlertTriangle, Globe } from 'lucide-react';

interface LessonPlayerProps {
  lessonId: string;
}

type Phase = 'intro' | 'teach' | 'practice' | 'exercises' | 'results';

export function LessonPlayer({ lessonId }: LessonPlayerProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teachStep, setTeachStep] = useState(0);
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle()
      .then(({ data }) => {
        if (data) { setLesson(data as Lesson); setTotalQuestions(data.content.exercises.length); }
        setLoading(false);
      });
  }, [lessonId]);

  const handleStart = () => { setPhase('teach'); setStartTime(Date.now()); setTeachStep(0); };
  const handleStartPractice = () => { setPhase('practice'); setPracticeStep(0); setPracticeAnswers({}); };
  const handleStartExercises = () => { setPhase('exercises'); };

  const handleAnswer = useCallback((correct: boolean) => {
    setIsCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, correct]);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setShowFeedback(false);
      if (lesson && currentExercise < lesson.content.exercises.length - 1) {
        setCurrentExercise(c => c + 1);
      } else {
        setPhase('results');
      }
    }, 1500);
  }, [currentExercise, lesson]);

  const handleComplete = async () => {
    if (!user || !lesson) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const xpEarned = Math.floor(lesson.xp_reward * (score / totalQuestions));
    const today = new Date().toISOString().split('T')[0];

    const { data: existingProgress } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle();
    if (existingProgress) {
      await supabase.from('lesson_progress').update({
        status: 'completed', score: xpEarned, best_score: Math.max(existingProgress.best_score, xpEarned),
        attempts: existingProgress.attempts + 1, last_attempt_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      }).eq('id', existingProgress.id);
    } else {
      await supabase.from('lesson_progress').insert({
        user_id: user.id, lesson_id: lesson.id, status: 'completed', score: xpEarned, best_score: xpEarned,
        attempts: 1, last_attempt_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      });
    }

    const { data: existingActivity } = await supabase.from('daily_activity').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
    if (existingActivity) {
      await supabase.from('daily_activity').update({
        xp_earned: existingActivity.xp_earned + xpEarned, lessons_completed: existingActivity.lessons_completed + 1,
        time_spent_seconds: existingActivity.time_spent_seconds + timeSpent,
      }).eq('id', existingActivity.id);
    } else {
      await supabase.from('daily_activity').insert({
        user_id: user.id, date: today, xp_earned: xpEarned, lessons_completed: 1, time_spent_seconds: timeSpent,
      });
    }

    const newStreak = isNewDay(profile?.last_lesson_at || null) ? (profile?.streak_count || 0) + 1 : profile?.streak_count || 0;
    await supabase.from('profiles').update({
      xp: (profile?.xp || 0) + xpEarned, total_xp_earned: (profile?.total_xp_earned || 0) + xpEarned,
      total_lessons_completed: (profile?.total_lessons_completed || 0) + 1, streak_count: newStreak,
      longest_streak: Math.max(newStreak, profile?.longest_streak || 0), last_lesson_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    navigate('/');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!lesson) return <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400">Leccion no encontrada</p><button onClick={() => navigate('/learn')} className="mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">Volver a lecciones</button></div>;

  const content = lesson.content as LessonContent;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const xpEarned = Math.floor(lesson.xp_reward * (score / totalQuestions));
  const teachSteps = buildTeachSteps(content, lesson);
  const practiceSteps = buildPracticeSteps(content);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/learn')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.description}</p>
        </div>
      </div>

      {phase !== 'intro' && phase !== 'results' && (
        <div className="flex items-center gap-2">
          {(['teach', 'practice', 'exercises'] as Phase[]).map(p => (
            <div key={p} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                phase === p ? 'bg-emerald-500' :
                (['teach', 'practice', 'exercises'].indexOf(phase) > ['teach', 'practice', 'exercises'].indexOf(p)) ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              <span className={`text-[10px] font-medium ${phase === p ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                {p === 'teach' ? 'Aprender' : p === 'practice' ? 'Practicar' : 'Examen'}
              </span>
            </div>
          ))}
        </div>
      )}

      {phase === 'intro' && (
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{lesson.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{lesson.description}</p>
          </div>

          {lesson.teacher_note && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">Consejo del profe</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.teacher_note}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{teachSteps.length} pasos</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">para aprender</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-800">
              <Pen className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{practiceSteps.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">practicas</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{content.exercises.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ejercicios</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Lo que vas a aprender</h3>
            <ul className="space-y-2">
              {content.examples.slice(0, 4).map((ex, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{ex.english}</span>
                    <span className="text-gray-400 mx-1">—</span>
                    <span className="text-gray-600 dark:text-gray-400">{ex.translation}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={handleStart} className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
            Empezar a aprender <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {phase === 'teach' && teachSteps[teachStep] && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {teachSteps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= teachStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>

          <TeachStepRenderer step={teachSteps[teachStep]} stepIndex={teachStep} totalSteps={teachSteps.length} />

          <div className="flex gap-3">
            {teachStep > 0 && (
              <button onClick={() => setTeachStep(s => s - 1)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Atras</button>
            )}
            {teachStep < teachSteps.length - 1 ? (
              <button onClick={() => setTeachStep(s => s + 1)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">Siguiente <ArrowRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={handleStartPractice} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">Practicar <Pen className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      )}

      {phase === 'practice' && practiceSteps[practiceStep] && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {practiceSteps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= practiceStep ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>

          <PracticeStepComponent step={practiceSteps[practiceStep]} stepIndex={practiceStep} totalSteps={practiceSteps.length} isAnswered={practiceAnswers[practiceStep] !== undefined} isCorrect={practiceAnswers[practiceStep] === true} onAnswer={(correct) => { setPracticeAnswers(prev => ({ ...prev, [practiceStep]: correct })); }} />

          {practiceAnswers[practiceStep] !== undefined && (
            <div className="flex gap-3">
              {practiceStep > 0 && <button onClick={() => setPracticeStep(s => s - 1)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Atras</button>}
              {practiceStep < practiceSteps.length - 1 ? (
                <button onClick={() => setPracticeStep(s => s + 1)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">Siguiente <ArrowRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={handleStartExercises} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">Hacer el examen <Zap className="w-4 h-4" /></button>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'exercises' && content.exercises[currentExercise] && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Ejercicio {currentExercise + 1} de {content.exercises.length}</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${((currentExercise + 1) / content.exercises.length) * 100}%` }} />
            </div>
          </div>
          <ExerciseRenderer exercise={content.exercises[currentExercise]} onAnswer={handleAnswer} showFeedback={showFeedback} disabled={showFeedback} />
          {showFeedback && (
            <div className="fixed inset-x-0 bottom-24 flex items-center justify-center z-40 pointer-events-none">
              <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold text-white ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {isCorrect ? <><Check className="w-5 h-5" /> Correcto!</> : <><X className="w-5 h-5" /> Casi!</>}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'results' && (
        <div className="space-y-8 py-4">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <Star className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leccion completada!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Sacaste {score} de {totalQuestions}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Zap className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">+{xpEarned}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">XP ganados</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Precision</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{score}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Correctas</div>
            </div>
          </div>

          {(lesson.common_mistake || lesson.pronunciation_tip || lesson.cultural_tip) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notas extra de tu profe</h3>
              {lesson.common_mistake && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="font-semibold text-red-700 dark:text-red-300 text-sm">Error comun</span></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.common_mistake}</p>
                </div>
              )}
              {lesson.pronunciation_tip && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2"><Volume2 className="w-4 h-4 text-blue-500" /><span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Pronunciacion</span></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.pronunciation_tip}</p>
                </div>
              )}
              {lesson.cultural_tip && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-amber-500" /><span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Nota cultural</span></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.cultural_tip}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revision de respuestas</h3>
            <div className="space-y-3">
              {answers.map((correct, i) => {
                const ex = content.exercises[i];
                return (
                  <div key={i} className={`p-3 rounded-xl border ${correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {correct ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <X className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {ex.type === 'multiple_choice' ? ex.question : ex.type === 'fill_blank' ? ex.sentence.replace('___', ex.answer) : 'Ejercicio de emparejamiento'}
                      </span>
                    </div>
                    {!correct && <p className="text-xs text-red-600 dark:text-red-400 ml-6">Respuesta correcta: {ex.type === 'multiple_choice' ? ex.options[ex.correct] : ex.type === 'fill_blank' ? ex.answer : 'Ver pares'}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleComplete} className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">Continuar</button>
        </div>
      )}
    </div>
  );
}

type TeachStep = {
  type: 'explanation' | 'passage' | 'examples' | 'summary' | 'mistake' | 'pronunciation' | 'culture';
  title: string;
  content?: string;
  examples?: { english: string; translation: string; note?: string }[];
  icon: string;
  highlight?: boolean;
};

function buildTeachSteps(content: LessonContent, lesson: Lesson): TeachStep[] {
  const steps: TeachStep[] = [];

  steps.push({ type: 'explanation', title: 'La idea principal', content: content.explanation, icon: 'lightbulb', highlight: true });

  if (content.passage) {
    steps.push({ type: 'passage', title: 'Lee y comprende', content: content.passage, icon: 'eye' });
  }

  const exampleGroups = chunkArray(content.examples, 3);
  exampleGroups.forEach((group, i) => {
    steps.push({ type: 'examples', title: i === 0 ? 'Ejemplos clave' : `Mas ejemplos (${i + 1})`, examples: group, icon: 'message', highlight: i === 0 });
  });

  if (lesson.common_mistake) {
    steps.push({ type: 'mistake', title: 'Cuidado!', content: lesson.common_mistake, icon: 'alert' });
  }

  if (lesson.pronunciation_tip) {
    steps.push({ type: 'pronunciation', title: 'Como se pronuncia', content: lesson.pronunciation_tip, icon: 'volume' });
  }

  if (lesson.cultural_tip) {
    steps.push({ type: 'culture', title: 'Nota cultural', content: lesson.cultural_tip, icon: 'globe' });
  }

  steps.push({ type: 'summary', title: 'Recuerda esto', content: generateSummary(content, lesson), icon: 'sparkles' });

  return steps;
}

function generateSummary(content: LessonContent, lesson: Lesson): string {
  const typeSummaries: Record<string, string> = {
    vocabulary: `Acabas de aprender ${content.examples.length} palabras/frases nuevas. La clave para recordar vocabulario es usarlo en contexto. Intenta hacer tus propias oraciones con estas palabras!`,
    grammar: `Este patron gramatical es esencial para un ingles natural. La regla clave: presta atencion a como cambia el verbo. La practica hace al maestro — cuanto mas lo uses, mas natural se sentira.`,
    phrases: `Estas frases se usan todos los dias por los hablantes de ingles. Memorizar frases completas (no solo palabras individuales) te hara sonar mucho mas natural y seguro.`,
    reading: `La comprension lectora mejora con la practica. Cuando encuentres palabras desconocidas, intenta adivinar su significado por el contexto antes de buscarlas.`,
    listening: `Las habilidades de escucha se desarrollan con exposicion. Enfocate en entender la idea principal primero, luego los detalles.`,
  };
  return typeSummaries[lesson.lesson_type] || 'Excelente trabajo aprendiendo este material! Sigue practicando para que se te pegue.';
}

function buildPracticeSteps(content: LessonContent): PracticeStep[] {
  return content.examples.slice(0, 4).map(ex => ({
    type: 'recall' as const,
    prompt: `Como se dice "${ex.translation}" en ingles?`,
    answer: ex.english,
    hint: `Empieza con "${ex.english[0]}"`,
  }));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function TeachStepRenderer({ step, stepIndex, totalSteps }: { step: TeachStep; stepIndex: number; totalSteps: number }) {
  const iconMap: Record<string, any> = { lightbulb: Lightbulb, eye: Eye, message: MessageCircle, sparkles: Sparkles, alert: AlertTriangle, volume: Volume2, globe: Globe };
  const Icon = iconMap[step.icon] || BookOpen;
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    mistake: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    pronunciation: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    culture: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  };
  const colors = colorMap[step.type] || { bg: '', text: '', border: '' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>Paso {stepIndex + 1} de {totalSteps}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.highlight ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20' : step.type === 'mistake' ? 'bg-red-100 dark:bg-red-900/30' : step.type === 'pronunciation' ? 'bg-blue-100 dark:bg-blue-900/30' : step.type === 'culture' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
          <Icon className={`w-5 h-5 ${step.highlight ? 'text-white' : step.type === 'mistake' ? 'text-red-600 dark:text-red-400' : step.type === 'pronunciation' ? 'text-blue-600 dark:text-blue-400' : step.type === 'culture' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{step.title}</h2>
      </div>

      {step.type === 'explanation' && step.content && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {step.type === 'passage' && step.content && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400"><Volume2 className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">Lee con atencion</span></div>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base italic">{step.content}</p>
        </div>
      )}

      {step.type === 'examples' && step.examples && (
        <div className="space-y-3">
          {step.examples.map((ex, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{ex.english}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{ex.translation}</div>
                  {ex.note && <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1.5 inline-block">{ex.note}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(step.type === 'mistake' || step.type === 'pronunciation' || step.type === 'culture') && step.content && (
        <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {step.type === 'summary' && step.content && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><span className="font-semibold text-emerald-700 dark:text-emerald-300">Punto clave</span></div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}
    </div>
  );
}

type PracticeStep = { type: 'recall'; prompt: string; answer: string; hint: string };

function PracticeStepComponent({ step, stepIndex, totalSteps, isAnswered, isCorrect, onAnswer }: {
  step: PracticeStep; stepIndex: number; totalSteps: number; isAnswered: boolean; isCorrect: boolean; onAnswer: (correct: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const handleSubmit = () => { if (!input.trim()) return; onAnswer(input.trim().toLowerCase() === step.answer.toLowerCase()); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium"><Pen className="w-4 h-4" /><span>Practica {stepIndex + 1} de {totalSteps}</span></div>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.prompt}</h3>
        {!isAnswered && <p className="text-sm text-amber-600 dark:text-amber-400">Pista: {step.hint}</p>}
      </div>
      {!isAnswered ? (
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Escribe tu respuesta..." className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg" autoFocus />
          <button onClick={handleSubmit} disabled={!input.trim()} className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50">Verificar</button>
        </div>
      ) : (
        <div className={`rounded-xl p-5 border-2 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-5 h-5 text-red-600 dark:text-red-400" />}
            <span className={`font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{isCorrect ? 'Correcto!' : 'Casi!'}</span>
          </div>
          {!isCorrect && <p className="text-sm text-gray-700 dark:text-gray-300">La respuesta correcta es: <strong className="text-emerald-600 dark:text-emerald-400">{step.answer}</strong></p>}
        </div>
      )}
    </div>
  );
}

function ExerciseRenderer({ exercise, onAnswer, showFeedback, disabled }: { exercise: Exercise; onAnswer: (correct: boolean) => void; showFeedback: boolean; disabled: boolean }) {
  switch (exercise.type) {
    case 'multiple_choice': return <MultipleChoiceExerciseComponent exercise={exercise} onAnswer={onAnswer} showFeedback={showFeedback} disabled={disabled} />;
    case 'fill_blank': return <FillBlankExerciseComponent exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    case 'matching': return <MatchingExerciseComponent exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    default: return null;
  }
}

function MultipleChoiceExerciseComponent({ exercise, onAnswer, showFeedback, disabled }: { exercise: MultipleChoiceExercise; onAnswer: (correct: boolean) => void; showFeedback: boolean; disabled: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleClick = (idx: number) => { if (disabled) return; setSelected(idx); onAnswer(idx === exercise.correct); };
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Elige la respuesta correcta</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{exercise.question}</h3>
      </div>
      <div className="space-y-2">
        {exercise.options.map((opt, idx) => {
          let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500';
          if (showFeedback && selected !== null) {
            if (idx === exercise.correct) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300';
            else if (idx === selected) btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300';
            else btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
          }
          return <button key={idx} onClick={() => handleClick(idx)} disabled={disabled} className={`w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white transition-all text-base ${btnClass}`}><span className="inline-flex items-center gap-3"><span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">{String.fromCharCode(65 + idx)}</span>{opt}</span></button>;
        })}
      </div>
    </div>
  );
}

function FillBlankExerciseComponent({ exercise, onAnswer, disabled }: { exercise: FillBlankExercise; onAnswer: (correct: boolean) => void; disabled: boolean }) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const handleSubmit = () => { if (disabled || !input.trim()) return; const correct = input.trim().toLowerCase() === exercise.answer.toLowerCase(); setIsCorrect(correct); setSubmitted(true); onAnswer(correct); };
  const parts = exercise.sentence.split('___');
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Completa el espacio</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{parts[0]}<span className={`inline-block min-w-[100px] border-b-2 mx-1 pb-0.5 text-center text-xl ${submitted ? (isCorrect ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-red-500 text-red-600 dark:text-red-400') : 'border-gray-300 dark:border-gray-600'}`}>{submitted ? exercise.answer : input || '\u00A0'}</span>{parts[1]}</h3>
        {exercise.hint && <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Pista: {exercise.hint}</p>}
      </div>
      {!submitted && <div className="flex gap-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Escribe tu respuesta..." disabled={disabled} className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg" autoFocus /><button onClick={handleSubmit} disabled={disabled || !input.trim()} className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">Verificar</button></div>}
      {submitted && !isCorrect && <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"><strong>Respuesta correcta:</strong> {exercise.answer}</div>}
    </div>
  );
}

function MatchingExerciseComponent({ exercise, onAnswer, disabled }: { exercise: MatchingExerciseType; onAnswer: (correct: boolean) => void; disabled: boolean }) {
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [rightMatched, setRightMatched] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const shuffledRight = exercise.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);
  const handleLeftClick = (idx: number) => { if (disabled || submitted) return; setLeftSelected(idx); };
  const handleRightClick = (rightIdx: number) => {
    if (disabled || submitted || leftSelected === null) return;
    const actualRightIdx = shuffledRight[rightIdx];
    const newMatches = { ...matches };
    Object.keys(newMatches).forEach(k => { if (newMatches[Number(k)] === actualRightIdx) delete newMatches[Number(k)]; });
    newMatches[leftSelected] = actualRightIdx;
    setMatches(newMatches);
    setRightMatched(prev => new Set([...prev, actualRightIdx]));
    setLeftSelected(null);
    if (Object.keys(newMatches).length === exercise.pairs.length) { setSubmitted(true); onAnswer(exercise.pairs.every((_, i) => newMatches[i] === i)); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Empareja los pares</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Conecta cada palabra con su traduccion</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Ingles</div>
          {exercise.pairs.map((pair, i) => (<button key={`l-${i}`} onClick={() => handleLeftClick(i)} disabled={disabled || submitted} className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all ${leftSelected === i ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300' : matches[i] !== undefined ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-emerald-300'}`}>{pair[0]}</button>))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Traduccion</div>
          {shuffledRight.map((actualIdx, displayIdx) => (<button key={`r-${displayIdx}`} onClick={() => handleRightClick(displayIdx)} disabled={disabled || submitted || leftSelected === null} className={`w-full p-3 rounded-xl text-sm font-medium text-right transition-all ${rightMatched.has(actualIdx) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 opacity-60' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-emerald-300'}`}>{exercise.pairs[actualIdx][1]}</button>))}
        </div>
      </div>
      {submitted && <div className="space-y-1">{exercise.pairs.map((pair, i) => { const isMatchCorrect = matches[i] === i; return <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${isMatchCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{isMatchCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}<span>{pair[0]} = {pair[1]}</span></div>; })}</div>}
    </div>
  );
}

function isNewDay(lastLessonAt: string | null): boolean {
  if (!lastLessonAt) return true;
  return new Date(lastLessonAt).toDateString() !== new Date().toDateString();
}
