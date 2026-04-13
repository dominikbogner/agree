import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const existingPoll = await prisma.poll.findFirst({
    where: {
      id: params.id,
      userId,
    },
    select: {
      id: true,
      closedAt: true,
    },
  })

  if (!existingPoll) {
    return NextResponse.json({ error: "Umfrage nicht gefunden" }, { status: 404 })
  }

  const body = await req.json()

  const allowParticipantTime = body.allowParticipantTime === true
  const allowParticipantShare = body.allowParticipantShare === true
  const closed = body.closed === true
  const projectId =
    typeof body.projectId === "string" && body.projectId.trim() ? body.projectId : null

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 400 })
    }
  }

  const poll = await prisma.poll.update({
    where: {
      id: params.id,
    },
    data: {
      allowParticipantTime,
      allowParticipantShare,
      projectId,
      closedAt: closed ? existingPoll.closedAt ?? new Date() : null,
    },
    include: {
      project: true,
    },
  })

  return NextResponse.json({ poll })
}
