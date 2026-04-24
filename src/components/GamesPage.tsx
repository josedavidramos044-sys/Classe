import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Shuffle, Zap, Brain, Trophy, Star, Flame, Type, PenTool, Headphones } from 'lucide-react';

type GameType = 'menu' | 'matching' | 'memory' | 'speed-quiz' | 'sentence-builder' | 'word-scramble' | 'listening-challenge';

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
  { en: 'Think', es: 'Pensar' }, { en: 'Know', es: 'Saber' }, { en: 'Want', es: 'Querer' },
  { en: 'Need', es: 'Necesitar' }, { en: 'Come', es: 'Venir' }, { en: 'Go', es: 'Ir' },
  { en: 'See', es: 'Ver' }, { en: 'Hear', es: 'Oir' }, { en: 'Speak', es: 'Hablar' },
  { en: 'Read', es: 'Leer' }, { en: 'Write', es: 'Escribir' }, { en: 'Eat', es: 'Comer' },
  { en: 'Drink', es: 'Beber' }, { en: 'Sleep', es: 'Dormir' }, { en: 'Run', es: 'Correr' },
  { en: 'Walk', es: 'Caminar' }, { en: 'Work', es: 'Trabajar' }, { en: 'Study', es: 'Estudiar' },
  { en: 'Learn', es: 'Aprender' }, { en: 'Teach', es: 'Ensenar' }, { en: 'Play', es: 'Jugar' },
  { en: 'Open', es: 'Abrir' }, { en: 'Close', es: 'Cerrar' }, { en: 'Begin', es: 'Empezar' },
  { en: 'Finish', es: 'Terminar' }, { en: 'Understand', es: 'Entender' }, { en: 'Remember', es: 'Recordar' },
  { en: 'Forget', es: 'Olvidar' }, { en: 'Wait', es: 'Esperar' }, { en: 'Leave', es: 'Salir' },
  { en: 'Arrive', es: 'Llegar' }, { en: 'Buy', es: 'Comprar' }, { en: 'Sell', es: 'Vender' },
  { en: 'Pay', es: 'Pagar' }, { en: 'Search', es: 'Buscar' }, { en: 'Find', es: 'Encontrar' },
  { en: 'Give', es: 'Dar' }, { en: 'Take', es: 'Tomar' }, { en: 'Bring', es: 'Traer' },
  { en: 'Carry', es: 'Llevar' }, { en: 'Break', es: 'Romper' }, { en: 'Build', es: 'Construir' },
  { en: 'Send', es: 'Enviar' }, { en: 'Receive', es: 'Recibir' }, { en: 'Choose', es: 'Elegir' },
  { en: 'Decide', es: 'Decidir' }, { en: 'Believe', es: 'Creer' }, { en: 'Feel', es: 'Sentir' },
  { en: 'Seem', es: 'Parecer' }, { en: 'Become', es: 'Convertirse' }, { en: 'Allow', es: 'Permitir' },
  { en: 'Follow', es: 'Seguir' }, { en: 'Lead', es: 'Liderar' }, { en: 'Change', es: 'Cambiar' },
  { en: 'Continue', es: 'Continuar' },
];

const SENTENCE_DATA = [
  { es: 'Yo como pizza', en: ['I', 'eat', 'pizza'] },
  { es: 'Ella habla ingles', en: ['She', 'speaks', 'english'] },
  { es: 'Nosotros estudiamos mucho', en: ['We', 'study', 'much'] },
  { es: 'Ellos quieren ayuda', en: ['They', 'want', 'help'] },
  { es: 'Yo necesito dinero', en: ['I', 'need', 'money'] },
  { es: 'Ella lee un libro', en: ['She', 'reads', 'a', 'book'] },
  { es: 'Nosotros bebemos agua', en: ['We', 'drink', 'water'] },
  { es: 'El juega futbol', en: ['He', 'plays', 'soccer'] },
  { es: 'Yo entiendo la pregunta', en: ['I', 'understand', 'the', 'question'] },
  { es: 'Ellos buscan la ciudad', en: ['They', 'search', 'the', 'city'] },
  { es: 'Yo siempre camino al trabajo', en: ['I', 'always', 'walk', 'to', 'work'] },
  { es: 'Ella nunca olvida la respuesta', en: ['She', 'never', 'forgets', 'the', 'answer'] },
  { es: 'Nosotros necesitamos aprender el idioma', en: ['We', 'need', 'to', 'learn', 'the', 'language'] },
  { es: 'El da la vida por amor', en: ['He', 'gives', 'life', 'for', 'love'] },
  { es: 'Yo quiero cambiar el mundo', en: ['I', 'want', 'to', 'change', 'the', 'world'] },
];

