function Step({ num, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[#e8c97a]/20 text-[#e8c97a] text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {num}
      </span>
      <p className="text-[#f5e6d0]/80 text-sm font-mono leading-snug">{text}</p>
    </div>
  )
}

export default function PermissionGuide({ onRetry }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center overflow-y-auto py-12">
      <div className="text-5xl mb-4">🚫</div>
      <h2 className="text-[#f5e6d0] font-mono text-2xl font-bold mb-2">Camera access needed</h2>
      <p className="text-[#888] text-sm font-mono mb-10">
        Allow camera access to take photos at this event.
      </p>

      <div className="w-full max-w-sm space-y-6 text-left">
        {/* iPhone */}
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#333]">
          <p className="text-[#e8c97a] font-mono text-sm font-bold mb-4">📱 iPhone (Safari)</p>
          <div className="space-y-3">
            <Step num="1" text='Tap "aA" in the Safari address bar' />
            <Step num="2" text='Tap "Website Settings"' />
            <Step num="3" text="Set Camera to Allow" />
            <Step num="4" text="Refresh this page" />
          </div>
        </div>

        {/* Android */}
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#333]">
          <p className="text-[#e8c97a] font-mono text-sm font-bold mb-4">🤖 Android (Chrome)</p>
          <div className="space-y-3">
            <Step num="1" text="Tap the lock icon in the address bar" />
            <Step num="2" text='Tap "Permissions"' />
            <Step num="3" text="Enable Camera" />
            <Step num="4" text="Refresh this page" />
          </div>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="mt-8 w-full max-w-sm bg-[#f5e6d0] text-[#0a0a0a] font-mono font-bold py-4 rounded-2xl transition-transform active:scale-95"
      >
        Try Again
      </button>
    </div>
  )
}
