export interface OnboardingOption {
    id: string
    label: string
    description?: string
  }
  
  export interface OnboardingStep {
    id: number
    avatar: string
    title: string
    subtitle: string
    type: 'single' | 'text'
    options?: OnboardingOption[]
    placeholder?: string
  }
  
  export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
      id: 1,
      avatar: '/avatars/1.jpg',
      title: 'Hair Color',
      subtitle: 'Which look makes your heart beat faster?',
      type: 'single',
      options: [
        { id: 'blonde', label: 'Platinum Blonde', description: 'Bright, irresistible, and eye-catching' },
        { id: 'brunette', label: 'Dark Brunette', description: 'Seductive, mysterious, and passionate' },
        { id: 'redhead', label: 'Fiery Redhead', description: 'Wild, bold, and unpredictable' },
        { id: 'raven', label: 'Jet Black', description: 'Elegant, deep, and sophisticated' },
      ],
    },
    {
      id: 2,
      avatar: '/avatars/2.jpg',
      title: 'Her Eyes',
      subtitle: 'Choose the eye color you want to get lost in',
      type: 'single',
      options: [
        { id: 'blue', label: 'Ocean Blue', description: 'Captivating, clear, and mesmerizing' },
        { id: 'green', label: 'Emerald Green', description: 'Playful, seductive, and fierce' },
        { id: 'hazel', label: 'Warm Hazel / Dark', description: 'Deep, intense, and full of desire' },
        { id: 'violet', label: 'Exotic Violet', description: 'Rare, magical, and totally addictive' },
      ],
    },
    {
      id: 3,
      avatar: '/avatars/3.jpg',
      title: 'Personality & Vibe',
      subtitle: 'What kind of attitude drives you crazy?',
      type: 'single',
      options: [
        { id: 'arrogant', label: 'Arrogant Queen', description: 'Loves to tease, demand attention, and dominate' },
        { id: 'gentle', label: 'Sweet & Caring', description: 'Smothers you with warmth, affection, and unconditional love' },
        { id: 'shy', label: 'Shy Cutie', description: 'Blushes at your compliments, but unleashes in private' },
        { id: 'playful', label: 'Playful Tease', description: 'Constantly flirts, makes jokes, and hints at more' },
      ],
    },
    {
      id: 4,
      avatar: '/avatars/4.jpg',
      title: 'Her Passions',
      subtitle: 'How does she spend her free time with you?',
      type: 'single',
      options: [
        { id: 'gaming', label: 'Gamer Girl', description: 'Stays up all night playing games and sharing memes' },
        { id: 'fitness', label: 'Fitness Addict', description: 'Loves tight gym wear, staying fit, and active lifestyle' },
        { id: 'parties', label: 'Party Girl', description: 'Loves dancing, cocktails, nightlife, and wild fun' },
        { id: 'cozy', label: 'Cozy Homebody', description: 'Prefers movie nights, cuddling, and deep intimate chats' },
      ],
    },
    {
      id: 5,
      avatar: '/avatars/5.jpg',
      title: 'Favorite Outfit',
      subtitle: 'What should she wear when she greets you?',
      type: 'single',
      options: [
        { id: 'lingerie', label: 'Lace Lingerie & Thong', description: 'Minimal clothing, maximum temptation' },
        { id: 'swimsuit', label: 'Bikini / Swimwear', description: 'Hot beach look showing off every curve' },
        { id: 'cosplay', label: 'Spicy Cosplay', description: 'Anime, maid, nurse, or bunny suit' },
        { id: 'casual_hot', label: 'Tight Mini Dress', description: 'Classy on the outside, hot on the inside' },
      ],
    },
    {
      id: 6,
      avatar: '/avatars/6.jpg',
      title: 'Secret Kinks & Fetishes',
      subtitle: 'What unlocks her deepest desires?',
      type: 'single',
      options: [
        { id: 'roleplay', label: 'Roleplay & Dirty Talk', description: 'Loves getting lost in naughty scenarios' },
        { id: 'teasing', label: 'Tease & Denial', description: 'Pushes you to the limit before giving in' },
        { id: 'photo_sharing', label: 'Spontaneous Hot Selfies', description: 'Sends unexpected spicy pictures out of nowhere' },
        { id: 'submissive', label: 'Total Submission', description: 'Eager to fulfill your every fantasy' },
      ],
    },
    {
      id: 7,
      avatar: '/avatars/7.jpg',
      title: 'Name Your AI GF',
      subtitle: 'Give your dream companion a name to finalize her',
      type: 'text',
      placeholder: 'e.g. Eva, Mila, Aria...',
    },
  ]