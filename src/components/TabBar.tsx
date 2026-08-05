export type TabType = 'chats' | 'create' | 'reels'

interface TabBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center justify-around border-t border-white/10 bg-surface-dark/80 px-4 py-2 backdrop-blur-md">
      <button
        onClick={() => onTabChange('chats')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all ${
          activeTab === 'chats' ? 'text-accent scale-105' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <span className="text-xl">💬</span>
        <span className="text-xs font-medium mt-0.5">Chats</span>
      </button>

      <button
        onClick={() => onTabChange('create')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all ${
          activeTab === 'create' ? 'text-accent scale-105' : 'text-white/50 hover:text-white/80'
      }`}
      >
        <span className="text-xl">✨</span>
        <span className="text-xs font-medium mt-0.5">Create GF</span>
      </button>

      <button
        onClick={() => onTabChange('reels')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all ${
          activeTab === 'reels' ? 'text-accent scale-105' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <span className="text-xl">🎬</span>
        <span className="text-xs font-medium mt-0.5">Reels</span>
      </button>
    </div>
  )
}
