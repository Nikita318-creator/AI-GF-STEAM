import React from 'react'

export function CreateGfView() {
  // Временный мок списка персонажей
  const mockCreatedGfs = [
    { id: '1', name: 'Sakura', role: 'Anime Childhood Friend', status: 'Active' },
    { id: '2', name: 'Elena', role: 'Goth Cyberpunk Girl', status: 'Draft' },
  ]

  return (
    <div className="flex flex-1 flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Your Ideal GF</h1>
          <p className="text-sm text-white/50">Manage and construct custom AI personalities</p>
        </div>
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accent/80">
          + Create New
        </button>
      </div>

      <div className="grid gap-4">
        {mockCreatedGfs.map((gf) => (
          <div key={gf.id} className="flex items-center justify-order-white/10 bg-surface-dark/40 p-4 backdrop-blur-sm">
            <div>
              <h3 className="font-semibold text-white">{gf.name}</h3>
              <p className="text-xs text-white/50">{gf.role}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${gf.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {gf.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
