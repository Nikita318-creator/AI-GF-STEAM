import React, { useState } from 'react'

export interface CreatedGf {
  id: string
  name: string
  role: string
  category: 'AI Girls' | 'Anime' | 'MILF' | 'Ex'
  avatar: string
  status: 'Active' | 'Draft'
  description: string
}

const INITIAL_MOCK_GFS: CreatedGf[] = [
  {
    id: '1',
    name: 'Sakura',
    role: 'Anime Childhood Friend',
    category: 'Anime',
    avatar: '/avatars/11.jpg',
    status: 'Active',
    description: 'Energetic and caring childhood friend with a secret crush on you.',
  },
  {
    id: '2',
    name: 'Elena',
    role: 'Goth Cyberpunk Hacker',
    category: 'AI Girls',
    avatar: '/avatars/1.jpg',
    status: 'Active',
    description: 'Night City hacker who loves vintage synths and deep conversations.',
  },
  {
    id: '3',
    name: 'Victoria',
    role: 'Elegant Art Curator',
    category: 'MILF',
    avatar: '/avatars/21.jpg',
    status: 'Active',
    description: 'Sophisticated gallery manager who appreciates fine wine and intellectual debate.',
  },
  {
    id: '4',
    name: 'Chloe',
    role: 'High School Ex',
    category: 'Ex',
    avatar: '/avatars/26.jpg',
    status: 'Draft',
    description: 'Texted you at 2 AM out of nowhere. Drama guaranteed.',
  },
  {
    id: '5',
    name: 'Asuka',
    role: 'Tsundere Mecha Pilot',
    category: 'Anime',
    avatar: '/avatars/12.jpg',
    status: 'Active',
    description: 'Sharp-tongued, proud, but deeply loyal once you gain her trust.',
  },
  {
    id: '6',
    name: 'Samantha',
    role: 'Corporate Executive',
    category: 'MILF',
    avatar: '/avatars/22.jpg',
    status: 'Draft',
    description: 'Busy VP who values punctuality, efficiency, and quiet evenings.',
  },
]

export function CreateGfView() {
  const [gfs, setGfs] = useState<CreatedGf[]>(INITIAL_MOCK_GFS)
  const [filterCategory, setFilterCategory] = useState<string>('All')

  const toggleStatus = (id: string) => {
    setGfs((prev) =>
      prev.map((gf) =>
        gf.id === id
          ? { ...gf, status: gf.status === 'Active' ? 'Draft' : 'Active' }
          : gf
      )
    )
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
        <button
          type="button"
          onClick={() => {
            const newId = String(Date.now())
            const newGf: CreatedGf = {
              id: newId,
              name: `New Companion #${gfs.length + 1}`,
              role: 'Custom Personality',
              category: 'AI Girls',
              avatar: `/avatars/${(gfs.length % 26) + 1}.jpg`,
              status: 'Draft',
              description: 'Newly generated custom companion prompt settings.',
            }
            setGfs([newGf, ...gfs])
          }}
          className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
        >
          + Create New
        </button>
      </div>

      {/* Category Filter Pills */}
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

      {/* GF Cards Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredGfs.map((gf) => (
          <div
            key={gf.id}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-neutral-900/80"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 bg-neutral-800">
                  <img
                    src={gf.avatar}
                    alt={gf.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Фолбэк на дефолтную картинку при отсутствии локальной
                      e.currentTarget.src = '/photos/pic1.jpg'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{gf.name}</h3>
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
                onClick={() => toggleStatus(gf.id)}
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
                className="text-xs font-medium text-white/40 hover:text-white transition"
              >
                Edit Config →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}