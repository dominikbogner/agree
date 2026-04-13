import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

type VoteType = "YES" | "IF_NEED_BE" | "NO"

interface IncomingVote {
  optionId: string
  type: VoteType
  timeFrom?: string | null
  timeTo?: string | null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  const voterName = typeof body.voterName === "string" ? body.voterName.trim() : ""
  const votes = Array.isArray(body.votes) ? (body.votes as IncomingVote[]) : []

  if (!voterName || !votes.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: {
      options: {
        select: {
          id: true,
          type: true,
        },
      },
    },
  })

  if (!poll) {
    return NextResponse.json({ error: "Umfrage nicht gefunden" }, { status: 404 })
  }

  if (poll.closedAt) {
    return NextResponse.json({ error: "Umfrage ist geschlossen" }, { status: 423 })
  }

  const optionTypeById = new Map(poll.options.map((option) => [option.id, option.type]))

  for (const vote of votes) {
    if (!optionTypeById.has(vote.optionId)) {
      return NextResponse.json({ error: "Ungültige Option" }, { status: 400 })
    }
  }

  await prisma.vote.deleteMany({
    where: {
      pollId: params.id,
      voterName,
    },
  })

  await prisma.vote.createMany({
    data: votes.map((vote) => {
      const optionType = optionTypeById.get(vote.optionId)

      const storeTime =
        poll.allowParticipantTime &&
        optionType === "DATE" &&
        vote.type !== "NO"

      return {
        pollId: params.id,
        optionId: vote.optionId,
        voterName,
        type: vote.type,
        timeFrom: storeTime && vote.timeFrom ? vote.timeFrom : null,
        timeTo: storeTime && vote.timeTo ? vote.timeTo : null,
      }
    }),
  })

  const allVotes = await prisma.vote.findMany({
    where: {
      pollId: params.id,
    },
    orderBy: [{ createdAt: "asc" }],
  })

  return NextResponse.json({ votes: allVotes })
}
