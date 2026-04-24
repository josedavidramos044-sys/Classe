import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { CefrLevel } from '../lib/types';
import { CEFR_LABELS } from '../lib/types';
import { ArrowRight, Globe, GraduationCap, Target, Sparkles } from 'lucide-react';

const ASSESSMENT_QUESTIONS = [
  { question: 'Como se dice "Hola" en ingles?', options: ['Goodbye', 'Hello', 'Thanks', 'Please'], correct: 1, level: 'A0' },
  { question: 'Completa: "She ___ a student."', options: ['am', 'is', 'are', 'be'], correct: 1, level: 'A0' },
  { question: 'Que significa "I worked yesterday"?', options: ['Voy a trabajar manana', 'Trabaje en el pasado', 'Estoy trabajando ahora', 'Quiero trabajar'], correct: 1, level: 'A1' },
  { question: 'Cual es correcto? "If it rains, I ___ stay home."', options: ['would', 'will', 'had', 'was'], correct: 1, level: 'A2' },
  { question: 'Que expresa "I have visited Paris"?', options: ['Plan futuro', 'Presente perfecto', 'Pasado simple', 'Futuro perfecto'], correct: 1, level: 'B1' },
  { question: '"If I were rich, I would travel" es un ejemplo de:', options: ['Primer condicional', 'Segundo condicional', 'Tercer condicional', 'Condicional cero'], correct: 1, level: 'B2' },
  { question: '"Never have I seen such beauty" usa:', options: ['Voz pasiva', 'Inversion', 'Estilo indirecto', 'Subjuntivo'], correct: 1, level: 'C1' },
];

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [, setSelectedGoal] = useState('');
  const [selectedMotivation, setSelectedMotivation] = useState('');
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);

  const goals = [
    { id: 'travel', label: 'Viajar', icon: Globe, desc: 'Comunicarme al viajar' },
    { id: 'career', label: 'Carrera', icon: GraduationCap, desc: 'Avanzar profesionalmente' },
    { id: 'exam', label: 'Examen', icon: Target, desc: 'Pasar un examen de ingles' },
    { id: 'fun', label: 'Por diversion', icon: Sparkles, desc: 'Aprender algo nuevo' },
  ];

  const motivations = ['5 minutos', '10 minutos', '15 minutos', '30 minutos'];

  const handleAssessmentAnswer = (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    const question = ASSESSMENT_QUESTIONS[assessmentIndex];
    if (idx === question.correct) setCorrectCount(c => c + 1);
    setTimeout(() => {
      if (assessmentIndex < ASSESSMENT_QUESTIONS.length - 1) {
        setAssessmentIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setStep(3);
      }
    }, 1000);
  };

  const determineLevel = (): CefrLevel => {
    if (correctCount <= 1) return 'A0';
    if (correctCount <= 2) return 'A1';
    if (correctCount <= 3) return 'A2';
    if (correctCount <= 4) return 'B1';
    if (correctCount <= 5) return 'B2';
    return 'C1';
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    const level = determineLevel();
    const dailyGoal = selectedMotivation === '5 minutos' ? 30 : selectedMotivation === '10 minutos' ? 50 : selectedMotivation === '15 minutos' ? 80 : 100;
    await supabase.from('profiles').update({ cefr_level: level, daily_goal: dailyGoal, onboarding_completed: true }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    navigate('/');
  };

  if (!profile) return null;

  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Bienvenido a LinguaLeap!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Vamos a configurar tu aprendizaje en solo unos pasos.</p>
          <button onClick={() => setStep(1)} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
            Vamos! <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cual es tu meta?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Esto nos ayuda a personalizar tu experiencia</p>
          </div>
          <div className="space-y-3">
            {goals.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} onClick={() => { setSelectedGoal(id); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const q = ASSESSMENT_QUESTIONS[assessmentIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Pregunta {assessmentIndex + 1} de {ASSESSMENT_QUESTIONS.length}</span>
              <span>{Math.round(((assessmentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${((assessmentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500';
              if (showResult) {
                if (idx === q.correct) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500';
                else if (idx === selectedAnswer && idx !== q.correct) btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500';
                else btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
              }
              return (
                <button key={idx} onClick={() => handleAssessmentAnswer(idx)} disabled={showResult} className={`w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white transition-all ${btnClass}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const level = determineLevel();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
          <span className="text-white font-bold text-2xl">{level}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tu nivel: {CEFR_LABELS[level]}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Acertaste {correctCount} de {ASSESSMENT_QUESTIONS.length}!</p>
        <div className="text-left mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Cuanto tiempo por dia?</h3>
          <div className="grid grid-cols-2 gap-3">
            {motivations.map(m => (
              <button key={m} onClick={() => setSelectedMotivation(m)} className={`p-3 rounded-xl border-2 transition-all font-medium ${selectedMotivation === m ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-300'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleComplete} disabled={!selectedMotivation || saving} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Empezar a aprender <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
