// app/admin/candidates/page.jsx
import { Suspense } from 'react'
import CandidatesContent from './CandidatesContent'

export default function CandidatesPage() {
  return (
    // Suspense orqali useSearchParams xatoligini bartaraf etamiz
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-brand-500"></span>
      </div>
    }>
      <CandidatesContent />
    </Suspense>
  )
}