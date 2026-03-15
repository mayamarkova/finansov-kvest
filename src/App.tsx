import { useState, useEffect, useRef } from 'react'
import { levels } from './data/questions'
import type { Question } from './data/questions'

// ============ TYPES ============
type Screen =
  | 'start'
  | 'name'
  | 'levelMap'
  | 'game'
  | 'feedback'
  | 'levelComplete'
  | 'gameComplete'
  | 'leaderboard'
  | 'info'

interface LeaderboardEntry {
  name: string
  score: number
  date: string
}

// ============ GOOGLE SHEETS API ============
// ВАЖНО: Замени този URL с твоя Google Apps Script URL (виж SETUP_GUIDE.md)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbnx9t6oe8rF3OQRlll0xQVbwaWeKO3D8pnfpK9-iJGdgBLpI1FMT5pWTNDrYw_4f30w/exec'

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=get`)
    const data = await res.json()
    if (Array.isArray(data)) {
      return data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
    }
    return []
  } catch {
    // Fallback to localStorage if Google Sheets is unavailable
    try {
      const local = localStorage.getItem('finmath_leaderboard')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  }
}

async function saveToLeaderboard(entry: LeaderboardEntry): Promise<void> {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch {
    // Fallback: save locally if Google Sheets fails
  }
  // Always also save locally as backup
  try {
    const lb = JSON.parse(localStorage.getItem('finmath_leaderboard') || '[]')
    lb.push(entry)
    localStorage.setItem('finmath_leaderboard', JSON.stringify(lb))
  } catch { /* ignore */ }
}

// ============ CONFETTI COMPONENT ============
function Confetti() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6fc8', '#845ef7', '#20c997', '#ff922b']
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

// ============ ANIMATED WRAPPER ============
function AnimatedScreen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`animate-fadeInUp ${className}`}>
      {children}
    </div>
  )
}

// ============ START SCREEN ============
function StartScreen({
  onStart,
  onLeaderboard,
  onInfo,
}: {
  onStart: () => void
  onLeaderboard: () => void
  onInfo: () => void
}) {
  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 text-7xl animate-bounce-slow">🎓</div>
      <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 mb-3 leading-tight">
        ФИНАНСОВ
      </h1>
      <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 mb-4 leading-tight">
        КУЕСТ
      </h1>
      <p className="text-gray-300 text-lg mb-2 max-w-md">
        Покажи финансовата си грамотност! 🧠💰
      </p>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        5 нива • 25 въпроса • Спечели място във Финансова математика!
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          🚀 ИГРАЙ
        </button>
        <button
          onClick={onLeaderboard}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          🏆 Класация
        </button>
        <button
          onClick={onInfo}
          className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          🎓 За специалността
        </button>
      </div>

      <div className="mt-8 text-gray-500 text-xs flex items-center gap-2">
        <span>Русенски университет</span>
        <span>•</span>
        <span>Финансова математика</span>
      </div>
    </AnimatedScreen>
  )
}

// ============ NAME SCREEN ============
function NameScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length >= 2) {
      onSubmit(name.trim())
    }
  }

  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-6">🎮</div>
      <h2 className="text-3xl font-bold text-white mb-2">Как се казваш?</h2>
      <p className="text-gray-400 mb-8">Въведи името си за класацията</p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Твоето име..."
          maxLength={30}
          className="w-full py-4 px-6 bg-white/10 backdrop-blur border-2 border-purple-500/50 rounded-2xl text-white text-center text-xl placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
        />
        <button
          type="submit"
          disabled={name.trim().length < 2}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          Напред ➜
        </button>
      </form>
    </AnimatedScreen>
  )
}

// ============ LEVEL MAP SCREEN ============
function LevelMapScreen({
  unlockedLevel,
  totalScore,
  onSelectLevel,
  onBack,
  levelScores,
  levelPassed,
}: {
  unlockedLevel: number
  totalScore: number
  onSelectLevel: (levelIdx: number) => void
  onBack: () => void
  levelScores: number[]
  levelPassed: boolean[]
}) {
  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center p-4 pt-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2 bg-yellow-500/20 rounded-full px-4 py-2">
            <span className="text-yellow-400 text-lg">⭐</span>
            <span className="text-yellow-300 font-bold text-lg">{totalScore}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Избери ниво</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Преминавай нивата едно по едно!</p>

        <div className="flex flex-col gap-4 items-center">
          {levels.map((level, idx) => {
            const isUnlocked = idx <= unlockedLevel
            const isCompleted = levelPassed[idx]
            const isCurrent = idx === unlockedLevel && !isCompleted

            return (
              <div key={level.id} className="w-full flex flex-col items-center">
                {idx > 0 && (
                  <div
                    className={`w-1 h-6 ${
                      idx <= unlockedLevel ? 'bg-gradient-to-b from-purple-500 to-blue-500' : 'bg-gray-700'
                    } rounded-full mb-2`}
                  />
                )}
                <button
                  onClick={() => isUnlocked && onSelectLevel(idx)}
                  disabled={!isUnlocked}
                  className={`w-full max-w-sm p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                    isCompleted
                      ? 'bg-green-900/30 border-green-500/50 hover:border-green-400'
                      : isCurrent
                      ? 'bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 animate-pulse-subtle'
                      : isUnlocked
                      ? 'bg-white/5 border-gray-600 hover:border-gray-400'
                      : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        isCompleted
                          ? 'bg-green-500/20'
                          : isCurrent
                          ? 'bg-purple-500/20'
                          : isUnlocked
                          ? 'bg-white/10'
                          : 'bg-gray-800'
                      }`}
                    >
                      {isCompleted ? '✅' : !isUnlocked ? '🔒' : level.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">Ниво {level.id}</span>
                        {isCurrent && (
                          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                            НОВО
                          </span>
                        )}
                      </div>
                      <div className="text-gray-300 font-medium">{level.name}</div>
                      <div className="text-gray-500 text-sm">{level.description}</div>
                      {isCompleted && (
                        <div className="text-green-400 text-sm mt-1 font-medium">
                          ✓ {levelScores[idx]} точки
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {isUnlocked && !isCompleted && (
                        <span className="text-purple-400 text-2xl">▶</span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AnimatedScreen>
  )
}

// ============ GAME SCREEN ============
function GameScreen({
  levelIdx,
  questionIdx,
  score,
  onAnswer,
  onQuit,
}: {
  levelIdx: number
  questionIdx: number
  score: number
  onAnswer: (answerIdx: number) => void
  onQuit: () => void
}) {
  const level = levels[levelIdx]
  const question = level.questions[questionIdx]
  const totalQuestions = level.questions.length
  const progress = ((questionIdx) / totalQuestions) * 100

  const optionLabels = ['A', 'B', 'C', 'D']
  const optionColors = [
    'from-red-500 to-rose-600',
    'from-blue-500 to-indigo-600',
    'from-yellow-500 to-orange-600',
    'from-green-500 to-emerald-600',
  ]

  return (
    <AnimatedScreen className="min-h-screen flex flex-col p-4 pt-6">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onQuit}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ✕ Изход
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Ниво {level.id}</span>
            <span className="text-lg">{level.icon}</span>
          </div>
          <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-sm">⭐</span>
            <span className="text-yellow-300 font-bold text-sm">{score}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs text-center mb-6">
          Въпрос {questionIdx + 1} от {totalQuestions}
        </p>

        {/* Question */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 mb-6 shadow-xl">
          <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed text-center">
            {question.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 flex-1">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onAnswer(idx)}
              className={`w-full py-4 px-5 bg-gradient-to-r ${optionColors[idx]} text-white font-semibold text-left rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center gap-3`}
            >
              <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                {optionLabels[idx]}
              </span>
              <span className="text-sm sm:text-base">{option}</span>
            </button>
          ))}
        </div>

        {/* Points info */}
        <div className="mt-4 text-center text-gray-500 text-xs">
          +{level.pointsPerCorrect} ✓ верен • −{level.penaltyPerWrong} ✗ грешен
        </div>
      </div>
    </AnimatedScreen>
  )
}

// ============ FEEDBACK SCREEN ============
function FeedbackScreen({
  question,
  selectedAnswer,
  isCorrect,
  pointsChange,
  onNext,
}: {
  question: Question
  selectedAnswer: number
  isCorrect: boolean
  pointsChange: number
  onNext: () => void
}) {
  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Result Icon */}
        <div className="text-center mb-6">
          <div
            className={`text-7xl mb-3 ${isCorrect ? 'animate-bounce-slow' : 'animate-shake'}`}
          >
            {isCorrect ? '🎉' : '😬'}
          </div>
          <h2
            className={`text-3xl font-black ${
              isCorrect ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isCorrect ? 'ПРАВИЛНО!' : 'ГРЕШЕН ОТГОВОР'}
          </h2>
          <div
            className={`text-xl font-bold mt-2 ${
              isCorrect ? 'text-green-300' : 'text-red-300'
            }`}
          >
            {isCorrect ? `+${pointsChange}` : `${pointsChange}`} точки
          </div>
        </div>

        {/* Correct Answer */}
        {!isCorrect && (
          <div className="bg-green-900/30 border border-green-500/40 rounded-2xl p-4 mb-4">
            <p className="text-green-400 text-sm font-semibold mb-1">
              ✓ Верният отговор е:
            </p>
            <p className="text-green-200 font-medium">
              {question.options[question.correctIndex]}
            </p>
          </div>
        )}

        {/* Your wrong answer */}
        {!isCorrect && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 mb-4">
            <p className="text-red-400 text-sm font-semibold mb-1">
              ✗ Твоят отговор:
            </p>
            <p className="text-red-300">
              {question.options[selectedAnswer]}
            </p>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-purple-300 text-sm font-semibold mb-2 flex items-center gap-2">
            💡 Обяснение:
          </p>
          <p className="text-gray-300 leading-relaxed">{question.explanation}</p>
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          Напред ➜
        </button>
      </div>
    </AnimatedScreen>
  )
}

