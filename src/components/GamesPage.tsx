import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Shuffle, Zap, Brain, Trophy, Star, Flame } from 'lucide-react';

type GameType = 'menu' | 'matching' | 'memory' | 'speed-quiz';

const GAME_VOCAB = [
  { en: 'Hello', es: 'Hola' }, { en: 'Goodbye', es: 'Adios' }, { en: 'Please', es: 'Por favor' },
  { en: 'Thank you', es: 'Gracias' }, { en: 'Good morning', es: 'Buenos dias' }, { en: 'Friend', es: 'Amigo' },
  { en: 'Water', es: 'Agua' }, { en: 'Food', es: 'Comida' }, { en: 'House', es: 'Casa' },
  { en: 'Book', es: 'Libro' }, { en: 'School', es: 'Escuela' }, { en: 'Work', es: 'Trabajo' },
  { en: 'Family', es: 'Familia' }, { en: 'Time', es: 'Tiempo' }, { en: 'Day', es: 'Dia' },
  { en: 'Night', es: 'Noche' }, { en: 'Big', es: 'Grande' }, { en: 'Small', es: 'Pequeno' },
  { en: 'Happy', es: 'Feliz' }, { en: 'Sad', es: 'Triste' }, { en: 'Good', es: 'Bueno' },
  { en: 'Bad', es: 'Malo' }, { en: 'New', es: 'Nuevo' }, { en: 'Old', es: 'Viejo' },
  { en: 'Fast', es: 'Rapido' }, { en: 'Slow', es: 'Lento' }, { en: 'Hot', es: 'Caliente' },
  { en: 'Cold', es: 'Frio' }, { en: 'Beautiful', es: 'Hermoso' }, { en: 'Important', es: 'Importante' },
  { en: 'Because', es: 'Porque' }, { en: 'But', es: 'Pero' }, { en: 'Always', es: 'Siempre' },
  { en: 'Never', es: 'Nunca' }, { en: 'Sometimes', es: 'A veces' }, { en: 'Tomorrow', es: 'Manana' },
  { en: 'Yesterday', es: 'Ayer' }, { en: 'Today', es: 'Hoy' }, { en: 'Now', es: 'Ahora' },
  { en: 'Here', es: 'Aqui' }, { en: 'There', es: 'Alli' }, { en: 'Much', es: 'Mucho' },
  { en: 'Little', es: 'Poco' }, { en: 'Every', es: 'Cada' }, { en: 'World', es: 'Mundo' },
  { en: 'Money', es: 'Dinero' }, { en: 'City', es: 'Ciudad' }, { en: 'Country', es: 'Pais' },
  { en: 'Language', es: 'Idioma' }, { en: 'Question', es: 'Pregunta' }, { en: 'Answer', es: 'Respuesta' },
  { en: 'Problem', es: 'Problema' }, { en: 'Help', es: 'Ayuda' }, { en: 'Love', es: 'Amor' },
  { en: 'Life', es: 'Vida' }, { en: 'Heart', es: 'Corazon' }, { en: 'Dream', es: 'Sueno' },
  { en: 'Story', es: 'Historia' }, { en: 'Music', es: 'Musica' }, { en: 'Movie', es: 'Pelicula' },
];

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [xpEarned, setXpEarned] = useState(0);

  const handleGameComplete = useCallback((xp: number) => {
    setXpEarned(xp); setActiveGame('menu');
  }, []);

  const games = [
    { id: 'matching' as GameType, title: 'Conecta Palabras', desc: 'Conecta palabras en ingles con su traduccion', icon: Shuffle, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { id: 'memory' as GameType, title: 'Tarjetas de Memoria', desc: 'Encuentra los pares de memoria', icon: Brain, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { id: 'speed-quiz' as GameType, title: 'Quiz Relampago', desc: 'Responde lo mas rapido que puedas!', icon: Zap, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
  ];

  if (activeGame === 'matching') return <MatchingGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'speed-quiz') return <SpeedQuizGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Juegos</h1>
      {xpEarned > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">Ganaste +{xpEarned} XP en tu ultimo juego!</span>
        </div>
      )}
      <div className="space-y-3">
        {games.map(game => {
          const Icon = game.icon;
          return (
            <button key={game.id} onClick={() => setActiveGame(game.id)} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg ${game.shadow} group-hover:scale-105 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-lg">{game.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{game.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchingGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const [words, setWords] = useState<typeof GAME_VOCAB>([]);
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [rightMatched, setRightMatched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  useEffect(() => {
    const shuffled = [...GAME_VOCAB].sort(() => Math.random() - 0.5).slice(0, 8);
    setWords(shuffled);
  }, []);

  const shuffledRight = words.map((_, i) => i).sort(() => Math.random() - 0.5);

  const handleLeftClick = (idx: number) => { if (completed) return; setLeftSelected(idx); };

  const handleRightClick = (displayIdx: number) => {
    if (completed || leftSelected === null) return;
    const actualIdx = shuffledRight[displayIdx];
    if (leftSelected === actualIdx) {
      const newMatches = { ...matches, [leftSelected]: actualIdx };
      setMatches(newMatches);
      setRightMatched(prev => new Set([...prev, actualIdx]));
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo >= 3) { setShowCombo(true); setTimeout(() => setShowCombo(false), 800); }
      if (Object.keys(newMatches).length === words.length) {
        setCompleted(true);
        const timeBonus = Math.max(0, 60 - Math.floor((Date.now() - startTime) / 1000));
        const comboBonus = Math.floor(newCombo / 3) * 5;
        const xp = Math.max(5, 20 - errors + timeBonus + comboBonus);
        setTimeout(() => onComplete(xp), 1500);
      }
    } else {
      setErrors(e => e + 1);
      setCombo(0);
    }
    setLeftSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conecta Palabras</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {combo >= 2 && <div className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" /><span className="text-sm font-bold">x{combo}</span></div>}
          <div className="text-sm text-gray-500 dark:text-gray-400">Errores: {errors}</div>
        </div>
      </div>

      {showCombo && (
        <div className="text-center animate-bounce">
          <span className="text-2xl font-black text-orange-500">COMBO x{combo}!</span>
        </div>
      )}

      {completed && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <div className="font-bold text-emerald-700 dark:text-emerald-300">Todo conectado!</div>
          {combo >= 3 && <div className="text-sm text-orange-500 font-medium mt-1">Combo maximo: x{combo}!</div>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {words.map((w, i) => (
            <button key={`l-${i}`} onClick={() => handleLeftClick(i)} disabled={completed || matches[i] !== undefined} className={`w-full p-3 rounded-xl text-sm font-medium transition-all ${matches[i] !== undefined ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 opacity-60' : leftSelected === i ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300 scale-105' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-blue-300'}`}>{w.en}</button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledRight.map((actualIdx, displayIdx) => (
            <button key={`r-${displayIdx}`} onClick={() => handleRightClick(displayIdx)} disabled={completed || rightMatched.has(actualIdx) || leftSelected === null} className={`w-full p-3 rounded-xl text-sm font-medium transition-all ${rightMatched.has(actualIdx) ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 opacity-60' : leftSelected !== null ? 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-blue-300 hover:scale-105' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white'}`}>{words[actualIdx]?.es}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  type Card = { id: number; text: string; pairId: number; flipped: boolean; matched: boolean };
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [matchStreak, setMatchStreak] = useState(0);

  useEffect(() => {
    const pairs = [...GAME_VOCAB].sort(() => Math.random() - 0.5).slice(0, 8);
    const allCards: Card[] = [];
    pairs.forEach((p, i) => {
      allCards.push({ id: i * 2, text: p.en, pairId: i, flipped: false, matched: false });
      allCards.push({ id: i * 2 + 1, text: p.es, pairId: i, flipped: false, matched: false });
    });
    setCards(allCards.sort(() => Math.random() - 0.5));
  }, []);

  const handleFlip = (cardId: number) => {
    if (completed || flipped.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!);
      if (first.pairId === second.pairId) {
        const newStreak = matchStreak + 1;
        setMatchStreak(newStreak);
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true, flipped: true } : c));
          setFlipped([]);
          const allMatched = cards.every(c => c.pairId === first.pairId || c.matched || c.id === first.id || c.id === second.id);
          if (allMatched) {
            setCompleted(true);
            const timeBonus = Math.max(0, 120 - Math.floor((Date.now() - startTime) / 1000));
            const streakBonus = Math.floor(newStreak / 2) * 3;
            const xp = Math.max(5, 25 - moves + timeBonus + streakBonus);
            setTimeout(() => onComplete(xp), 1500);
          }
        }, 500);
      } else {
        setMatchStreak(0);
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 800);
      }
    }
  };

  const matchedCount = cards.filter(c => c.matched).length / 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tarjetas de Memoria</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {matchStreak >= 2 && <div className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" /><span className="text-sm font-bold">x{matchStreak}</span></div>}
          <div className="text-sm text-gray-500 dark:text-gray-400">{matchedCount}/{cards.length / 2}</div>
        </div>
      </div>

      {completed && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-800">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <div className="font-bold text-amber-700 dark:text-amber-300">Completado en {moves} movimientos!</div>
          {matchStreak >= 3 && <div className="text-sm text-orange-500 font-medium mt-1">Racha maxima: x{matchStreak}!</div>}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => (
          <button key={card.id} onClick={() => handleFlip(card.id)} disabled={card.flipped || card.matched || completed || flipped.length >= 2} className={`aspect-square rounded-xl text-xs font-medium flex items-center justify-center p-1.5 transition-all duration-300 ${card.matched ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 text-amber-700 dark:text-amber-300 scale-95' : card.flipped ? 'bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-600 text-gray-900 dark:text-white' : 'bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-amber-400 text-white hover:from-amber-600 hover:to-orange-600 hover:scale-105'}`}>
            {card.flipped || card.matched ? card.text : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeedQuizGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const questions = [
    { q: 'Como se dice "Hola" en ingles?', opts: ['Hello', 'Goodbye', 'Thanks', 'Please'], correct: 0 },
    { q: 'Que significa "agua" en ingles?', opts: ['Fire', 'Water', 'Earth', 'Air'], correct: 1 },
    { q: '"Amigo" en ingles es:', opts: ['Enemy', 'Teacher', 'Friend', 'Brother'], correct: 2 },
    { q: 'Como se dice "Gracias" en ingles?', opts: ['Sorry', 'Hello', 'Goodbye', 'Thank you'], correct: 3 },
    { q: 'Que es "libro" en ingles?', opts: ['Library', 'Book', 'Letter', 'Page'], correct: 1 },
    { q: '"Casa" en ingles significa:', opts: ['Car', 'House', 'Street', 'City'], correct: 1 },
    { q: 'Como se dice "Buenos dias" en ingles?', opts: ['Good night', 'Good morning', 'Goodbye', 'Good evening'], correct: 1 },
    { q: 'Que es "comida" en ingles?', opts: ['Drink', 'Food', 'Kitchen', 'Cook'], correct: 1 },
    { q: '"Familia" en ingles es:', opts: ['Friends', 'School', 'Family', 'Team'], correct: 2 },
    { q: 'Como se dice "Por favor" en ingles?', opts: ['Thank you', 'Sorry', 'Please', 'Hello'], correct: 2 },
    { q: 'Que significa "grande" en ingles?', opts: ['Small', 'Big', 'Tall', 'Long'], correct: 1 },
    { q: '"Rapido" en ingles es:', opts: ['Slow', 'Fast', 'Quick', 'Rapid'], correct: 1 },
    { q: 'Como se dice "hermoso" en ingles?', opts: ['Ugly', 'Beautiful', 'Nice', 'Good'], correct: 1 },
    { q: 'Que es "dinero" en ingles?', opts: ['Money', 'Cash', 'Coin', 'Bill'], correct: 0 },
    { q: '"Sueno" en ingles significa:', opts: ['Sleep', 'Dream', 'Night', 'Rest'], correct: 1 },
    { q: 'Como se dice "problema" en ingles?', opts: ['Problem', 'Question', 'Issue', 'Trouble'], correct: 0 },
    { q: 'Que significa "siempre" en ingles?', opts: ['Never', 'Sometimes', 'Always', 'Often'], correct: 2 },
    { q: '"Corazon" en ingles es:', opts: ['Heart', 'Love', 'Soul', 'Mind'], correct: 0 },
    { q: 'Como se dice "ayer" en ingles?', opts: ['Today', 'Tomorrow', 'Yesterday', 'Now'], correct: 2 },
    { q: 'Que es "idioma" en ingles?', opts: ['Word', 'Language', 'Speech', 'Talk'], correct: 1 },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 15);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { setGameState('ended'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleAnswer = (idx: number) => {
    if (gameState !== 'playing' || showFeedback) return;
    setSelected(idx); setShowFeedback(true);
    const isCorrect = idx === shuffledQuestions[currentQ].correct;
    if (isCorrect) {
      setScore(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setShowFeedback(false); setSelected(null);
      if (currentQ < shuffledQuestions.length - 1) setCurrentQ(q => q + 1);
      else setGameState('ended');
    }, 600);
  };

  const xp = Math.max(3, score * 3 + bestStreak * 2);

  if (gameState === 'ended') {
    return (
      <div className="space-y-6 text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Se acabo el tiempo!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Acertaste {score} de {shuffledQuestions.length}</p>
        </div>
        {bestStreak >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800 inline-block">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Flame className="w-5 h-5" /> Mejor racha: {bestStreak} seguidas!
            </div>
          </div>
        )}
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">+{xp} XP</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Volver a Juegos</button>
          <button onClick={() => onComplete(xp)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Reclamar XP</button>
        </div>
      </div>
    );
  }

  const q = shuffledQuestions[currentQ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quiz Relampago</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {streak >= 2 && <div className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" /><span className="text-sm font-bold">x{streak}</span></div>}
          <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>{timeLeft}s</div>
        </div>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} style={{ width: `${(timeLeft / 45) * 100}%` }} />
      </div>
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">Puntos: {score} | Pregunta {currentQ + 1}/{shuffledQuestions.length}</div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{q.q}</h3>
      </div>
      <div className="space-y-2">
        {q.opts.map((opt, idx) => {
          let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-500';
          if (showFeedback && selected !== null) {
            if (idx === q.correct) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300';
            else if (idx === selected) btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300';
            else btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
          }
          return <button key={idx} onClick={() => handleAnswer(idx)} disabled={showFeedback} className={`w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white transition-all ${btnClass}`}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
