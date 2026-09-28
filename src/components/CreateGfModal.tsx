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

  // Сброс всех состояний при закрытии на крестик
  const handleClose = () => {
    setCurrentStepIndex(0)
    setAnswers({})
    setCustomName('')
    onClose()
  }

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: optionId }))
  }

  const handleNext = () => {
    if (isNextDisabled) return

    if (isLastStep) {
      // Step 1 choice drives the avatar mapping
      const eyeChoice = answers[1]
      let chosenAvatarNumber = 1

      switch (eyeChoice) {
        case 'almond':
          chosenAvatarNumber = Math.random() < 0.5 ? 1 : 2
          break
        case 'big_doe':
          chosenAvatarNumber = Math.random() < 0.5 ? 3 : 4
          break
        case 'glowing_red':
          chosenAvatarNumber = Math.random() < 0.5 ? 5 : 6
          break
        case 'mysterious_purple':
          chosenAvatarNumber = Math.random() < 0.5 ? 7 : 8
          break
        default:
          chosenAvatarNumber = Math.floor(Math.random() * 8) + 1
      }

      const chosenAvatar = `/avatars/myGF${chosenAvatarNumber}.jpg`

      const newGf: CreatedGf = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        role: answers[3] ? getRoleLabel(answers[3]) : 'Custom GF',
        category: 'AI Girls',
        avatar: chosenAvatar,
        status: 'Active',
        description: `Your custom dream AI companion. Personality: ${answers[3] || 'Playful'}. Body type: ${answers[2] || 'Hourglass'}.`,
      }

      onCreate(newGf)
      handleClose()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col">
        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-2">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <span className="text-sm font-bold uppercase tracking-wider text-pink-400">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Container */}
        <div className="px-8 pb-8 flex-1 flex flex-col items-center text-center overflow-y-auto">
          {/* Bigger Avatar */}
          <div className="relative my-4 h-64 w-64 shrink-0 overflow-hidden rounded-3xl ring-4 ring-pink-500/30 shadow-2xl shadow-pink-500/20">
            <img
              src={currentStep.avatar}
              alt={currentStep.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/photos/pic1.jpg'
              }}
            />
          </div>

          {/* Titles & Subtitles */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display mb-2">
            {currentStep.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mb-8 max-w-xl">
            {currentStep.subtitle}
          </p>

          {/* Options List */}
          {currentStep.type === 'single' && currentStep.options && (
            <div className="w-full max-w-2xl space-y-3.5 mb-8">
              {currentStep.options.map((opt) => {
                const isSelected = answers[currentStep.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/15 ring-2 ring-pink-500/50 scale-[1.01]'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="pr-4">
                      <div className="text-base sm:text-lg font-bold text-white">{opt.label}</div>
                      {opt.description && (
                        <div className="text-sm text-white/60 mt-1">{opt.description}</div>
                      )}
                    </div>
                    {/* Custom Radio Circle */}
                    <div
                      className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-white/40 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Input for Final Step */}
          {currentStep.type === 'text' && (
            <div className="w-full max-w-lg mb-8">
              <input
                type="text"
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={currentStep.placeholder}
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-center text-xl text-white placeholder-white/30 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all shadow-inner"
              />
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="w-full max-w-2xl mt-auto pt-2">
            <button
              type="button"
              disabled={isNextDisabled}
              onClick={handleNext}
              className={`w-full rounded-2xl py-4 text-base font-bold uppercase tracking-wider text-white transition-all shadow-xl ${
                isNextDisabled
                  ? 'bg-neutral-800 text-white/30 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.01] active:scale-[0.99] shadow-pink-500/30'
              }`}
            >
              {isLastStep ? 'Meet Your Ideal AI GF 🔥' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoleLabel(characterId: string): string {
  switch (characterId) {
    case 'arrogant':
      return 'Dominant Queen'
    case 'gentle':
      return 'Sweet & Devoted'
    case 'shy':
      return 'Shy Cutie'
    case 'playful':
      return 'Playful Tease'
    default:
      return 'Custom Personality'
  }
}