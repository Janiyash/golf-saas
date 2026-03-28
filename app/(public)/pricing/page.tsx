'use client'

import { Suspense } from 'react'
import PricingPageContent from './PricingPageContent'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingPageContent />
    </Suspense>
  )
}