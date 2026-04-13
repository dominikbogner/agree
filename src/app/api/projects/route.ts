import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          polls: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  })

  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "Projektname fehlt" }, { status: 400 })
  }

  const existing = await prisma.project.findFirst({
    where: { userId, name },
  })

  if (existing) {
    return NextResponse.json({ error: "Projekt existiert bereits" }, { status: 409 })
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      source: "MANUAL",
    },
    include: {
      _count: {
        select: {
          polls: true,
        },
      },
    },
  })

  return NextResponse.json({ project })
}
