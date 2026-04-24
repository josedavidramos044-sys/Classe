import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Lesson, LessonContent, Exercise, MultipleChoiceExercise, FillBlankExercise, MatchingExercise as MatchingExerciseType } from '../lib/types';
import { ArrowLeft, ArrowRight, Check, X, Star, Zap, BookOpen, Lightbulb, MessageCircle, Pen, Volume2, Eye, Sparkles, AlertTriangle, Globe, Languages, PenTool, HelpCircle, ArrowRightLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonPlayerProps {
  lessonId: string;
}

type Phase = 'intro' | 'teach' | 'practice' | 'exercises' | 'results';

type TeachStepType =
  | 'explanation'
  | 'passage'
  | 'examples'
  | 'summary'
  | 'mistake'
  | 'pronunciation'
  | 'culture'
  | 'comparison'
  | 'try_yourself'
  | 'dialog'
  | 'tip'
  | 'practice_hint';

interface TeachStep {
  type: TeachStepType;
  title: string;
  content?: string;
  examples?: { english: string; translation: string; note?: string }[];
  icon: string;
  highlight?: boolean;
}

type PracticeType = 'recall' | 'choose' | 'reverse';

interface PracticeStep {
  type: PracticeType;
  prompt: string;
  answer: string;
  hint: string;
  options?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function isNewDay(lastLessonAt: string | null): boolean {
  if (!lastLessonAt) return true;
  return new Date(lastLessonAt).toDateString() !== new Date().toDateString();
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function getMotivationalMessage(percentage: number): string {
  if (percentage === 100) return 'Perfecto! Eres un crack del ingles!';
  if (percentage >= 90) return 'Increible! Casi perfecto, sigue asi!';
  if (percentage >= 75) return 'Muy bien! Vas por muy buen camino!';
  if (percentage >= 50) return 'Buen trabajo! Con practica lo dominaras!';
  if (percentage >= 25) return 'Vas mejorando! Repasar te ayudara mucho!';
  return 'No te rindas! Cada intento te acerca mas al objetivo!';
}

// ---------------------------------------------------------------------------
// Build teach steps — rich, long, diversified
// ---------------------------------------------------------------------------

function buildTeachSteps(content: LessonContent, lesson: Lesson): TeachStep[] {
  const steps: TeachStep[] = [];

  // 1. Explanation — split into 2-3 chunks if long
  const explanationChunks = splitExplanation(content.explanation);
  explanationChunks.forEach((chunk, i) => {
    steps.push({
      type: 'explanation',
      title: explanationChunks.length > 1
        ? (i === 0 ? 'La idea principal' : `Continuacion (${i + 1})`)
        : 'La idea principal',
      content: chunk,
      icon: 'lightbulb',
      highlight: i === 0,
    });
  });

  // 2. Passage
  if (content.passage) {
    steps.push({ type: 'passage', title: 'Lee y comprende', content: content.passage, icon: 'eye' });
  }

  // 3. Examples — groups of 2
  const exampleGroups = chunkArray(content.examples, 2);
  exampleGroups.forEach((group, i) => {
    steps.push({
      type: 'examples',
      title: i === 0 ? 'Ejemplos clave' : `Mas ejemplos (${i + 1})`,
      examples: group,
      icon: 'message',
      highlight: i === 0,
    });
  });

  // 4. Try-yourself for each example group
  exampleGroups.forEach((group, i) => {
    steps.push({
      type: 'try_yourself',
      title: i === 0 ? 'Prueba tu mismo!' : `Prueba tu mismo (${i + 1})`,
      examples: group,
      icon: 'eye',
      highlight: false,
    });
  });

  // 5. Comparison — English vs Spanish
  steps.push({
    type: 'comparison',
    title: 'Ingles vs Espanol',
    content: generateComparison(content, lesson),
    icon: 'arrowrightleft',
    highlight: false,
  });

  // 6. Dialog
  steps.push({
    type: 'dialog',
    title: 'En conversacion',
    content: generateDialog(content),
    icon: 'messagecircle',
    highlight: false,
  });

  // 7. Common mistake
  if (lesson.common_mistake) {
    steps.push({ type: 'mistake', title: 'Cuidado con esto!', content: lesson.common_mistake, icon: 'alert' });
  }

  // 8. Pronunciation tip
  if (lesson.pronunciation_tip) {
    steps.push({ type: 'pronunciation', title: 'Como se pronuncia', content: lesson.pronunciation_tip, icon: 'volume' });
  }

  // 9. Cultural tip
  if (lesson.cultural_tip) {
    steps.push({ type: 'culture', title: 'Nota cultural', content: lesson.cultural_tip, icon: 'globe' });
  }

  // 10. Extra teacher tip
  steps.push({
    type: 'tip',
    title: 'Consejo extra del profe',
    content: generateExtraTip(content, lesson),
    icon: 'helpcircle',
    highlight: false,
  });

  // 11. Summary
  steps.push({
    type: 'summary',
    title: 'Recuerda esto',
    content: generateSummary(content, lesson),
    icon: 'sparkles',
    highlight: false,
  });

  // 12. Practice hint — right before practice
  steps.push({
    type: 'practice_hint',
    title: 'Antes de practicar...',
    content: generatePracticeHint(content, lesson),
    icon: 'lightbulb',
    highlight: false,
  });

  return steps;
}

function splitExplanation(text: string): string[] {
  // Try splitting by double newline first
  const byParagraph = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (byParagraph.length > 1) {
    // If any paragraph is very long (>500 chars), split it further
    const result: string[] = [];
    for (const para of byParagraph) {
      if (para.length > 500) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let current = '';
        for (const sentence of sentences) {
          if ((current + sentence).length > 500 && current.length > 0) {
            result.push(current.trim());
            current = sentence;
          } else {
            current += sentence;
          }
        }
        if (current.trim()) result.push(current.trim());
      } else {
        result.push(para.trim());
      }
    }
    return result.slice(0, 3);
  }

  // No double newlines — split by sentences at ~500 char boundaries
  if (text.length <= 500) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > 500 && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.slice(0, 3);
}

function generateComparison(content: LessonContent, lesson: Lesson): string {
  const examples = content.examples.slice(0, 3);
  const lines = examples.map(ex =>
    `En espanol: "${ex.translation}"\nEn ingles: "${ex.english}"`
  );
  const intro: Record<string, string> = {
    vocabulary: 'Observa como se expresan las mismas ideas en ambos idiomas:',
    grammar: 'Fijate en la diferencia de estructura gramatical:',
    phrases: 'Mira como cambian las frases entre idiomas:',
    reading: 'Compara las expresiones clave:',
    listening: 'Compara como suenan las frases en ambos idiomas:',
  };
  return (intro[lesson.lesson_type] || 'Compara las expresiones:') + '\n\n' + lines.join('\n\n');
}

function generateDialog(content: LessonContent): string {
  const examples = content.examples.slice(0, 3);
  const speakers = ['Profe', 'Estudiante'];
  const lines: string[] = [];
  // Build a mini conversation using examples
  examples.forEach((ex) => {
    lines.push(`${speakers[0]}: Ahora intenta decir: "${ex.translation}"`);
    lines.push(`${speakers[1]}: ${ex.english}${ex.note ? ` (${ex.note})` : ''}`);
  });
  return 'Imagina esta conversacion en tu clase de ingles:\n\n' + lines.join('\n\n');
}

function generateExtraTip(_content: LessonContent, lesson: Lesson): string {
  const tips: Record<string, string> = {
    vocabulary: 'Una tecnica efectiva es crear tarjetas de vocabulario (flashcards) y repasarlas cada dia. La repeticion espaciada es la clave para recordar a largo plazo. Intenta usar cada palabra nueva en al menos 3 oraciones diferentes hoy.',
    grammar: 'Cuando aprendes gramatica, no solo memorices la regla — piensa en el significado. Cada estructura gramatical expresa una idea, y cuando entiendes la idea, la regla se vuelve natural. Practica con ejemplos de tu vida diaria.',
    phrases: 'Las frases hechas en ingles a menudo no se pueden traducir literalmente. La mejor estrategia es aprenderlas como bloques completos, como si fueran una sola palabra. Asi las recuerdas mas rapido y suenas mas natural.',
    reading: 'Cuando leas en ingles, no te detengas en cada palabra desconocida. Intenta captar la idea general primero, y solo busca las palabras que aparecen varias veces o que parecen esenciales para el significado.',
    listening: 'Para mejorar tu escucha, te recomiendo escuchar el mismo audio varias veces — la primera para entender la idea general, la segunda para captar detalles, y la tercera para notar la pronunciacion y entonacion.',
  };
  return tips[lesson.lesson_type] || 'La practica constante es la clave del exito. Dedica unos minutos cada dia y veras resultados sorprendentes.';
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

function generatePracticeHint(_content: LessonContent, lesson: Lesson): string {
  const hints: Record<string, string> = {
    vocabulary: 'En la practica vas a escribir, elegir y traducir. No te preocupes si no aciertas todo a la primera — equivocarse tambien es aprender! Si no recuerdas una palabra, usa la pista.',
    grammar: 'Ahora vas a practicar lo que aprendiste. Presta atencion a la estructura gramatical en cada ejercicio. Si te equivocas, revisa la explicacion de arriba.',
    phrases: 'A continuacion practicaras las frases que aprendiste. Intenta escribirlas correctamente — la ortografia importa en ingles! Pero no te estreses, lo importante es intentarlo.',
    reading: 'Es hora de practicar! Las preguntas estan basadas en lo que leiste. Si no recuerdas algo, piensa en el contexto del pasaje.',
    listening: 'Vamos a practicar! Recuerda que en ingles la pronunciacion puede ser diferente a como se escribe. Confia en lo que aprendiste.',
  };
  return hints[lesson.lesson_type] || 'Es hora de practicar! No te preocupes si no es perfecto — cada intento te hace mejor.';
}

// ---------------------------------------------------------------------------
// Build practice steps — all examples, 3 types
// ---------------------------------------------------------------------------

function buildPracticeSteps(content: LessonContent): PracticeStep[] {
  const steps: PracticeStep[] = [];
  const examples = content.examples.slice(0, 6);

  examples.forEach((ex, i) => {
    const typeIndex = i % 3;

    if (typeIndex === 0) {
      // recall — type the English
      steps.push({
        type: 'recall',
        prompt: `Como se dice "${ex.translation}" en ingles?`,
        answer: ex.english,
        hint: `Empieza con "${ex.english[0]}"`,
      });
    } else if (typeIndex === 1) {
      // choose — multiple choice
      const wrongOptions = content.examples
        .filter((_, j) => j !== i)
        .map(e => e.english)
        .slice(0, 3);
      // Pad if not enough wrong options
      while (wrongOptions.length < 3) {
        wrongOptions.push('_____');
      }
      const options = shuffleArray([ex.english, ...wrongOptions.slice(0, 3)]);
      steps.push({
        type: 'choose',
        prompt: `Cual es la traduccion correcta de "${ex.translation}"?`,
        answer: ex.english,
        hint: 'Elige la opcion correcta',
        options,
      });
    } else {
      // reverse — type the Spanish
      steps.push({
        type: 'reverse',
        prompt: `Como se dice "${ex.english}" en espanol?`,
        answer: ex.translation,
        hint: `Empieza con "${ex.translation[0]}"`,
      });
    }
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Icon mapping for teach steps
// ---------------------------------------------------------------------------

const TEACH_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lightbulb: Lightbulb,
  eye: Eye,
  message: MessageCircle,
  sparkles: Sparkles,
  alert: AlertTriangle,
  volume: Volume2,
  globe: Globe,
  arrowrightleft: ArrowRightLeft,
  messagecircle: MessageCircle,
  helpcircle: HelpCircle,
  languages: Languages,
  pentool: PenTool,
  bookopen: BookOpen,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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

  // Fetch lesson
  useEffect(() => {
    supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLesson(data as Lesson);
          setTotalQuestions(data.content.exercises.length);
        }
        setLoading(false);
      });
  }, [lessonId]);

  const handleStart = () => {
    setPhase('teach');
    setStartTime(Date.now());
    setTeachStep(0);
  };

  const handleStartPractice = () => {
    setPhase('practice');
    setPracticeStep(0);
    setPracticeAnswers({});
  };

  const handleStartExercises = () => {
    setPhase('exercises');
  };

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
    const xpEarned = Math.floor(lesson.xp_reward * (score / Math.max(totalQuestions, 1)));
    const today = new Date().toISOString().split('T')[0];

    // Save lesson progress
    const { data: existingProgress } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle();
    if (existingProgress) {
      await supabase.from('lesson_progress').update({
        status: 'completed',
        score: xpEarned,
        best_score: Math.max(existingProgress.best_score, xpEarned),
        attempts: existingProgress.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }).eq('id', existingProgress.id);
    } else {
      await supabase.from('lesson_progress').insert({
        user_id: user.id,
        lesson_id: lesson.id,
        status: 'completed',
        score: xpEarned,
        best_score: xpEarned,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    // Save daily activity
    const { data: existingActivity } = await supabase.from('daily_activity').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
    if (existingActivity) {
      await supabase.from('daily_activity').update({
        xp_earned: existingActivity.xp_earned + xpEarned,
        lessons_completed: existingActivity.lessons_completed + 1,
        time_spent_seconds: existingActivity.time_spent_seconds + timeSpent,
      }).eq('id', existingActivity.id);
    } else {
      await supabase.from('daily_activity').insert({
        user_id: user.id,
        date: today,
        xp_earned: xpEarned,
        lessons_completed: 1,
        time_spent_seconds: timeSpent,
      });
    }

    // Update profile
    const newStreak = isNewDay(profile?.last_lesson_at || null) ? (profile?.streak_count || 0) + 1 : profile?.streak_count || 0;
    await supabase.from('profiles').update({
      xp: (profile?.xp || 0) + xpEarned,
      total_xp_earned: (profile?.total_xp_earned || 0) + xpEarned,
      total_lessons_completed: (profile?.total_lessons_completed || 0) + 1,
      streak_count: newStreak,
      longest_streak: Math.max(newStreak, profile?.longest_streak || 0),
      last_lesson_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    navigate('/');
  };

  // Loading / not found states
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
  if (!lesson) return (
    <div className="text-center py-20">
      <p className="text-gray-500 dark:text-gray-400">Leccion no encontrada</p>
      <button onClick={() => navigate('/learn')} className="mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">Volver a lecciones</button>
    </div>
  );

  const content = lesson.content as LessonContent;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const xpEarned = Math.floor(lesson.xp_reward * (score / Math.max(totalQuestions, 1)));
  const teachSteps = buildTeachSteps(content, lesson);
  const practiceSteps = buildPracticeSteps(content);
  const timeSpent = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0;

  // XP breakdown for results
  const teachXp = Math.floor(lesson.xp_reward * 0.2);
  const practiceCorrectCount = Object.values(practiceAnswers).filter(Boolean).length;
  const practiceXp = Math.floor(lesson.xp_reward * 0.3 * (practiceCorrectCount / Math.max(practiceSteps.length, 1)));
  const exerciseXp = Math.floor(lesson.xp_reward * 0.5 * (score / Math.max(totalQuestions, 1)));

  // Phase progress bar indexes
  const phaseOrder: Phase[] = ['teach', 'practice', 'exercises'];
  const phaseStepCounts: Record<string, number> = {
    teach: teachSteps.length,
    practice: practiceSteps.length,
    exercises: content.exercises.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/learn')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.description}</p>
        </div>
      </div>

      {/* Phase progress bar */}
      {phase !== 'intro' && phase !== 'results' && (
        <div className="flex items-center gap-2">
          {phaseOrder.map(p => {
            const currentIdx = phaseOrder.indexOf(phase);
            const stepIdx = phaseOrder.indexOf(p);
            const isCurrent = phase === p;
            const isPast = currentIdx > stepIdx;
            const label = p === 'teach' ? 'Aprender' : p === 'practice' ? 'Practicar' : 'Examen';
            return (
              <div key={p} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  isCurrent ? 'bg-emerald-500' : isPast ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
                <span className={`text-[10px] font-medium ${
                  isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                }`}>
                  {label} ({phaseStepCounts[p]})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================== INTRO ============================== */}
      {phase === 'intro' && (
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{lesson.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{lesson.description}</p>
          </div>

          {/* Lesson type badge + estimated time */}
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <Languages className="w-4 h-4" />
              {lesson.lesson_type === 'vocabulary' ? 'Vocabulario' :
               lesson.lesson_type === 'grammar' ? 'Gramatica' :
               lesson.lesson_type === 'phrases' ? 'Frases' :
               lesson.lesson_type === 'reading' ? 'Lectura' : 'Escucha'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <Zap className="w-4 h-4" />
              {lesson.estimated_minutes} min
            </span>
          </div>

          {/* Teacher note */}
          {lesson.teacher_note && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">Consejo del profe</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.teacher_note}</p>
            </div>
          )}

          {/* Stats grid */}
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

          {/* What you'll master */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Lo que dominaras</h3>
            <ul className="space-y-2">
              {content.examples.slice(0, 6).map((ex, i) => (
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

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            Empezar a aprender <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ============================== TEACH ============================== */}
      {phase === 'teach' && teachSteps[teachStep] && (
        <div className="space-y-6">
          {/* Step progress dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {teachSteps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 min-w-[8px] rounded-full transition-all duration-300 ${
                i <= teachStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          <TeachStepRenderer step={teachSteps[teachStep]} stepIndex={teachStep} totalSteps={teachSteps.length} />

          <div className="flex gap-3">
            {teachStep > 0 && (
              <button
                onClick={() => setTeachStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Atras
              </button>
            )}
            {teachStep < teachSteps.length - 1 ? (
              <button
                onClick={() => setTeachStep(s => s + 1)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStartPractice}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                Practicar <Pen className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================== PRACTICE ============================== */}
      {phase === 'practice' && practiceSteps[practiceStep] && (
        <div className="space-y-6">
          {/* Practice progress */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {practiceSteps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 min-w-[8px] rounded-full transition-all duration-300 ${
                i < practiceStep ? 'bg-emerald-400' :
                i === practiceStep ? 'bg-amber-500' :
                'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          <PracticeStepComponent
            step={practiceSteps[practiceStep]}
            stepIndex={practiceStep}
            totalSteps={practiceSteps.length}
            isAnswered={practiceAnswers[practiceStep] !== undefined}
            isCorrect={practiceAnswers[practiceStep] === true}
            onAnswer={(correct) => {
              setPracticeAnswers(prev => ({ ...prev, [practiceStep]: correct }));
            }}
          />

          {practiceAnswers[practiceStep] !== undefined && (
            <div className="flex gap-3">
              {practiceStep > 0 && (
                <button
                  onClick={() => setPracticeStep(s => s - 1)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Atras
                </button>
              )}
              {practiceStep < practiceSteps.length - 1 ? (
                <button
                  onClick={() => setPracticeStep(s => s + 1)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleStartExercises}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  Hacer el examen <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================== EXERCISES ============================== */}
      {phase === 'exercises' && content.exercises[currentExercise] && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Ejercicio {currentExercise + 1} de {content.exercises.length}</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentExercise + 1) / content.exercises.length) * 100}%` }}
              />
            </div>
          </div>
          <ExerciseRenderer
            exercise={content.exercises[currentExercise]}
            onAnswer={handleAnswer}
            showFeedback={showFeedback}
            disabled={showFeedback}
          />
          {showFeedback && (
            <div className="fixed inset-x-0 bottom-24 flex items-center justify-center z-40 pointer-events-none">
              <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold text-white ${
                isCorrect ? 'bg-emerald-500' : 'bg-red-500'
              }`}>
                {isCorrect ? <><Check className="w-5 h-5" /> Correcto!</> : <><X className="w-5 h-5" /> Casi!</>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================== RESULTS ============================== */}
      {phase === 'results' && (
        <div className="space-y-8 py-4">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <Star className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leccion completada!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Sacaste {score} de {totalQuestions}</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-2">{getMotivationalMessage(percentage)}</p>
          </div>

          {/* Score stats */}
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

          {/* XP breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Desglose de XP</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span className="text-gray-600 dark:text-gray-400">Aprender (20%)</span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{teachXp} XP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Pen className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600 dark:text-gray-400">Practica — {practiceCorrectCount}/{practiceSteps.length} correctas (30%)</span>
                </div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">+{practiceXp} XP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Examen — {score}/{totalQuestions} correctas (50%)</span>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">+{exerciseXp} XP</span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-emerald-600 dark:text-emerald-400">+{teachXp + practiceXp + exerciseXp} XP</span>
              </div>
            </div>
          </div>

          {/* Time spent */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 font-medium">Tiempo invertido</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{formatTime(timeSpent)}</span>
            </div>
          </div>

          {/* Extra teacher notes */}
          {(lesson.common_mistake || lesson.pronunciation_tip || lesson.cultural_tip) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notas extra de tu profe</h3>
              {lesson.common_mistake && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-700 dark:text-red-300 text-sm">Error comun</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.common_mistake}</p>
                </div>
              )}
              {lesson.pronunciation_tip && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Pronunciacion</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.pronunciation_tip}</p>
                </div>
              )}
              {lesson.cultural_tip && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Nota cultural</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.cultural_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* Answer review */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revision de respuestas</h3>
            <div className="space-y-3">
              {answers.map((correct, i) => {
                const ex = content.exercises[i];
                return (
                  <div key={i} className={`p-3 rounded-xl border ${
                    correct
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {correct
                        ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      }
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {ex.type === 'multiple_choice' ? ex.question
                         : ex.type === 'fill_blank' ? ex.sentence.replace('___', ex.answer)
                         : 'Ejercicio de emparejamiento'}
                      </span>
                    </div>
                    {!correct && (
                      <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                        Respuesta correcta: {
                          ex.type === 'multiple_choice' ? ex.options[ex.correct]
                          : ex.type === 'fill_blank' ? ex.answer
                          : 'Ver pares'
                        }
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeachStepRenderer — handles all 12 step types
// ---------------------------------------------------------------------------

function TeachStepRenderer({ step, stepIndex, totalSteps }: {
  step: TeachStep;
  stepIndex: number;
  totalSteps: number;
}) {
  const Icon = TEACH_ICON_MAP[step.icon] || BookOpen;
  const [revealAnswer, setRevealAnswer] = useState(false);

  // Reset reveal when step changes
  useEffect(() => { setRevealAnswer(false); }, [stepIndex]);

  const iconBgClass = step.highlight
    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20'
    : step.type === 'mistake' ? 'bg-red-100 dark:bg-red-900/30'
    : step.type === 'pronunciation' ? 'bg-blue-100 dark:bg-blue-900/30'
    : step.type === 'culture' ? 'bg-amber-100 dark:bg-amber-900/30'
    : step.type === 'comparison' ? 'bg-teal-100 dark:bg-teal-900/30'
    : step.type === 'try_yourself' ? 'bg-green-100 dark:bg-green-900/30'
    : step.type === 'dialog' ? 'bg-slate-100 dark:bg-slate-700/50'
    : step.type === 'tip' ? 'bg-cyan-100 dark:bg-cyan-900/30'
    : step.type === 'practice_hint' ? 'bg-orange-100 dark:bg-orange-900/30'
    : 'bg-emerald-100 dark:bg-emerald-900/30';

  const iconTextClass = step.highlight
    ? 'text-white'
    : step.type === 'mistake' ? 'text-red-600 dark:text-red-400'
    : step.type === 'pronunciation' ? 'text-blue-600 dark:text-blue-400'
    : step.type === 'culture' ? 'text-amber-600 dark:text-amber-400'
    : step.type === 'comparison' ? 'text-teal-600 dark:text-teal-400'
    : step.type === 'try_yourself' ? 'text-green-600 dark:text-green-400'
    : step.type === 'dialog' ? 'text-slate-600 dark:text-slate-300'
    : step.type === 'tip' ? 'text-cyan-600 dark:text-cyan-400'
    : step.type === 'practice_hint' ? 'text-orange-600 dark:text-orange-400'
    : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>Paso {stepIndex + 1} de {totalSteps}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`w-5 h-5 ${iconTextClass}`} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{step.title}</h2>
      </div>

      {/* explanation */}
      {step.type === 'explanation' && step.content && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* passage */}
      {step.type === 'passage' && step.content && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Lee con atencion</span>
          </div>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base italic">{step.content}</p>
        </div>
      )}

      {/* examples */}
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
                  {ex.note && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1.5 inline-block">{ex.note}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* try_yourself — interactive reveal */}
      {step.type === 'try_yourself' && step.examples && (
        <div className="space-y-3">
          {step.examples.map((ex, i) => (
            <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Como se dice en ingles?</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{ex.translation}</div>
                  {revealAnswer ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-green-300 dark:border-green-700">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{ex.english}</div>
                      {ex.note && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ex.note}</div>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevealAnswer(true)}
                      className="px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Mostrar respuesta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* comparison — teal card */}
      {step.type === 'comparison' && step.content && (
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-teal-700 dark:text-teal-300">Comparacion</span>
          </div>
          {step.content.split('\n\n').map((line, i) => {
            const isEnEspanol = line.startsWith('En espanol:');
            const isEnIngles = line.startsWith('En ingles:');
            return (
              <div key={i} className={`mb-3 last:mb-0 ${isEnEspanol ? 'pl-4 border-l-3 border-slate-300 dark:border-slate-600' : isEnIngles ? 'pl-4 border-l-3 border-teal-400 dark:border-teal-600' : ''}`}>
                {isEnEspanol ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">En espanol: </span>
                    {line.replace('En espanol: ', '').replace(/"/g, '')}
                  </p>
                ) : isEnIngles ? (
                  <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                    <span className="font-semibold">En ingles: </span>
                    {line.replace('En ingles: ', '').replace(/"/g, '')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{line}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* dialog — slate/purple card */}
      {step.type === 'dialog' && step.content && (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Conversacion de ejemplo</span>
          </div>
          <div className="space-y-3">
            {step.content.split('\n\n').filter(l => l.includes(': ')).map((line, i) => {
              const colonIdx = line.indexOf(': ');
              const speaker = line.slice(0, colonIdx).trim();
              const text = line.slice(colonIdx + 2).trim();
              const isProfe = speaker === 'Profe';
              return (
                <div key={i} className={`flex gap-3 ${isProfe ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isProfe
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isProfe ? 'P' : 'E'}
                  </div>
                  <div className={`rounded-xl px-4 py-2.5 max-w-[85%] text-sm ${
                    isProfe
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-slate-200 dark:border-slate-600'
                  }`}>
                    {text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* mistake — red card */}
      {step.type === 'mistake' && step.content && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* pronunciation — blue card */}
      {step.type === 'pronunciation' && step.content && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* culture — amber card */}
      {step.type === 'culture' && step.content && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* tip — cyan card */}
      {step.type === 'tip' && step.content && (
        <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-cyan-700 dark:text-cyan-300 text-sm">Consejo del profe</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* summary — gradient card */}
      {step.type === 'summary' && step.content && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Punto clave</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}

      {/* practice_hint — orange card */}
      {step.type === 'practice_hint' && step.content && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-orange-700 dark:text-orange-300 text-sm">Preparado para practicar?</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{step.content}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PracticeStepComponent — handles recall, choose, reverse
// ---------------------------------------------------------------------------

function PracticeStepComponent({ step, stepIndex, totalSteps, isAnswered, isCorrect, onAnswer }: {
  step: PracticeStep;
  stepIndex: number;
  totalSteps: number;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [choseCorrect, setChoseCorrect] = useState(false);

  // Reset on step change
  useEffect(() => { setInput(''); setSelectedOption(null); setChoseCorrect(false); }, [stepIndex]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === step.answer.toLowerCase();
    onAnswer(correct);
  };

  const handleChoose = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    const correct = option === step.answer;
    setChoseCorrect(correct);
    onAnswer(correct);
  };

  const typeLabel = step.type === 'recall' ? 'Escribe' : step.type === 'choose' ? 'Elige' : 'Traduce';
  const typeColor = step.type === 'recall' ? 'text-amber-600 dark:text-amber-400' : step.type === 'choose' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
  const typeIcon = step.type === 'recall' ? Pen : step.type === 'choose' ? HelpCircle : Languages;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {(() => {
          const TypeIcon = typeIcon;
          return <TypeIcon className={`w-4 h-4 ${typeColor}`} />;
        })()}
        <span className={typeColor}>{typeLabel} — Practica {stepIndex + 1} de {totalSteps}</span>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.prompt}</h3>
        {!isAnswered && <p className="text-sm text-amber-600 dark:text-amber-400">Pista: {step.hint}</p>}
      </div>

      {/* recall / reverse — text input */}
      {(step.type === 'recall' || step.type === 'reverse') && !isAnswered && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Escribe tu respuesta..."
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Verificar
          </button>
        </div>
      )}

      {/* choose — multiple choice buttons */}
      {step.type === 'choose' && step.options && !isAnswered && (
        <div className="space-y-2">
          {step.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleChoose(opt)}
              className="w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-base"
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* choose — answered feedback */}
      {step.type === 'choose' && step.options && isAnswered && (
        <div className="space-y-2">
          {step.options.map((opt, idx) => {
            let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
            if (opt === step.answer) {
              btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300';
            } else if (opt === selectedOption && !choseCorrect) {
              btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300';
            }
            return (
              <button key={idx} disabled className={`w-full p-4 rounded-xl text-left font-medium transition-all text-base ${btnClass}`}>
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback for recall/reverse */}
      {(step.type === 'recall' || step.type === 'reverse') && isAnswered && (
        <div className={`rounded-xl p-5 border-2 ${
          isCorrect
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect
              ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              : <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            }
            <span className={`font-semibold ${
              isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {isCorrect ? 'Correcto!' : 'Casi!'}
            </span>
          </div>
          {!isCorrect && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              La respuesta correcta es: <strong className="text-emerald-600 dark:text-emerald-400">{step.answer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Feedback for choose when wrong */}
      {step.type === 'choose' && isAnswered && !choseCorrect && (
        <div className={`rounded-xl p-5 border-2 bg-red-50 dark:bg-red-900/20 border-red-500`}>
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-red-700 dark:text-red-300">Casi!</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            La respuesta correcta es: <strong className="text-emerald-600 dark:text-emerald-400">{step.answer}</strong>
          </p>
        </div>
      )}

      {/* Feedback for choose when correct */}
      {step.type === 'choose' && isAnswered && choseCorrect && (
        <div className={`rounded-xl p-5 border-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500`}>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Correcto!</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseRenderer (delegates to type-specific components)
// ---------------------------------------------------------------------------

function ExerciseRenderer({ exercise, onAnswer, showFeedback, disabled }: {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  showFeedback: boolean;
  disabled: boolean;
}) {
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoiceExerciseComponent exercise={exercise} onAnswer={onAnswer} showFeedback={showFeedback} disabled={disabled} />;
    case 'fill_blank':
      return <FillBlankExerciseComponent exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    case 'matching':
      return <MatchingExerciseComponent exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// MultipleChoiceExerciseComponent
// ---------------------------------------------------------------------------

function MultipleChoiceExerciseComponent({ exercise, onAnswer, showFeedback, disabled }: {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
  showFeedback: boolean;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (idx: number) => {
    if (disabled) return;
    setSelected(idx);
    onAnswer(idx === exercise.correct);
  };

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
          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={disabled}
              className={`w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white transition-all text-base ${btnClass}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FillBlankExerciseComponent
// ---------------------------------------------------------------------------

function FillBlankExerciseComponent({ exercise, onAnswer, disabled }: {
  exercise: FillBlankExercise;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (disabled || !input.trim()) return;
    const correct = input.trim().toLowerCase() === exercise.answer.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct);
  };

  const parts = exercise.sentence.split('___');

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Completa el espacio</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {parts[0]}
          <span className={`inline-block min-w-[100px] border-b-2 mx-1 pb-0.5 text-center text-xl ${
            submitted
              ? (isCorrect ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-red-500 text-red-600 dark:text-red-400')
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {submitted ? exercise.answer : input || '\u00A0'}
          </span>
          {parts[1]}
        </h3>
        {exercise.hint && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Pista: {exercise.hint}
          </p>
        )}
      </div>
      {!submitted && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Escribe tu respuesta..."
            disabled={disabled}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            Verificar
          </button>
        </div>
      )}
      {submitted && !isCorrect && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          <strong>Respuesta correcta:</strong> {exercise.answer}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MatchingExerciseComponent
// ---------------------------------------------------------------------------

function MatchingExerciseComponent({ exercise, onAnswer, disabled }: {
  exercise: MatchingExerciseType;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}) {
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [rightMatched, setRightMatched] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const shuffledRight = exercise.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);

  const handleLeftClick = (idx: number) => {
    if (disabled || submitted) return;
    setLeftSelected(idx);
  };

  const handleRightClick = (rightIdx: number) => {
    if (disabled || submitted || leftSelected === null) return;
    const actualRightIdx = shuffledRight[rightIdx];
    const newMatches = { ...matches };
    // Remove any existing match that points to this right item
    Object.keys(newMatches).forEach(k => {
      if (newMatches[Number(k)] === actualRightIdx) delete newMatches[Number(k)];
    });
    newMatches[leftSelected] = actualRightIdx;
    setMatches(newMatches);
    setRightMatched(prev => new Set([...prev, actualRightIdx]));
    setLeftSelected(null);
    if (Object.keys(newMatches).length === exercise.pairs.length) {
      setSubmitted(true);
      onAnswer(exercise.pairs.every((_, i) => newMatches[i] === i));
    }
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
          {exercise.pairs.map((pair, i) => (
            <button
              key={`l-${i}`}
              onClick={() => handleLeftClick(i)}
              disabled={disabled || submitted}
              className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all ${
                leftSelected === i
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : matches[i] !== undefined
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-emerald-300'
              }`}
            >
              {pair[0]}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Traduccion</div>
          {shuffledRight.map((actualIdx, displayIdx) => (
            <button
              key={`r-${displayIdx}`}
              onClick={() => handleRightClick(displayIdx)}
              disabled={disabled || submitted || leftSelected === null}
              className={`w-full p-3 rounded-xl text-sm font-medium text-right transition-all ${
                rightMatched.has(actualIdx)
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 opacity-60'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-emerald-300'
              }`}
            >
              {exercise.pairs[actualIdx][1]}
            </button>
          ))}
        </div>
      </div>
      {submitted && (
        <div className="space-y-1">
          {exercise.pairs.map((pair, i) => {
            const isMatchCorrect = matches[i] === i;
            return (
              <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                isMatchCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isMatchCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{pair[0]} = {pair[1]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
