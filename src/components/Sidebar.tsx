import type { Character } from '@/types/chat'

interface SidebarProps {
  character: Character
}

interface GirlProfile {
  age: number
  location: string
  bio: string
}

// База локаций и био для генерации уникальных карточек профиля
const LOCATIONS = [
  'Tokyo, Japan',
  'Paris, France',
  'New York, USA',
  'London, UK',
  'Seoul, South Korea',
  'Berlin, Germany',
  'Los Angeles, USA',
  'Milan, Italy',
  'Sydney, Australia',
  'Toronto, Canada',
  'Kyoto, Japan',
  'Barcelona, Spain',
  'Amsterdam, Netherlands',
  'Stockholm, Sweden',
  'Vienna, Austria'
]

const BIOS = [
  'Passionate about art, night walks in the city, and quiet coffee shops.',
  'Digital creator & fashion enthusiast. Always looking for new inspiration.',
  'Gamer at heart, loves anime, rainy days, and cozy late-night conversations.',
  'Fitness junkie, travel lover, and amateur photographer capturing everyday moments.',
  'Music lover, bookworm, and big fan of late-night heart-to-heart talks.',
  'Coffee addict, dream chaser, and lover of aesthetic aesthetics.',
  'Exploring the world one city at a time. Tell me your favorite story!',
  'Introvert with a big imagination. Let’s create unforgettable memories together.'
]

// Получение номера аватарки из пути
function getAvatarNumber(avatarPath?: string): number {
  if (!avatarPath) return 0
  const fileName = avatarPath.split('/').pop() || ''
  const num = parseInt(fileName, 10)
  return isNaN(num) ? 0 : num
}

// Хэш-функция для детерминированной (персистентной) генерации данных по ключу аватара
function getHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Определение уникального идентификатора аватара из пути (1-26 или myGF1-myGF8)
function getAvatarKey(avatarPath?: string): string {
  if (!avatarPath) return 'default'
  const fileName = avatarPath.split('/').pop() || ''
  const nameWithoutExt = fileName.split('.')[0]
  return nameWithoutExt || 'default'
}

// Генерация персистентных данных профиля
function getProfileForAvatar(avatarPath?: string): GirlProfile {
  const avatarNum = getAvatarNumber(avatarPath)

  // Явно заданный возраст для MILF (аватарки 21-25)
  const milfAges: Record<number, number> = {
    21: 47,
    22: 58,
    23: 65,
    24: 72,
    25: 41,
  }

  const key = getAvatarKey(avatarPath)
  const hash = getHash(key)

  // Если номер аватарки есть в маппинге milfAges, берем его, иначе генерируем 19..26
  const age = milfAges[avatarNum] ?? (19 + (hash % 8))
  const location = LOCATIONS[hash % LOCATIONS.length]
  const bio = BIOS[(hash >> 2) % BIOS.length]

  return { age, location, bio }
}

export function Sidebar({ character }: SidebarProps) {
  const profile = getProfileForAvatar(character.avatar)

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-surface-dark/60 p-6 backdrop-blur-md select-none overflow-y-auto">
      {/* Аватар и имя */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full ring-2 ring-accent/40 shadow-lg shadow-black/50">
          <img
            src={character.avatar}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">
          {character.name}
        </h2>
        <span className="mt-1 inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent border border-accent/20">
          {profile.age} y.o.
        </span>
      </div>

      <div className="my-6 h-px w-full bg-white/[0.06]" />

      {/* Детали профиля */}
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
            Location
          </span>
          <p className="mt-1 font-medium text-white/90 flex items-center gap-1.5">
            📍 {profile.location}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
            About
          </span>
          <p className="mt-1 text-xs leading-relaxed text-white/70 bg-black/20 p-3 rounded-lg border border-white/5">
            {profile.bio}
          </p>
        </div>
      </div>
    </aside>
  )
}