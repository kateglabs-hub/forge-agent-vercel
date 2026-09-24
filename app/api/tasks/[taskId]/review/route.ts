import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { getServerSession } from '@/lib/session/get-server-session'
import { getOctokit, parseGitHubUrl } from '@/lib/github/client'

export async function POST(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.AI_GATEWAY_API_KEY)
    return NextResponse.json({ error: 'Add AI_GATEWAY_API_KEY in Vercel before running reviews' }, { status: 400 })
  const { taskId } = await params
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
    .limit(1)
  if (!task?.repoUrl || !task.prNumber)
    return NextResponse.json({ error: 'An automatic pull request is required before review' }, { status: 400 })
  const parsed = parseGitHubUrl(task.repoUrl)
  if (!parsed) return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
  try {
    const octokit = await getOctokit()
    const diff = await octokit.rest.pulls.get({
      owner: parsed.owner,
      repo: parsed.repo,
      pull_number: task.prNumber,
      mediaType: { format: 'diff' },
    })
    const result = await generateText({
      model: 'openai/gpt-5-mini',
      prompt: `Review this pull request diff. Identify correctness bugs, security risks, missing tests, and notable strengths. Be concise and use Markdown. If there are no blocking issues, say so.\n\n${String(diff.data)}`,
    })
    await octokit.rest.issues.createComment({
      owner: parsed.owner,
      repo: parsed.repo,
      issue_number: task.prNumber,
      body: `## ForgePilot code review\n\n${result.text}`,
    })
    return NextResponse.json({ success: true, review: result.text })
  } catch {
    return NextResponse.json({ error: 'Code review failed' }, { status: 500 })
  }
}
