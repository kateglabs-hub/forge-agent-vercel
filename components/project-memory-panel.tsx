'use client'

import { useEffect, useState } from 'react'
import { Brain, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ProjectMemoryPanel({ repoUrl }: { repoUrl: string | null }) {
  const [content, setContent] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!repoUrl) return
    fetch(`/api/memory?repoUrl=${encodeURIComponent(repoUrl)}`).then(async (response) => {
      if (response.ok) setContent((await response.json()).memory || '')
    })
  }, [repoUrl])

  const save = async () => {
    if (!repoUrl) return
    setSaving(true)
    try {
      const response = await fetch('/api/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, content }),
      })
      if (!response.ok) throw new Error('save failed')
      toast.success('Project memory saved')
      setOpen(false)
    } catch {
      toast.error('Could not save project memory')
    } finally {
      setSaving(false)
    }
  }

  if (!repoUrl) return null
  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          <span className="font-medium">Project memory</span>
          <span className="text-muted-foreground">Persistent instructions for this repository</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Edit memory'}
        </Button>
      </div>
      {open && (
        <div className="mt-3 flex gap-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Architecture notes, conventions, testing commands, and decisions the agent should remember..."
            className="min-h-24"
          />
          <Button size="icon" onClick={save} disabled={saving} title="Save project memory">
            <Save className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
