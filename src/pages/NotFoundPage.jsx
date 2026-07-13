export default function NotFoundPage() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center">
      <div className="text-7xl mb-6">📷</div>
      <h2 className="text-[#f5e6d0] font-mono text-2xl font-bold mb-3">Event not found</h2>
      <p className="text-[#888] font-mono text-sm leading-relaxed max-w-xs">
        The link may have expired or the event doesn&apos;t exist. Check your QR code and try again.
      </p>
    </div>
  )
}
