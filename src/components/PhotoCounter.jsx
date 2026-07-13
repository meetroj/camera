export default function PhotoCounter({ remaining }) {
  const isLow = remaining <= 3
  return (
    <div
      className={`flex items-center gap-1 font-mono text-sm px-2 py-1 rounded-full ${
        isLow ? 'text-red-400 bg-red-900/30' : 'text-[#e8c97a]'
      }`}
    >
      <span>{remaining}</span>
      <span>🎞️</span>
    </div>
  )
}
