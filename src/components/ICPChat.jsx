import { useState, useRef, useEffect } from 'react'
import Bubble from './Bubble'
import TypingIndicator from './TypingIndicator'
import DiscPills from './DiscPills'
import ResultCard from './ResultCard'
import { STAGE_QUESTIONS } from '../data/icp-prompts'

const TOTAL_STAGES = 4

function useScrollToBottom(dep) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [dep])
  return ref
}

export default function ICPChat() {
  const [disc, setDisc] = useState('')
  const [stage, setStage] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [firstAnswer, setFirstAnswer] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [profile, setProfile] = useState(null)
  const [done, setDone] = useState(false)
  // answers[i] = { stage: i, text: string }
  const [answers, setAnswers] = useState([])
  const scrollRef = useScrollToBottom(messages)
  const inputRef = useRef(null)

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg])
  }

  function startSession() {
    if (!disc) return
    setStarted(true)
    addMessage({
      id: Date.now(),
      role: 'ai',
      text: STAGE_QUESTIONS[0].question,
      isChallenge: false
    })
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading || done) return
    setInput('')

    addMessage({ id: Date.now(), role: 'user', text })

    const currentFirstAnswer = attempt === 1 ? text : firstAnswer

    if (attempt === 1) setFirstAnswer(text)

    setLoading(true)

    try {
      const res = await fetch('/api/icp-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          attempt,
          disc,
          first_answer: currentFirstAnswer,
          latest_answer: text
        })
      })

      const data = await res.json()

      if (!res.ok) {
        addMessage({ id: Date.now(), role: 'ai', text: 'Something went wrong. Please try again.', isChallenge: false })
        setLoading(false)
        return
      }

      if (data.isAdvance) {
        // Record the answer for this stage
        const stageAnswer = { stage, text: attempt === 1 ? text : text }
        const newAnswers = [...answers, stageAnswer]
        setAnswers(newAnswers)

        // Show the acknowledgement
        if (data.reply) {
          addMessage({ id: Date.now(), role: 'ai', text: data.reply, isChallenge: false })
        }

        if (stage < TOTAL_STAGES - 1) {
          const nextStage = stage + 1
          setStage(nextStage)
          setAttempt(1)
          setFirstAnswer('')
          addMessage({
            id: Date.now() + 1,
            role: 'ai',
            text: STAGE_QUESTIONS[nextStage].question,
            isChallenge: false
          })
        } else {
          await generateResult(newAnswers)
        }
      } else {
        const nextAttempt = attempt + 1
        addMessage({ id: Date.now(), role: 'ai', text: data.reply, isChallenge: true, attemptNum: attempt })
        setAttempt(nextAttempt)
      }
    } catch {
      addMessage({ id: Date.now(), role: 'ai', text: 'Network error. Please try again.', isChallenge: false })
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  function handleMoveOn() {
    const text = firstAnswer || '[skipped]'
    const stageAnswer = { stage, text }
    const newAnswers = [...answers, stageAnswer]
    setAnswers(newAnswers)

    if (stage < TOTAL_STAGES - 1) {
      const nextStage = stage + 1
      setStage(nextStage)
      setAttempt(1)
      setFirstAnswer('')
      addMessage({
        id: Date.now(),
        role: 'ai',
        text: STAGE_QUESTIONS[nextStage].question,
        isChallenge: false
      })
    } else {
      generateResult(newAnswers)
    }
  }

  async function generateResult(finalAnswers) {
    setLoading(true)
    addMessage({ id: Date.now(), role: 'ai', text: 'Building your ICP profile...', isChallenge: false })

    try {
      const res = await fetch('/api/icp-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disc, answers: finalAnswers })
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        setDone(true)
      } else {
        addMessage({ id: Date.now(), role: 'ai', text: 'Failed to generate profile. Please reload and try again.', isChallenge: false })
      }
    } catch {
      addMessage({ id: Date.now(), role: 'ai', text: 'Network error generating profile.', isChallenge: false })
    }

    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showMoveOn = attempt > 2 && !loading && !done

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-black text-offwhite text-sm uppercase tracking-widest">Advantage</span>
          <span className="text-midgrey text-sm ml-2">ICP Finder</span>
        </div>
        {started && !done && (
          <span className="text-midgrey text-sm">
            Stage <span className="text-offwhite font-black">{stage + 1}</span> / {TOTAL_STAGES}
          </span>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {!started ? (
          <div className="max-w-xl mx-auto pt-8">
            <h1 className="font-black text-offwhite text-2xl mb-2">Find your ideal client profile.</h1>
            <p className="text-midgrey text-sm mb-8 leading-relaxed">
              Four stages. Two challenges per stage. A positioning statement narrow enough to make you slightly uncomfortable.
            </p>
            <DiscPills selected={disc} onSelect={setDisc} />
            <button
              onClick={startSession}
              disabled={!disc}
              className="mt-4 px-6 py-3 bg-yellow text-ink font-black text-sm rounded-xl disabled:opacity-40 hover:bg-[#c9ce1a] transition-colors"
            >
              Start
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Bubble key={msg.id} role={msg.role} text={msg.text} isChallenge={msg.isChallenge} />
            ))}
            {loading && <TypingIndicator />}
            {showMoveOn && (
              <div className="flex justify-end pr-1">
                <button
                  onClick={handleMoveOn}
                  className="text-midgrey text-xs hover:text-offwhite transition-colors underline underline-offset-2"
                >
                  Move on anyway
                </button>
              </div>
            )}
            {done && profile && (
              <ResultCard profile={profile} />
            )}
          </>
        )}
      </div>

      {/* Input */}
      {started && !done && (
        <div className="shrink-0 border-t border-[#222] px-4 py-4">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={STAGE_QUESTIONS[stage]?.placeholder || 'Type your answer...'}
              disabled={loading || attempt > 2}
              rows={3}
              className="flex-1 bg-bubble text-offwhite text-sm rounded-xl px-4 py-3 resize-none border border-[#2a2a2a] focus:border-midgrey focus:outline-none placeholder:text-midgrey disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || attempt > 2}
              className="px-5 py-3 bg-yellow text-ink font-black text-sm rounded-xl disabled:opacity-40 hover:bg-[#c9ce1a] transition-colors self-end"
            >
              Send
            </button>
          </div>
          <p className="text-midgrey text-xs text-center mt-2">Enter to send, Shift+Enter for new line</p>
        </div>
      )}
    </div>
  )
}
