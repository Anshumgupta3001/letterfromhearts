import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const QUESTIONS = [
  {
    key: 'ageRange',
    q: 'How old are you?',
    options: ['Under 24', '25 to 34', '35 to 44', '45 or older'],
  },
  {
    key: 'identity',
    q: 'How do you identify?',
    options: ['Woman', 'Man', 'Non-binary', 'Prefer not to say'],
  },
  {
    key: 'profession',
    q: 'What do you do?',
    options: ['Student', 'Working professional', 'Freelancer or self-employed', 'Homemaker', 'Between jobs', 'Retired'],
  },
  {
    key: 'unsaidFeelings',
    q: 'What usually goes unsaid for you?',
    options: [
      'Things I feel but can\'t find words for',
      'Things I know exactly but can\'t bring myself to say',
      'Anger, I swallow it instead of showing it',
      'Gratitude, I feel it but rarely express it',
    ],
  },
  {
    key: 'unfinishedRelationship',
    q: 'Is there a relationship in your life that feels unfinished?',
    options: [
      'Yes, with someone I\'ve lost',
      'Yes, with someone still in my life',
      'Yes, with a version of myself',
      'Not really. I feel mostly at peace.',
    ],
  },
  {
    key: 'writingExperience',
    q: 'What does writing feel like for you?',
    options: [
      'It\'s how I make sense of things, natural and easy',
      'I want to write but I never know where to start',
      'I\'ve avoided it, it feels too real when it\'s on paper',
      'I\'ve never really tried it as a way to process things',
    ],
  },
  {
    key: 'feelingHeard',
    q: 'When did you last feel truly heard by someone?',
    options: [
      'Recently, I have people who get me',
      'A while ago. Things have shifted.',
      'I\'m not sure I ever have, fully',
      'I don\'t need to be heard. I just need to say it.',
    ],
  },
  {
    key: 'unspokenReason',
    q: 'What\'s the main reason you haven\'t said what you needed to say?',
    options: [
      'I don\'t want to hurt them',
      'I\'m afraid of how they\'ll react',
      'The moment has passed, it\'s too late now',
      'I don\'t fully understand it myself yet',
    ],
  },
  {
    key: 'selfTreatment',
    q: 'How do you usually treat yourself when you\'re struggling?',
    options: [
      'I\'m patient with myself, I try to be kind',
      'I push through and expect myself to cope',
      'I\'m harder on myself than I\'d ever be on a friend',
      'I don\'t really think about it. I just get through it.',
    ],
  },
  {
    key: 'writingBenefit',
    q: 'What would writing a letter here actually give you?',
    options: [
      'Permission to finally say something',
      'Proof that someone out there will listen',
      'Clarity, I think better when I write',
      'A way to let go of something I\'ve been carrying',
    ],
  },
  {
    key: 'supportStyle',
    q: 'What kind of support feels most natural to receive?',
    options: [
      'Words, someone telling me it makes sense',
      'Presence, just someone being there quietly',
      'Perspective, someone helping me see it differently',
      'Space, no advice, just somewhere to put it',
    ],
  },
  {
    key: 'writingRelief',
    q: 'Have you ever felt relief just from writing something down, even if no one read it?',
    options: [
      'Yes, writing has always helped me',
      'Once or twice, but I don\'t do it regularly',
      'No, but I\'ve always been curious',
      'No, I need someone to actually receive it',
    ],
  },
]

export default function OnboardingModal() {
  const { updateAuthUser } = useApp()
  const [step,     setStep]     = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [loading,  setLoading]  = useState(false)
  const [animKey,  setAnimKey]  = useState(0)

  const total    = QUESTIONS.length
  const current  = QUESTIONS[step]
  const progress = ((step) / total) * 100

  async function submit(finalAnswers) {
    setLoading(true)
    try {
      const res  = await apiFetch('/api/onboarding', {
        method: 'POST',
        body:   JSON.stringify(finalAnswers),
      })
      const json = await res.json()
      if (json.success) updateAuthUser({ hasCompletedOnboarding: true })
    } catch {
      // silently complete — don't block the user
      updateAuthUser({ hasCompletedOnboarding: true })
    } finally {
      setLoading(false)
    }
  }

  function select(option) {
    const next = { ...answers, [current.key]: option }
    setAnswers(next)
    if (step < total - 1) {
      setAnimKey(k => k + 1)
      setStep(s => s + 1)
    } else {
      submit(next)
    }
  }

  function back() {
    if (step === 0) return
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  return (
    <>
      <style>{`
        @keyframes lfh-slide-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lfh-question-card { animation: lfh-slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .lfh-opt:hover { background: rgba(196,99,58,0.06) !important; border-color: rgba(196,99,58,0.35) !important; }
        .lfh-opt:active { transform: scale(0.985); }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(28,26,23,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 520,
            background: 'var(--paper)',
            borderRadius: 24,
            boxShadow: '0 32px 80px rgba(28,26,23,0.22)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100dvh - 32px)',
          }}
        >
          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(28,26,23,0.07)', flexShrink: 0 }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--tc)',
                borderRadius: 99,
                transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', padding: '32px 28px 20px', flex: 1 }}>

            {/* Step counter */}
            <div
              style={{
                fontSize: 11, fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase',
                color: 'var(--tc)', marginBottom: 20,
              }}
            >
              {step + 1} of {total}
            </div>

            {/* Question */}
            <div key={animKey} className="lfh-question-card">
              <h2
                style={{
                  fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 500,
                  color: 'var(--ink)', lineHeight: 1.4, marginBottom: 24,
                }}
              >
                {current.q}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {current.options.map(opt => {
                  const selected = answers[current.key] === opt
                  return (
                    <button
                      key={opt}
                      className="lfh-opt"
                      onClick={() => select(opt)}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        padding: '13px 16px', borderRadius: 12,
                        fontFamily: '"DM Sans", sans-serif', fontSize: 13.5, lineHeight: 1.55,
                        fontWeight: selected ? 500 : 400,
                        color: selected ? 'var(--tc)' : 'var(--ink)',
                        background: selected ? 'rgba(196,99,58,0.07)' : 'var(--cream)',
                        border: `1px solid ${selected ? 'var(--tc)' : 'rgba(28,26,23,0.12)'}`,
                        boxShadow: selected ? '0 0 0 3px rgba(196,99,58,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <span>{opt}</span>
                      {selected && (
                        <span
                          style={{
                            flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                            background: 'var(--tc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 28px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: '0.5px solid rgba(28,26,23,0.07)', flexShrink: 0,
            }}
          >
            {step > 0 ? (
              <button
                onClick={back}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)',
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Back
              </button>
            ) : <div />}

            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
              {loading ? 'Saving your answers...' : 'Select an option to continue'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
