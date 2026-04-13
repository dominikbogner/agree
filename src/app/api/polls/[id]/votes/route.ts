import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { voterName, votes } = await req.json()
  if (!voterName || !votes?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.vote.deleteMany({ where: { pollId: params.id, voterName } })
  await prisma.vote.createMany({
    data: votes.map((v: any) => ({ pollId: params.id, optionId: v.optionId, voterName, type: v.type })),
  })

  const allVotes = await prisma.vote.findMany({ where: { pollId: params.id } })
  return NextResponse.json({ votes: allVotes })
}
