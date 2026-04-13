import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { options: { orderBy: { position: "asc" } }, votes: true },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const results = poll.options.map(opt => {
    const v = poll.votes.filter(v => v.optionId === opt.id)
    return {
      optionId: opt.id, label: opt.label, type: opt.type,
      dateFrom: opt.dateFrom, dateTo: opt.dateTo,
      yes: v.filter(x => x.type === "YES").map(x => x.voterName),
      maybe: v.filter(x => x.type === "IF_NEED_BE").map(x => x.voterName),
      no: v.filter(x => x.type === "NO").map(x => x.voterName),
      score: v.filter(x => x.type === "YES").length * 2 + v.filter(x => x.type === "IF_NEED_BE").length,
    }
  }).sort((a, b) => b.score - a.score)

  return NextResponse.json({
    pollId: poll.id, title: poll.title,
    status: poll.closedAt ? "closed" : "open",
    totalParticipants: [...new Set(poll.votes.map(v => v.voterName))].length,
    results, bestOption: results[0] ?? null,
  })
}
