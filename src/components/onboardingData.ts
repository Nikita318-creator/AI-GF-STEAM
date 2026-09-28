export interface OnboardingOption {
    id: string
    label: string
    description?: string
  }
  
  export interface OnboardingStep {
    id: number
    type: 'single' | 'text'
    title: string
    subtitle: string
    avatar: string
    placeholder?: string
    options?: OnboardingOption[]
  }
  
  export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
      id: 1,
      type: 'single',
      title: 'Choose Her Eye Aesthetic',
      subtitle: 'What kind of look should she give you before she whispers her darkest secrets?',
      avatar: '/photos/pic1.jpg',
      options: [
        {
          id: 'mysterious_purple',
          label: 'Mysterious Purple',
          description: 'Deep, hypnotic eyes that look right through you and leave you craving more.',
        },
        {
          id: 'glowing_red',
          label: 'Glowing Red',
          description: 'A dangerous, passionate gaze that promises an unforgettable experience.',
        },
        {
          id: 'big_doe',
          label: 'Big Doe Eyes',
          description: 'Innocent, sweet, and irresistible—asking you to take full control.',
        },
        {
          id: 'almond',
          label: 'Almond Eyes',
          description: 'Sultry, sharp, and confident. A gaze that commands your entire attention.',
        },
      ],
    },
    {
      id: 2,
      type: 'single',
      title: 'Select Her Body Type',
      subtitle: 'How do you want your ideal girl to look and feel when she is all yours?',
      avatar: '/photos/pic2.jpg',
      options: [
        {
          id: 'petite',
          label: 'Slim & Petite',
          description: 'Delicate, tight, and perfect to hold tight in your arms all night long.',
        },
        {
          id: 'hourglass',
          label: 'Hourglass Curves',
          description: 'Snagged waist, thick hips, and body lines designed to drive you wild.',
        },
        {
          id: 'curvy',
          label: 'Lush & Voluptuous',
          description: 'Busty, soft, and extra curvy in all the right places.',
        },
        {
          id: 'fit',
          label: 'Fit & Toned',
          description: 'Athletic, tight stomach, and an energetic vibe that never quits.',
        },
      ],
    },
    {
      id: 3,
      type: 'single',
      title: 'Pick Her Personality',
      subtitle: 'How should she talk to you in private when it is just the two of you?',
      avatar: '/photos/pic3.jpg',
      options: [
        {
          id: 'playful',
          label: 'Playful Tease',
          description: 'Flirty, mischievous, and loves sending provocative messages to tease you.',
        },
        {
          id: 'gentle',
          label: 'Sweet & Devoted',
          description: 'Loves you unconditionally, obsessing over your every desire.',
        },
        {
          id: 'arrogant',
          label: 'Dominant Queen',
          description: 'Demanding, confident, and takes pleasure in teasing you until you beg.',
        },
        {
          id: 'shy',
          label: 'Shy Cutie',
          description: 'Blushes easily, eager to please you, and slowly opens up her wildest sides.',
        },
      ],
    },
    {
      id: 4,
      type: 'single',
      title: 'Define Her Desires',
      subtitle: 'What is her primary goal when spending late nights alone with you?',
      avatar: '/photos/pic4.jpg',
      options: [
        {
          id: 'seduction',
          label: 'Pure Seduction',
          description: 'Sending intimate photos, unfiltered voice notes, and teasing mind games.',
        },
        {
          id: 'romance',
          label: 'Deep Intimacy',
          description: 'Late-night cozy talks, deep emotional bond, and passionate affection.',
        },
        {
          id: 'wild',
          label: 'Wild & Uncensored',
          description: 'No taboo topics, wild fantasies, and raw midnight roleplay.',
        },
      ],
    },
    {
      id: 5,
      type: 'text',
      title: 'Give Her a Name',
      subtitle: 'Name your custom dream girl. She is waiting to hear you call her name...',
      avatar: '/photos/pic5.jpg',
      placeholder: 'Enter her name (e.g. Jessica, Chloe, Lexi)...',
    },
  ]