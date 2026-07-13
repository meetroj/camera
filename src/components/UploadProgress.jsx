export default function UploadProgress({ progress, visible }) {
  if (!visible) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 h-0.5 bg-white/10">
      <div
        className="h-full bg-[#f5e6d0] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
