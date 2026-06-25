export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <img src="/linder-icon.svg" alt="Loading" className="animate-pulse w-32 h-32" />
    </div>
  )
}