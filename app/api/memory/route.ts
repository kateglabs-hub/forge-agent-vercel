import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { projectMemory } from '@/lib/db/schema'
import { generateId } from '@/lib/utils/id'
import { getServerSession } from '@/lib/session/get-server-session'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const repoUrl = new URL(request.url).searchParams.get('repoUrl')
  if (!repoUrl) return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 })
  const [memory] = await db
    .select()
    .from(projectMemory)
    .where(and(eq(projectMemory.userId, session.user.id), eq(projectMemory.repoUrl, repoUrl)))
    .limit(1)
  return NextResponse.json({ memory: memory?.content || '' })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const repoUrl = typeof body.repoUrl === 'string' ? body.repoUrl : ''
  const content = typeof body.content === 'string' ? body.content.slice(0, 20000) : ''
  if (!repoUrl) return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 })
  const [memory] = await db
    .select()
    .from(projectMemory)
    .where(and(eq(projectMemory.userId, session.user.id), eq(projectMemory.repoUrl, repoUrl)))
    .limit(1)
  if (memory)
    await db.update(projectMemory).set({ content, updatedAt: new Date() }).where(eq(projectMemory.id, memory.id))
  else await db.insert(projectMemory).values({ id: generateId(12), userId: session.user.id, repoUrl, content })
  return NextResponse.json({ success: true })
}
