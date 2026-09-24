'use client'

import { useState } from 'react'
import { ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Task } from '@/lib/db/schema'

export function TaskActions({ task }: { task: Task }) {
  const [reviewing, setReviewing] = useState(false)
  const review = async () => {
    setReviewing(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/review`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Review failed')
      toast.success('Code review posted to the pull request')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Code review failed')
    } finally {
      setReviewing(false)
    }
  }
  if (!task.prNumber) return null
  return (
    <Button variant="outline" size="sm" onClick={review} disabled={reviewing}>
      <ScanSearch className="mr-2 h-4 w-4" />
      {reviewing ? 'Reviewing...' : 'Review PR'}
    </Button>
  )
}
