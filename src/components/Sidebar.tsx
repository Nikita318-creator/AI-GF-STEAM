import type { Character } from '@/types/chat'

interface SidebarProps {
  character: Character
}

export function Sidebar({ character }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-surface-dark/50 p-6 backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full ring-2 ring-accent/30">
          <img
            src={character.avatar}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="font-display text-xl font-bold text-white">
          {character.name}
        </h2>
        <p className="mt-1 text-xs text-white/50">{character.mood}</p>
      </div>
    </aside>
  )
}