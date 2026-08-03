interface TypingIndicatorProps {
  characterAvatar: string
}

export function TypingIndicator({ characterAvatar }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
        <img
          src={characterAvatar}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-white/[0.06] px-4 py-3 backdrop-blur-md">
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" />
      </div>
    </div>
  )
}
