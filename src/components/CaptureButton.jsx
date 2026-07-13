export default function CaptureButton({ onCapture, disabled }) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      aria-label="Take photo"
      className={`w-20 h-20 rounded-full border-4 border-[#f5e6d0] flex items-center justify-center
        transition-transform duration-150 active:scale-90
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#f5e6d0]" />
    </button>
  )
}