// ============ LEVEL COMPLETE SCREEN ============
function LevelCompleteScreen({
  levelIdx,
  correctCount,
  totalQuestions,
  levelScore,
  totalScore,
  passed,
  onNext,
}: {
  levelIdx: number
  correctCount: number
  totalQuestions: number
  levelScore: number
  totalScore: number
  passed: boolean
  onNext: () => void
}) {
  const level = levels[levelIdx]
  const isLastLevel = levelIdx === levels.length - 1

  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      {passed && <Confetti />}
      <div className="text-6xl mb-4">
        {passed ? (isLastLevel ? '🏆' : '⭐') : '💪'}
      </div>
      <h2 className="text-3xl font-black text-white mb-2">
        {passed ? 'НИВО ЗАВЪРШЕНО!' : 'НИВО НЕУСПЕШНО'}
      </h2>
      <p className="text-gray-400 mb-6">
        {level.icon} {level.name}
      </p>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 w-full max-w-sm mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-white">
              {correctCount}/{totalQuestions}
            </div>
            <div className="text-gray-400 text-sm">Верни</div>
          </div>
          <div>
            <div className={`text-3xl font-black ${levelScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {levelScore > 0 ? '+' : ''}{levelScore}
            </div>
            <div className="text-gray-400 text-sm">Точки за нивото</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-yellow-400 text-sm">Общ резултат</div>
          <div className="text-yellow-300 text-3xl font-black">⭐ {totalScore}</div>
        </div>
      </div>

      {!passed && (
        <div className="bg-orange-900/30 border border-orange-500/30 rounded-2xl p-4 mb-6 max-w-sm">
          <p className="text-orange-300 text-sm">
            Трябва ти минимум {level.requiredCorrect} верни отговора от {totalQuestions}, за да преминеш нивото. Опитай отново!
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        className={`w-full max-w-xs py-4 px-6 text-white font-bold text-xl rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 ${
          passed
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30'
            : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/30'
        }`}
      >
        {passed
          ? isLastLevel
            ? '🏆 Виж резултата'
            : '➜ Следващо ниво'
          : '🔄 Опитай отново'}
      </button>
    </AnimatedScreen>
  )
}

// ============ GAME COMPLETE SCREEN ============
function GameCompleteScreen({
  totalScore,
  playerName,
  onLeaderboard,
  onRestart,
  onInfo,
}: {
  totalScore: number
  playerName: string
  onLeaderboard: () => void
  onRestart: () => void
  onInfo: () => void
}) {
  const maxScore = levels.reduce(
    (sum, l) => sum + l.pointsPerCorrect * l.questions.length,
    0
  )
  const percentage = Math.round((totalScore / maxScore) * 100)

  let title = ''
  let emoji = ''
  let message = ''
  if (percentage >= 90) {
    title = 'ФИНАНСОВ ГЕНИЙ!'
    emoji = '🧠💎'
    message = 'Невероятно представяне! Ти си истински финансов експерт!'
  } else if (percentage >= 70) {
    title = 'ОТЛИЧЕН РЕЗУЛТАТ!'
    emoji = '🌟🏆'
    message = 'Страхотно! Имаш солидни финансови познания!'
  } else if (percentage >= 50) {
    title = 'ДОБРО ПРЕДСТАВЯНЕ!'
    emoji = '👏📈'
    message = 'Добра работа! С малко повече учене ще си топ!'
  } else {
    title = 'ПРОДЪЛЖАВАЙ НАПРЕД!'
    emoji = '💪📚'
    message = 'Всяко начало е трудно, но ти вече знаеш повече за финансите!'
  }

  return (
    <AnimatedScreen className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <Confetti />
      <div className="text-5xl mb-4">{emoji}</div>
      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 mb-2">
        {title}
      </h2>
      <p className="text-gray-300 mb-6 max-w-sm">{message}</p>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 w-full max-w-sm mb-4">
        <div className="text-gray-400 text-sm mb-1">🎮 {playerName}</div>
        <div className="text-yellow-300 text-5xl font-black mb-1">⭐ {totalScore}</div>
        <div className="text-gray-500 text-sm">от максимум {maxScore} точки ({percentage}%)</div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-4 w-full max-w-sm mb-6">
        <p className="text-purple-200 text-sm">
          🎓 Резултатът ти е записан в класацията! Говори с екипа на <strong>Финансова математика</strong> за повече информация!
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onLeaderboard}
          className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        >
          🏆 Виж класацията
        </button>
        <button
          onClick={onInfo}
          className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        >
          🎓 За специалността
        </button>
        <button
          onClick={onRestart}
          className="w-full py-3 px-6 bg-white/10 text-gray-300 font-bold text-lg rounded-2xl hover:bg-white/20 active:scale-95 transition-all duration-200"
        >
          🔄 Нова игра
        </button>
      </div>
    </AnimatedScreen>
  )
}

// ============ LEADERBOARD SCREEN ============
function LeaderboardScreen({
  currentPlayer,
  onBack,
}: {
  currentPlayer?: string
  onBack: () => void
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getLeaderboard().then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <AnimatedScreen className="min-h-screen flex flex-col p-4 pt-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-white">🏆 Класация</h2>
          <div className="w-8" />
        </div>

        {loading ? (
          <div className="text-center mt-20">
            <div className="text-5xl mb-4 animate-bounce-slow">⏳</div>
            <p className="text-gray-400 text-lg">Зареждане...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-5xl mb-4">🏜️</div>
            <p className="text-gray-400 text-lg">Все още няма играчи.</p>
            <p className="text-gray-500 text-sm">Бъди първият!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, idx) => {
              const isCurrentPlayer = entry.name === currentPlayer
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentPlayer
                      ? 'bg-purple-900/40 border border-purple-500/50'
                      : 'bg-white/5 border border-transparent'
                  } ${idx < 3 ? 'scale-[1.02]' : ''}`}
                >
                  <div className="w-10 text-center">
                    {idx < 3 ? (
                      <span className="text-2xl">{medals[idx]}</span>
                    ) : (
                      <span className="text-gray-500 font-bold text-lg">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold ${isCurrentPlayer ? 'text-purple-300' : 'text-white'}`}>
                      {entry.name}
                      {isCurrentPlayer && (
                        <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                          ТИ
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">{entry.date}</div>
                  </div>
                  <div className="text-yellow-400 font-bold text-lg">
                    ⭐ {entry.score}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AnimatedScreen>
  )
}

// ============ PROGRAM INFO SCREEN ============
function ProgramInfoScreen({ onBack }: { onBack: () => void }) {
  return (
    <AnimatedScreen className="min-h-screen flex flex-col p-4 pt-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-white">🎓 Финансова математика</h2>
          <div className="w-8" />
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-3xl p-6 mb-4">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 mb-3">
            Финансова математика
          </h3>
          <p className="text-purple-200 text-sm font-medium mb-1">
            📍 Русенски университет „Ангел Кънчев"
          </p>
          <p className="text-gray-400 text-sm">
            Бакалавърска програма • Редовно обучение
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              📖 Какво ще учиш?
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Финансов анализ и моделиране – научи се да прогнозираш пазарите</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Математическа статистика и теория на вероятностите</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Управление на риска – как да оценяваш и минимизираш финансовите рискове</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Инвестиционен мениджмънт и портфолио оптимизация</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Програмиране и софтуер за финансови изчисления (Python, R, Excel)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Банково дело, застраховане и пенсионно осигуряване</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              💼 Къде ще работиш?
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">💰</span>
                <span>Банки и финансови институции</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">📊</span>
                <span>Инвестиционни фондове и борси</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">🛡️</span>
                <span>Застрахователни компании</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">🏢</span>
                <span>Консултантски фирми (Big Four и др.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">💻</span>
                <span>FinTech компании и стартъпи</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">🏛️</span>
                <span>Държавни институции (БНБ, КФН, НАП)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              🌟 Защо Финансова математика?
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⭐</span>
                <span>Комбинация от математика, финанси и IT – търсени умения на пазара</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⭐</span>
                <span>Високо заплащане – финансовите анализатори са сред най-добре платените специалисти</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⭐</span>
                <span>Възможност за работа в България и по света</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⭐</span>
                <span>Практическо обучение с реални данни и казуси</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⭐</span>
                <span>Малки групи и индивидуално внимание от преподавателите</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-5">
            <h4 className="text-lg font-bold text-yellow-300 mb-2 flex items-center gap-2">
              🎯 Кандидатствай сега!
            </h4>
            <p className="text-gray-300 text-sm mb-3">
              Научи повече за приема и условията за кандидатстване. Говори с нашия екип тук, на Деня на отворените врати!
            </p>
           <a href="https://www.uni-ruse.bg/Departments/PMS/finansovamatematika#form_data" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm rounded-xl hover:scale-105 active:scale-95 transition-all duration-200">
          👉 Кандидатствай онлайн
          </a>
<p className="text-gray-400 text-xs mt-2">
  📧 vmicheva@uni-ruse.bg • 🌐 uni-ruse.bg
</p>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </AnimatedScreen>
  )
}

// ============ MAIN APP ============
export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [playerName, setPlayerName] = useState('')
  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [levelScore, setLevelScore] = useState(0)
  const [levelCorrectCount, setLevelCorrectCount] = useState(0)
  const [unlockedLevel, setUnlockedLevel] = useState(0)
  const [levelScores, setLevelScores] = useState<number[]>([0, 0, 0, 0, 0])
  const [levelPassed, setLevelPassed] = useState<boolean[]>([false, false, false, false, false])
  const [selectedAnswer, setSelectedAnswer] = useState(-1)
  const [isCorrect, setIsCorrect] = useState(false)
  const [pointsChange, setPointsChange] = useState(0)
  const [previousScreen, setPreviousScreen] = useState<Screen>('start')

  const handleStartGame = () => {
    setScreen('name')
  }

  const handleNameSubmit = (name: string) => {
    setPlayerName(name)
    setScore(0)
    setLevelScore(0)
    setLevelCorrectCount(0)
    setCurrentLevel(0)
    setCurrentQuestion(0)
    setUnlockedLevel(0)
    setLevelScores([0, 0, 0, 0, 0])
    setLevelPassed([false, false, false, false, false])
    setScreen('levelMap')
  }

  const handleSelectLevel = (levelIdx: number) => {
    setCurrentLevel(levelIdx)
    setCurrentQuestion(0)
    setLevelScore(0)
    setLevelCorrectCount(0)
    setScreen('game')
  }

  const handleAnswer = (answerIdx: number) => {
    const level = levels[currentLevel]
    const question = level.questions[currentQuestion]
    const correct = answerIdx === question.correctIndex
    const pts = correct ? level.pointsPerCorrect : -level.penaltyPerWrong

    setSelectedAnswer(answerIdx)
    setIsCorrect(correct)
    setPointsChange(pts)
    setScore((prev) => Math.max(0, prev + pts))
    setLevelScore((prev) => prev + pts)
    if (correct) {
      setLevelCorrectCount((prev) => prev + 1)
    }
    setScreen('feedback')
  }

  const handleFeedbackNext = () => {
    const level = levels[currentLevel]
    if (currentQuestion + 1 < level.questions.length) {
      setCurrentQuestion((prev) => prev + 1)
      setScreen('game')
    } else {
      // Level finished
      const passed = levelCorrectCount >= level.requiredCorrect
      const newLevelScores = [...levelScores]
      newLevelScores[currentLevel] = levelScore
      setLevelScores(newLevelScores)

      const newLevelPassed = [...levelPassed]
      if (passed) {
        newLevelPassed[currentLevel] = true
        setLevelPassed(newLevelPassed)
        if (currentLevel + 1 < levels.length) {
          setUnlockedLevel(Math.max(unlockedLevel, currentLevel + 1))
        }
      }
      setScreen('levelComplete')
    }
  }

  const handleLevelCompleteNext = () => {
    const level = levels[currentLevel]
    const passed = levelCorrectCount >= level.requiredCorrect

    if (!passed) {
      // Retry level - reset score for this level
      setScore((prev) => prev - levelScore)
      handleSelectLevel(currentLevel)
      return
    }

    if (currentLevel + 1 >= levels.length) {
      // Game complete - save to leaderboard (async, fire and forget)
      saveToLeaderboard({
        name: playerName,
        score,
        date: new Date().toLocaleDateString('bg-BG'),
      })
      setScreen('gameComplete')
    } else {
      setScreen('levelMap')
    }
  }

  const handleRestart = () => {
    setScreen('start')
  }

  const handleShowLeaderboard = (from: Screen) => {
    setPreviousScreen(from)
    setScreen('leaderboard')
  }

  const handleShowInfo = (from: Screen) => {
    setPreviousScreen(from)
    setScreen('info')
  }

  const handleBack = () => {
    setScreen(previousScreen)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-slate-950 text-white overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-pink-600/8 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {screen === 'start' && (
          <StartScreen
            onStart={handleStartGame}
            onLeaderboard={() => handleShowLeaderboard('start')}
            onInfo={() => handleShowInfo('start')}
          />
        )}

        {screen === 'name' && <NameScreen onSubmit={handleNameSubmit} />}

        {screen === 'levelMap' && (
          <LevelMapScreen
            unlockedLevel={unlockedLevel}
            totalScore={score}
            onSelectLevel={handleSelectLevel}
            onBack={handleRestart}
            levelScores={levelScores}
            levelPassed={levelPassed}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            levelIdx={currentLevel}
            questionIdx={currentQuestion}
            score={score}
            onAnswer={handleAnswer}
            onQuit={() => setScreen('levelMap')}
          />
        )}

        {screen === 'feedback' && (
          <FeedbackScreen
            question={levels[currentLevel].questions[currentQuestion]}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            pointsChange={pointsChange}
            onNext={handleFeedbackNext}
          />
        )}

        {screen === 'levelComplete' && (
          <LevelCompleteScreen
            levelIdx={currentLevel}
            correctCount={levelCorrectCount}
            totalQuestions={levels[currentLevel].questions.length}
            levelScore={levelScore}
            totalScore={score}
            passed={levelCorrectCount >= levels[currentLevel].requiredCorrect}
            onNext={handleLevelCompleteNext}
          />
        )}

        {screen === 'gameComplete' && (
          <GameCompleteScreen
            totalScore={score}
            playerName={playerName}
            onLeaderboard={() => handleShowLeaderboard('gameComplete')}
            onRestart={handleRestart}
            onInfo={() => handleShowInfo('gameComplete')}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            currentPlayer={playerName}
            onBack={handleBack}
          />
        )}

        {screen === 'info' && <ProgramInfoScreen onBack={handleBack} />}
      </div>
    </div>
  )
}
