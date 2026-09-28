import React, { useState } from 'react'
import { ONBOARDING_STEPS } from './onboardingData'
import { CreatedGf } from './CreateGfView'

interface CreateGfModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (gf: CreatedGf) => void
}

export function CreateGfModal({ isOpen, onClose, onCreate }: CreateGfModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [customName, setCustomName] = useState('')

  if (!isOpen) return null

  const currentStep = ONBOARDING_STEPS[currentStepIndex]
  const totalSteps = ONBOARDING_STEPS.length
  const isLastStep = currentStepIndex === totalSteps - 1

  const isNextDisabled = isLastStep
    ? !customName.trim()
    : !answers[currentStep.id]

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: optionId }))
  }

// CreateGfModal.tsx (Фрагмент метода handleNext)

const handleNext = () => {
    if (isNextDisabled) return
  
    if (isLastStep) {
      // Генерируем рандомный аватар от 1 до 7
      const randomAvatarNum = Math.floor(Math.random() * 7) + 1
      const chosenAvatar = `/avatars/${randomAvatarNum}.jpg`
  
      const newGf: CreatedGf = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        role: answers[3] ? getRoleLabel(answers[3]) : 'Custom GF',
        category: 'AI Girls',
        avatar: chosenAvatar,
        status: 'Active',
        description: `Your custom AI Girlfriend. Style: ${answers[5] || 'Seductive'}.`,
      }
  
      onCreate(newGf)
      onClose()
      
      // Сброс полей
      setCurrentStepIndex(0)
      setAnswers({})
      setCustomName('')
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col">
        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1.5">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex flex-col items-center text-center overflow-y-auto max-h-[80vh]">
          {/* Avatar 1x1 */}
          <div className="relative my-3 h-44 w-44 shrink-0 overflow-hidden rounded-2xl ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/10">
            <img
              src={currentStep.avatar}
              alt={currentStep.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/photos/pic1.jpg'
              }}
            />
          </div>

          {/* Titles */}
          <h2 className="text-2xl font-bold text-white font-display mb-1">
            {currentStep.title}
          </h2>
          <p className="text-sm text-white/60 mb-6 max-w-md">
            {currentStep.subtitle}
          </p>

          {/* Options */}
          {currentStep.type === 'single' && currentStep.options && (
            <div className="w-full space-y-2.5 mb-6">
              {currentStep.options.map((opt) => {
                const isSelected = answers[currentStep.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/10 ring-1 ring-pink-500/50'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-sm font-semibold text-white">{opt.label}</div>
                      {opt.description && (
                        <div className="text-xs text-white/50 mt-0.5">{opt.description}</div>
                      )}
                    </div>
                    {/* Custom Radio Circle */}
                    <div
                      className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Input for Final Step */}
          {currentStep.type === 'text' && (
            <div className="w-full mb-6">
              <input
                type="text"
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={currentStep.placeholder}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-center text-lg text-white placeholder-white/30 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isNextDisabled}
            onClick={handleNext}
            className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all shadow-lg ${
              isNextDisabled
                ? 'bg-neutral-800 text-white/30 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] shadow-pink-500/25'
            }`}
          >
            {isLastStep ? 'Meet Your Dream AI Girlfriend' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getRoleLabel(characterId: string): string {
  switch (characterId) {
    case 'arrogant': return 'Arrogant Queen'
    case 'gentle': return 'Sweet & Caring'
    case 'shy': return 'Shy Cutie'
    case 'playful': return 'Playful Tease'
    default: return 'Custom Personality'
  }
}