const LISTENING_EMOJIS: Record<string, string> = {
  'Hello': '\uD83D\uDC4B', 'Goodbye': '\uD83D\uDC4B', 'Water': '\uD83D\uDCA7', 'Food': '\uD83C\uDF5C',
  'House': '\uD83C\uDFE0', 'Book': '\uD83D\uDCD6', 'School': '\uD83C\uDFEB', 'Family': '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
  'Music': '\uD83C\uDFB5', 'Movie': '\uD83C\uDFAC', 'Heart': '\u2764\uFE0F', 'Dream': '\uD83D\uDE34',
  'Love': '\uD83E\uDD70', 'Money': '\uD83D\uDCB0', 'City': '\uD83C\uDFD9\uFE0F', 'World': '\uD83C\uDF0D',
  'Hot': '\uD83C\uDF1E', 'Cold': '\u2744\uFE0F', 'Fast': '\u26A1', 'Sleep': '\uD83D\uDE34',
  'Eat': '\uD83C\uDF5C', 'Drink': '\uD83E\uDD64', 'Run': '\uD83C\uDFC3', 'Walk': '\uD83D\uDEB6',
  'Play': '\uD83C\uDFAE', 'Think': '\uD83E\uDD14', 'Read': '\uD83D\uDCD6', 'Write': '\u270D\uFE0F',
  'Work': '\uD83D\uDCBC', 'Study': '\uD83D\uDCDA', 'Learn': '\uD83E\uDDD0', 'Teach': '\uD83C\uDFEB',
  'Friend': '\uD83E\uDD1D', 'Time': '\u23F0\uFE0F', 'Day': '\u2600\uFE0F', 'Night': '\uD83C\uDF19',
  'Big': '\uD83D\uDCC8', 'Small': '\uD83D\uDCC9', 'Happy': '\uD83D\uDE0A', 'Sad': '\uD83D\uDE22',
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [xpEarned, setXpEarned] = useState(0);

  const handleGameComplete = useCallback((xp: number) => {
    setXpEarned(xp); setActiveGame('menu');
  }, []);

  const games = [
    { id: 'matching' as GameType, title: 'Conecta Palabras', desc: 'Conecta palabras en ingles con su traduccion', icon: Shuffle, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/25' },
    { id: 'memory' as GameType, title: 'Tarjetas de Memoria', desc: 'Encuentra los pares de memoria', icon: Brain, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
    { id: 'speed-quiz' as GameType, title: 'Quiz Relampago', desc: 'Responde lo mas rapido que puedas!', icon: Zap, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25' },
    { id: 'sentence-builder' as GameType, title: 'Arma la Oracion', desc: 'Ordena las palabras para formar la oracion', icon: Type, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/25' },
    { id: 'word-scramble' as GameType, title: 'Descifra la Palabra', desc: 'Descifra la palabra mezclada', icon: PenTool, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/25' },
    { id: 'listening-challenge' as GameType, title: 'Reto de Escucha', desc: 'Identifica la palabra que aparece brevemente', icon: Headphones, color: 'from-sky-500 to-indigo-500', shadow: 'shadow-sky-500/25' },
  ];

  if (activeGame === 'matching') return <MatchingGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'speed-quiz') return <SpeedQuizGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'sentence-builder') return <SentenceBuilderGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'word-scramble') return <WordScrambleGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;
  if (activeGame === 'listening-challenge') return <ListeningChallengeGame onBack={() => setActiveGame('menu')} onComplete={handleGameComplete} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Juegos</h1>
      {xpEarned > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 animate-pulse">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">Ganaste +{xpEarned} XP en tu ultimo juego!</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map(game => {
          const Icon = game.icon;
          return (
            <button key={game.id} onClick={() => setActiveGame(game.id)} className={`w-full flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group hover:shadow-lg ${game.shadow}`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg ${game.shadow} group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white text-lg">{game.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{game.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== MATCHING GAME ==================== */

function MatchingGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const [words, setWords] = useState<typeof GAME_VOCAB>([]);
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [rightMatched, setRightMatched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [shakeWrong, setShakeWrong] = useState<number | null>(null);

  useEffect(() => {
    const shuffled = shuffleArray(GAME_VOCAB).slice(0, 10);
    setWords(shuffled);
  }, []);

  const shuffledRight = words.map((_, i) => i).sort(() => Math.random() - 0.5);
  const matchedCount = Object.keys(matches).length;
  const difficulty = matchedCount < 4 ? 'Facil' : matchedCount < 7 ? 'Medio' : 'Dificil';
  const diffColor = matchedCount < 4 ? 'text-emerald-500' : matchedCount < 7 ? 'text-amber-500' : 'text-red-500';

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
      setMaxCombo(prev => Math.max(prev, newCombo));
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 300);
      if (newCombo >= 3) { setShowCombo(true); setTimeout(() => setShowCombo(false), 800); }
      if (Object.keys(newMatches).length === words.length) {
        setCompleted(true);
        const timeBonus = Math.max(0, 90 - Math.floor((Date.now() - startTime) / 1000));
        const comboBonus = Math.floor(newCombo / 3) * 5;
        const xp = Math.max(10, 30 - errors * 2 + timeBonus + comboBonus);
        setTimeout(() => onComplete(xp), 1500);
      }
    } else {
      setErrors(e => e + 1);
      setCombo(0);
      setFlashRed(true);
      setShakeWrong(displayIdx);
      setTimeout(() => { setFlashRed(false); setShakeWrong(null); }, 400);
    }
    setLeftSelected(null);
  };

  return (
    <div className={`space-y-4 transition-all duration-200 ${flashGreen ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''} ${flashRed ? 'bg-red-50/50 dark:bg-red-900/10' : ''} rounded-2xl p-1 -m-1`}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conecta Palabras</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${diffColor}`}>{difficulty}</span>
          {combo >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{combo}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">Errores: {errors}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(matchedCount / words.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{matchedCount}/{words.length}</span>
      </div>

      {showCombo && (
        <div className="text-center animate-bounce">
          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Flame className="w-6 h-6" />
            <span className="text-2xl font-black">COMBO x{combo}!</span>
            <Flame className="w-6 h-6" />
          </div>
        </div>
      )}

      {completed && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 text-center border border-emerald-200 dark:border-emerald-800">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">Todo conectado!</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Errores: {errors}</div>
          {maxCombo >= 3 && <div className="text-sm text-orange-500 font-medium mt-1">Combo maximo: x{maxCombo}!</div>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {words.map((w, i) => (
            <button key={`l-${i}`} onClick={() => handleLeftClick(i)} disabled={completed || matches[i] !== undefined} className={`w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${matches[i] !== undefined ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 opacity-60 scale-95' : leftSelected === i ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300 scale-105 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-blue-300 hover:scale-[1.02]'}`}>{w.en}</button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledRight.map((actualIdx, displayIdx) => (
            <button key={`r-${displayIdx}`} onClick={() => handleRightClick(displayIdx)} disabled={completed || rightMatched.has(actualIdx) || leftSelected === null} className={`w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${rightMatched.has(actualIdx) ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 opacity-60 scale-95' : leftSelected !== null ? 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:border-blue-300 hover:scale-105' : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white'} ${shakeWrong === displayIdx ? 'animate-pulse border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>{words[actualIdx]?.es}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== MEMORY GAME ==================== */

function MemoryGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  type Card = { id: number; text: string; pairId: number; flipped: boolean; matched: boolean };
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [matchStreak, setMatchStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const pairs = shuffleArray(GAME_VOCAB).slice(0, 10);
    const allCards: Card[] = [];
    pairs.forEach((p, i) => {
      allCards.push({ id: i * 2, text: p.en, pairId: i, flipped: false, matched: false });
      allCards.push({ id: i * 2 + 1, text: p.es, pairId: i, flipped: false, matched: false });
    });
    setCards(shuffleArray(allCards));
  }, []);

  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, completed]);

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
        setBestStreak(prev => Math.max(prev, newStreak));
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true, flipped: true } : c));
          setFlipped([]);
          const allMatched = cards.every(c => c.pairId === first.pairId || c.matched || c.id === first.id || c.id === second.id);
          if (allMatched) {
            setCompleted(true);
            const timeBonus = Math.max(0, 180 - Math.floor((Date.now() - startTime) / 1000));
            const streakBonus = Math.floor(newStreak / 2) * 3;
            const xp = Math.max(10, 30 - moves + timeBonus + streakBonus);
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
  const totalPairs = cards.length / 2;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tarjetas de Memoria</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {matchStreak >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{matchStreak}</span>
            </div>
          )}
          <div className="text-sm font-mono text-gray-500 dark:text-gray-400">{formatTime(elapsedTime)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{matchedCount}/{totalPairs}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${totalPairs ? (matchedCount / totalPairs) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Mov: {moves}</span>
      </div>

      {completed && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 text-center border border-amber-200 dark:border-amber-800">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <div className="font-bold text-lg text-amber-700 dark:text-amber-300">Completado en {moves} movimientos!</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tiempo: {formatTime(elapsedTime)}</div>
          {bestStreak >= 3 && <div className="text-sm text-orange-500 font-medium mt-1 flex items-center justify-center gap-1"><Flame className="w-4 h-4" /> Racha maxima: x{bestStreak}!</div>}
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {cards.map(card => (
          <button key={card.id} onClick={() => handleFlip(card.id)} disabled={card.flipped || card.matched || completed || flipped.length >= 2} className={`aspect-square rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center p-1.5 transition-all duration-300 ${card.matched ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 text-amber-700 dark:text-amber-300 scale-95 opacity-70' : card.flipped ? 'bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-600 text-gray-900 dark:text-white scale-105' : 'bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-amber-400 text-white hover:from-amber-600 hover:to-orange-600 hover:scale-105 shadow-lg shadow-amber-500/20'}`}>
            {card.flipped || card.matched ? card.text : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==================== SPEED QUIZ GAME ==================== */

function SpeedQuizGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const allQuestions = [
    { q: 'Como se dice "Hola" en ingles?', opts: ['Hello', 'Goodbye', 'Thanks', 'Please'], correct: 0, diff: 1 },
    { q: 'Que significa "agua" en ingles?', opts: ['Fire', 'Water', 'Earth', 'Air'], correct: 1, diff: 1 },
    { q: '"Amigo" en ingles es:', opts: ['Enemy', 'Teacher', 'Friend', 'Brother'], correct: 2, diff: 1 },
    { q: 'Como se dice "Gracias" en ingles?', opts: ['Sorry', 'Hello', 'Goodbye', 'Thank you'], correct: 3, diff: 1 },
    { q: 'Que es "libro" en ingles?', opts: ['Library', 'Book', 'Letter', 'Page'], correct: 1, diff: 1 },
    { q: '"Casa" en ingles significa:', opts: ['Car', 'House', 'Street', 'City'], correct: 1, diff: 1 },
    { q: 'Como se dice "Buenos dias" en ingles?', opts: ['Good night', 'Good morning', 'Goodbye', 'Good evening'], correct: 1, diff: 1 },
    { q: 'Que es "comida" en ingles?', opts: ['Drink', 'Food', 'Kitchen', 'Cook'], correct: 1, diff: 1 },
    { q: '"Familia" en ingles es:', opts: ['Friends', 'School', 'Family', 'Team'], correct: 2, diff: 1 },
    { q: 'Como se dice "Por favor" en ingles?', opts: ['Thank you', 'Sorry', 'Please', 'Hello'], correct: 2, diff: 1 },
    { q: 'Que significa "grande" en ingles?', opts: ['Small', 'Big', 'Tall', 'Long'], correct: 1, diff: 2 },
    { q: '"Rapido" en ingles es:', opts: ['Slow', 'Fast', 'Quick', 'Rapid'], correct: 1, diff: 2 },
    { q: 'Como se dice "hermoso" en ingles?', opts: ['Ugly', 'Beautiful', 'Nice', 'Good'], correct: 1, diff: 2 },
    { q: 'Que es "dinero" en ingles?', opts: ['Money', 'Cash', 'Coin', 'Bill'], correct: 0, diff: 2 },
    { q: '"Sueno" en ingles significa:', opts: ['Sleep', 'Dream', 'Night', 'Rest'], correct: 1, diff: 2 },
    { q: 'Como se dice "problema" en ingles?', opts: ['Problem', 'Question', 'Issue', 'Trouble'], correct: 0, diff: 2 },
    { q: 'Que significa "siempre" en ingles?', opts: ['Never', 'Sometimes', 'Always', 'Often'], correct: 2, diff: 2 },
    { q: '"Corazon" en ingles es:', opts: ['Heart', 'Love', 'Soul', 'Mind'], correct: 0, diff: 2 },
    { q: 'Como se dice "ayer" en ingles?', opts: ['Today', 'Tomorrow', 'Yesterday', 'Now'], correct: 2, diff: 2 },
    { q: 'Que es "idioma" en ingles?', opts: ['Word', 'Language', 'Speech', 'Talk'], correct: 1, diff: 2 },
    { q: '"Entender" en ingles es:', opts: ['Understand', 'Remember', 'Think', 'Know'], correct: 0, diff: 3 },
    { q: 'Como se dice "recordar" en ingles?', opts: ['Forget', 'Remember', 'Think', 'Feel'], correct: 1, diff: 3 },
    { q: '"Necesitar" en ingles significa:', opts: ['Want', 'Need', 'Have', 'Must'], correct: 1, diff: 3 },
    { q: 'Que es "construir" en ingles?', opts: ['Destroy', 'Build', 'Create', 'Make'], correct: 1, diff: 3 },
    { q: '"Convertirse" en ingles es:', opts: ['Become', 'Change', 'Transform', 'Turn'], correct: 0, diff: 3 },
    { q: 'Como se dice "permitir" en ingles?', opts: ['Forbid', 'Allow', 'Let', 'Accept'], correct: 1, diff: 3 },
    { q: '"Elegir" en ingles significa:', opts: ['Decide', 'Pick', 'Choose', 'Select'], correct: 2, diff: 3 },
    { q: 'Que es "continuar" en ingles?', opts: ['Stop', 'Continue', 'Pause', 'Start'], correct: 1, diff: 3 },
    { q: '"Liderar" en ingles es:', opts: ['Follow', 'Lead', 'Guide', 'Direct'], correct: 1, diff: 3 },
    { q: 'Como se dice "creer" en ingles?', opts: ['Doubt', 'Trust', 'Believe', 'Think'], correct: 2, diff: 3 },
  ];

  const [questions] = useState(() => shuffleArray(allQuestions).slice(0, 30));
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);

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
    const q = questions[currentQ];
    const isCorrect = idx === q.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      const streakBonus = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 0;
      setScore(s => s + 1 + streakBonus);
      setBonusXp(prev => prev + streakBonus);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setShowFeedback(false); setSelected(null);
      if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
      else setGameState('ended');
    }, 600);
  };

  const xp = Math.max(5, score * 2 + bestStreak * 2);
  const currentDiff = questions[currentQ]?.diff ?? 1;
  const diffLabel = currentDiff === 1 ? 'Facil' : currentDiff === 2 ? 'Medio' : 'Dificil';
  const diffColor = currentDiff === 1 ? 'text-emerald-500' : currentDiff === 2 ? 'text-amber-500' : 'text-red-500';

  if (gameState === 'ended') {
    return (
      <div className="space-y-6 text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Se acabo el tiempo!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Acertaste {score} puntos en {questions.length} preguntas</p>
        </div>
        {bestStreak >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800 inline-block">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Flame className="w-5 h-5" /> Mejor racha: {bestStreak} seguidas!
            </div>
          </div>
        )}
        {bonusXp > 0 && (
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-200 dark:border-sky-800 inline-block">
            <span className="text-sky-600 dark:text-sky-400 font-semibold">+{bonusXp} XP bonus por rachas!</span>
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

  const q = questions[currentQ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quiz Relampago</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${diffColor}`}>{diffLabel}</span>
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{streak}</span>
            </div>
          )}
          <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>{timeLeft}s</div>
        </div>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} style={{ width: `${(timeLeft / 60) * 100}%` }} />
      </div>
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">Puntos: {score} | Pregunta {currentQ + 1}/{questions.length}</div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{q.q}</h3>
      </div>
      <div className="space-y-2">
        {q.opts.map((opt, idx) => {
          let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-500';
          if (showFeedback && selected !== null) {
            if (idx === q.correct) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-[1.02]';
            else if (idx === selected) btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300 animate-pulse';
            else btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
          }
          return <button key={idx} onClick={() => handleAnswer(idx)} disabled={showFeedback} className={`w-full p-4 rounded-xl text-left font-medium text-gray-900 dark:text-white transition-all duration-200 ${btnClass}`}>{opt}</button>;
        })}
      </div>
    </div>
  );
}

/* ==================== SENTENCE BUILDER GAME ==================== */

function SentenceBuilderGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const [round, setRound] = useState(0);
  const [sentences] = useState(() => shuffleArray(SENTENCE_DATA).slice(0, 10));
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());

  useEffect(() => {
    if (sentences.length > 0 && round < sentences.length) {
      const scrambled = shuffleArray([...sentences[round].en]);
      setAvailableWords(scrambled);
      setSelectedWords([]);
      setShowResult(null);
      setRoundStartTime(Date.now());
    }
  }, [round, sentences]);

  const handleSubmit = () => {
    if (selectedWords.length === 0) return;
    const current = sentences[round];
    const isCorrect = selectedWords.join(' ').toLowerCase() === current.en.join(' ').toLowerCase();

    if (isCorrect) {
      const timeBonus = Math.max(0, 15 - Math.floor((Date.now() - roundStartTime) / 1000));
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setScore(s => s + 10 + timeBonus + newCombo * 2);
      setShowResult('correct');
    } else {
      setCombo(0);
      setShowResult('wrong');
    }

    setTimeout(() => {
      setShowResult(null);
      if (round < sentences.length - 1) {
        setRound(r => r + 1);
      } else {
        setCompleted(true);
      }
    }, 1200);
  };

  const handleWordTap = (word: string, fromSelected: boolean) => {
    if (showResult) return;
    if (fromSelected) {
      const idx = selectedWords.indexOf(word);
      if (idx !== -1) {
        setSelectedWords(prev => prev.filter((_, i) => i !== idx));
        setAvailableWords(prev => [...prev, word]);
      }
    } else {
      setAvailableWords(prev => {
        const idx = prev.indexOf(word);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const xp = Math.max(10, score);

  if (completed) {
    return (
      <div className="space-y-6 text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Oraciones completadas!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Puntuacion: {score} puntos</p>
        </div>
        {maxCombo >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800 inline-block">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Flame className="w-5 h-5" /> Combo maximo: x{maxCombo}!
            </div>
          </div>
        )}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
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

  const current = sentences[round];

  return (
    <div className={`space-y-4 transition-all duration-200 rounded-2xl p-1 -m-1 ${showResult === 'correct' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : showResult === 'wrong' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Arma la Oracion</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {combo >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{combo}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">Puntos: {score}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${((round + 1) / sentences.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{round + 1}/{sentences.length}</span>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-center shadow-lg shadow-emerald-500/20">
        <div className="text-xs text-emerald-200 mb-1 uppercase tracking-wider">Traduce al ingles</div>
        <div className="text-xl font-bold text-white">{current.es}</div>
      </div>

      {showResult && (
        <div className={`text-center py-2 rounded-xl font-bold text-lg ${showResult === 'correct' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {showResult === 'correct' ? 'Correcto!' : 'Incorrecto!'}
          {showResult === 'correct' && combo >= 3 && (
            <div className="flex items-center justify-center gap-1 text-orange-500 text-sm mt-1">
              <Flame className="w-4 h-4" /> COMBO x{combo}!
            </div>
          )}
        </div>
      )}

      <div className="min-h-[60px] bg-white dark:bg-gray-800 rounded-xl p-3 border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-wrap gap-2 items-center">
        {selectedWords.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm italic">Toca las palabras para armar la oracion...</span>
        ) : (
          selectedWords.map((word, i) => (
            <button key={`sel-${i}`} onClick={() => handleWordTap(word, true)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 hover:text-red-700 transition-all duration-200 animate-[fadeIn_0.2s_ease-in]">
              {word}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center min-h-[50px]">
        {availableWords.map((word, i) => (
          <button key={`avail-${i}`} onClick={() => handleWordTap(word, false)} disabled={showResult !== null} className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-medium text-sm hover:bg-violet-200 dark:hover:bg-violet-800/50 hover:scale-105 transition-all duration-200 disabled:opacity-50">
            {word}
          </button>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={selectedWords.length === 0 || showResult !== null} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none transition-all duration-200 hover:scale-[1.02]">
        Verificar Oracion
      </button>
    </div>
  );
}

/* ==================== WORD SCRAMBLE GAME ==================== */

function WordScrambleGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const [words] = useState(() => {
    const eligible = GAME_VOCAB.filter(w => w.en.length >= 3 && w.en.length <= 12 && !w.en.includes(' '));
    return shuffleArray(eligible).slice(0, 15);
  });
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, completed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [round]);

  const scrambleWord = (word: string): string => {
    const chars = word.split('');
    let scrambled = shuffleArray(chars);
    let attempts = 0;
    while (scrambled.join('') === word && attempts < 20) {
      scrambled = shuffleArray(chars);
      attempts++;
    }
    return scrambled.join('');
  };

  const currentWord = words[round];
  const scrambled = scrambleWord(currentWord?.en ?? '');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || showResult) return;

    const isCorrect = input.trim().toLowerCase() === currentWord.en.toLowerCase();
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      const timeBonus = Math.max(0, 10 - Math.floor(elapsedTime / 5));
      setScore(s => s + 10 + timeBonus + newStreak);
      setShowResult('correct');
    } else {
      setStreak(0);
      setShowResult('wrong');
    }

    setTimeout(() => {
      setShowResult(null);
      setInput('');
      if (round < words.length - 1) {
        setRound(r => r + 1);
      } else {
        setCompleted(true);
      }
    }, 1200);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const xp = Math.max(10, score);

  if (completed) {
    return (
      <div className="space-y-6 text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Juego terminado!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Descifraste {score} puntos</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tiempo: {formatTime(elapsedTime)}</p>
        </div>
        {bestStreak >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800 inline-block">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Flame className="w-5 h-5" /> Mejor racha: x{bestStreak}!
            </div>
          </div>
        )}
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
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

  return (
    <div className={`space-y-4 transition-all duration-200 rounded-2xl p-1 -m-1 ${showResult === 'correct' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : showResult === 'wrong' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Descifra la Palabra</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{streak}</span>
            </div>
          )}
          <div className="text-sm font-mono text-gray-500 dark:text-gray-400">{formatTime(elapsedTime)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Puntos: {score}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${((round + 1) / words.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{round + 1}/{words.length}</span>
      </div>

      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-center shadow-lg shadow-violet-500/20">
        <div className="text-xs text-violet-200 mb-1 uppercase tracking-wider">Pista en espanol</div>
        <div className="text-xl font-bold text-white">{currentWord?.es}</div>
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap">
        {scrambled.split('').map((char, i) => (
          <div key={i} className="w-10 h-12 rounded-lg bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-700 flex items-center justify-center text-lg font-bold text-violet-600 dark:text-violet-400 shadow-md animate-[bounce_0.3s_ease-in-out] select-none" style={{ animationDelay: `${i * 50}ms` }}>
            {char.toUpperCase()}
          </div>
        ))}
      </div>

      {showResult && (
        <div className={`text-center py-3 rounded-xl font-bold text-lg ${showResult === 'correct' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {showResult === 'correct' ? 'Correcto!' : `Incorrecto! La respuesta era: ${currentWord.en}`}
          {showResult === 'correct' && streak >= 3 && (
            <div className="flex items-center justify-center gap-1 text-orange-500 text-sm mt-1">
              <Flame className="w-4 h-4" /> RACHA x{streak}!
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe la palabra en ingles..." disabled={showResult !== null} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all disabled:opacity-50" autoComplete="off" autoCapitalize="off" />
        <button type="submit" disabled={!input.trim() || showResult !== null} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none transition-all duration-200 hover:scale-[1.02]">
          Verificar
        </button>
      </form>
    </div>
  );
}

/* ==================== LISTENING CHALLENGE GAME ==================== */

function ListeningChallengeGame({ onBack, onComplete }: { onBack: () => void; onComplete: (xp: number) => void }) {
  const [rounds] = useState(() => {
    const eligible = GAME_VOCAB.filter(w => LISTENING_EMOJIS[w.en] || true);
    return shuffleArray(eligible).slice(0, 10);
  });
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'showing' | 'choosing' | 'result'>('ready');
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);

  const getDisplayTime = () => {
    if (round < 2) return 2000;
    if (round < 4) return 1500;
    if (round < 6) return 1000;
    if (round < 8) return 750;
    return 500;
  };

  useEffect(() => {
    if (phase !== 'showing') return;
    const displayTime = getDisplayTime();
    setFlashVisible(true);
    setCountdown(Math.ceil(displayTime / 1000));
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    const hideTimer = setTimeout(() => {
      setFlashVisible(false);
      setPhase('choosing');
      clearInterval(timer);
    }, displayTime);
    return () => { clearTimeout(hideTimer); clearInterval(timer); };
  }, [phase, round]);

  useEffect(() => {
    if (round >= rounds.length) return;
    const current = rounds[round];
    const wrongOptions = shuffleArray(GAME_VOCAB.filter(w => w.es !== current.es)).slice(0, 3).map(w => w.es);
    const allOpts = shuffleArray([current.es, ...wrongOptions]);
    setOptions(allOpts);
    setCorrectOption(allOpts.indexOf(current.es));
  }, [round, rounds]);

  const handlePlay = () => {
    setPhase('showing');
    setShowResult(null);
    setSelected(null);
  };

  const handleChoice = (idx: number) => {
    if (phase !== 'choosing') return;
    setSelected(idx);
    const isCorrect = idx === correctOption;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      const speedBonus = round < 2 ? 0 : round < 4 ? 2 : round < 6 ? 4 : round < 8 ? 6 : 8;
      setScore(s => s + 10 + speedBonus + newStreak);
      setShowResult('correct');
    } else {
      setStreak(0);
      setShowResult('wrong');
    }
    setPhase('result');

    setTimeout(() => {
      setShowResult(null);
      setSelected(null);
      if (round < rounds.length - 1) {
        setRound(r => r + 1);
        setPhase('ready');
      } else {
        setCompleted(true);
      }
    }, 1200);
  };

  const xp = Math.max(10, score);

  if (completed) {
    return (
      <div className="space-y-6 text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reto completado!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Puntuacion: {score} puntos</p>
        </div>
        {bestStreak >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800 inline-block">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <Flame className="w-5 h-5" /> Mejor racha: x{bestStreak}!
            </div>
          </div>
        )}
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-200 dark:border-sky-800">
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

  const current = rounds[round];
  const emoji = LISTENING_EMOJIS[current?.en] ?? '';
  const displayTime = getDisplayTime();

  return (
    <div className={`space-y-4 transition-all duration-200 rounded-2xl p-1 -m-1 ${showResult === 'correct' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : showResult === 'wrong' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reto de Escucha</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-orange-500 animate-pulse">
              <Flame className="w-4 h-4" /><span className="text-sm font-bold">x{streak}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">Puntos: {score}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((round + 1) / rounds.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{round + 1}/{rounds.length}</span>
      </div>

      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        Tiempo de visualizacion: {(displayTime / 1000).toFixed(1)}s
        {round < 2 && <span className="ml-1 text-emerald-500">(Facil)</span>}
        {round >= 2 && round < 6 && <span className="ml-1 text-amber-500">(Medio)</span>}
        {round >= 6 && <span className="ml-1 text-red-500">(Dificil)</span>}
      </div>

      {/* Word display area */}
      <div className="relative min-h-[120px] flex items-center justify-center">
        {phase === 'ready' && (
          <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-110 transition-transform active:scale-95">
            <Headphones className="w-10 h-10 text-white" />
          </button>
        )}

        {phase === 'showing' && flashVisible && (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            {emoji && <div className="text-5xl">{emoji}</div>}
            <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl px-8 py-4 shadow-lg shadow-sky-500/30 animate-[fadeIn_0.2s_ease-in]">
              <span className="text-2xl font-bold text-white">{current?.en}</span>
            </div>
            <div className="text-sm text-sky-500 font-mono">{countdown}s</div>
          </div>
        )}

        {phase === 'choosing' && !flashVisible && (
          <div className="text-center">
            <div className="text-5xl mb-2">{emoji || '\uD83D\uDC42'}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Selecciona la traduccion correcta</div>
          </div>
        )}

        {phase === 'result' && (
          <div className={`text-center py-3 px-6 rounded-xl font-bold text-lg ${showResult === 'correct' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
            {showResult === 'correct' ? 'Correcto!' : `Incorrecto! Era: ${current?.es}`}
            {showResult === 'correct' && streak >= 3 && (
              <div className="flex items-center justify-center gap-1 text-orange-500 text-sm mt-1">
                <Flame className="w-4 h-4" /> RACHA x{streak}!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options area */}
      {(phase === 'choosing' || phase === 'result') && (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx) => {
            let btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-500';
            if (phase === 'result' && selected !== null) {
              if (idx === correctOption) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300';
              else if (idx === selected) btnClass = 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300';
              else btnClass = 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 opacity-50';
            }
            return (
              <button key={idx} onClick={() => handleChoice(idx)} disabled={phase !== 'choosing'} className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${btnClass} ${phase === 'choosing' ? 'hover:scale-105 active:scale-95' : ''}`}>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
