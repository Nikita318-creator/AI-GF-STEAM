import React, { useState } from 'react'
import { CreateGfModal } from './CreateGfModal'

export interface CreatedGf {
  id: string
  name: string
  role: string
  category: 'AI Girls' | 'Anime' | 'MILF' | 'Ex'
  avatar: string
  status: 'Active' | 'Draft'
  description: string
}

interface CreateGfViewProps {
  onSelectChat?: (characterId: string) => void
}

export function CreateGfView({ onSelectChat }: CreateGfViewProps) {
  const [gfs, setGfs] = useState<CreatedGf[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setGfs((prev) =>
      prev.map((gf) =>
        gf.id === id
          ? { ...gf, status: gf.status === 'Active' ? 'Draft' : 'Active' }
          : gf
      )
    )
  }

  const handleCreatedNewGf = (newGf: CreatedGf) => {
    setGfs((prev) => [newGf, ...prev])
  }

  const filteredGfs = gfs.filter((gf) =>
    filterCategory === 'All' ? true : gf.category === filterCategory
  )

  return (
    <div className="flex flex-1 flex-col p-6 overflow-y-auto bg-surface-dark/50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Create Your Ideal GF</h1>
          <p className="text-sm text-white/50">Manage and construct custom AI personalities</p>
        </div>
        {gfs.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
          >
            + Create New
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      {gfs.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {['All', 'AI Girls', 'Anime', 'MILF', 'Ex'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? 'bg-white/15 text-white ring-1 ring-white/20'
                  : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {gfs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-neutral-900/30 my-auto min-h-[360px]">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-4 ring-1 ring-pink-500/30">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">No AI Girlfriends Created Yet</h2>
          <p className="text-sm text-white/40 max-w-md mb-6">
            You haven't created any AI girlfriends yet. Click the button below to build your first custom companion and start chatting!
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
          >
            + Create New Girlfriend
          </button>
        </div>
      ) : filteredGfs.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-white/30">
          No girlfriends in this category
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredGfs.map((gf) => (
            <div
              key={gf.id}
              onClick={() => onSelectChat?.(gf.id)}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-md cursor-pointer transition-all hover:border-pink-500/40 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-pink-500/5 group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 bg-neutral-800 transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={gf.avatar}
                      alt={gf.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/photos/pic1.jpg'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate group-hover:text-pink-400 transition-colors">
                        {gf.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-white/30 px-2 py-0.5 rounded bg-white/5">
                        {gf.category}
                      </span>
                    </div>
                    <p className="text-xs text-pink-400 font-medium truncate">{gf.role}</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 line-clamp-2 mb-4">
                  {gf.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={(e) => toggleStatus(gf.id, e)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    gf.status === 'Active'
                      ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30'
                  }`}
                >
                  {gf.status}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className="text-xs font-medium text-white/40 hover:text-white transition"
                >
                  Edit Config →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Modal */}
      <CreateGfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreatedNewGf}
      />
    </div>
  )
}