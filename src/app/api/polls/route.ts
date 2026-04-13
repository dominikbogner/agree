import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id
  const { title, description, options } = await req.json()
  if (!title || !options?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const poll = await prisma.poll.create({
    data: {
      title, description, userId,
      options: {
        create: options.map((o: any, i: number) => ({
          label: o.label, type: o.type,
          dateFrom: o.dateFrom ? new Date(o.dateFrom) : null,
          dateTo: o.dateTo ? new Date(o.dateTo) : null,
          position: i,
        })),
      },
    },
    include: { options: true },
  })
  return NextResponse.json(poll)
}
