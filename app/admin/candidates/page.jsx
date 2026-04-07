// Suspense bilan wrap qilingan default export
import CandidatesPage from "./CandidatesContent"

export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl shimmer bg-surface-hover" />
        ))}
      </div>
    }>
      <CandidatesContent />
    </Suspense>
  )
}
