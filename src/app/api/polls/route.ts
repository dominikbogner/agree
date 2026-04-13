import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type OptionType = "TEXT" | "DATE" | "DATE_RANGE"

interface IncomingOption {
  type: OptionType
  label?: string
  dateFrom?: string | null
  dateTo?: string | null
}

function dateOnlyToUtcNoon(value: string) {
  return new Date(`${value}T12:00:00.000Z`)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateOnlyToUtcNoon(value))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateOnlyToUtcNoon(value))
}

function getDateRangeStrings(from: string, to: string) {
  const dates: string[] = []
  const current = new Date(`${from}T00:00:00.000Z`)
  const end = new Date(`${to}T00:00:00.000Z`)

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

function expandOptions(options: IncomingOption[]) {
  const expanded: Array<{
    label: string
    type: OptionType
    dateFrom: Date | null
    dateTo: Date | null
    position: number
  }> = []

  for (const option of options) {
    if (option.type === "TEXT") {
      const label = option.label?.trim() ?? ""

      if (!label) {
        throw new Error("Leere Text-Option gefunden")
      }

      expanded.push({
        label,
        type: "TEXT",
        dateFrom: null,
        dateTo: null,
        position: expanded.length,
      })

      continue
    }

    if (option.type === "DATE") {
      if (!option.dateFrom) {
        throw new Error("Bei Tag fehlt das Startdatum")
      }

      const from = option.dateFrom
      const to = option.dateTo && option.dateTo >= option.dateFrom ? option.dateTo : option.dateFrom
      const days = getDateRangeStrings(from, to)

      for (const day of days) {
        expanded.push({
          label: formatDateLabel(day),
          type: "DATE",
          dateFrom: dateOnlyToUtcNoon(day),
          dateTo: null,
          position: expanded.length,
        })
      }

      continue
    }

    if (option.type === "DATE_RANGE") {
      if (!option.dateFrom || !option.dateTo) {
        throw new Error("Beim Zeitraum fehlen Von/Bis")
      }

      if (option.dateTo < option.dateFrom) {
        throw new Error("Beim Zeitraum liegt 'Bis' vor 'Von'")
      }

      expanded.push({
        label: `${formatShortDate(option.dateFrom)} – ${formatShortDate(option.dateTo)}`,
        type: "DATE_RANGE",
        dateFrom: dateOnlyToUtcNoon(option.dateFrom),
        dateTo: dateOnlyToUtcNoon(option.dateTo),
        position: expanded.length,
      })
    }
  }

  return expanded
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const body = await req.json()

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null
  const projectId =
    typeof body.projectId === "string" && body.projectId.trim() ? body.projectId : null
  const allowParticipantTime = body.allowParticipantTime === true
  const allowParticipantShare = body.allowParticipantShare === true
  const options = Array.isArray(body.options) ? (body.options as IncomingOption[]) : []

  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 })
  }

  if (!options.length) {
    return NextResponse.json({ error: "Mindestens eine Eingabe-Option nötig" }, { status: 400 })
  }

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

  let expandedOptions

  try {
    expandedOptions = expandOptions(options)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ungültige Optionen" },
      { status: 400 },
    )
  }

  if (expandedOptions.length < 2) {
    return NextResponse.json(
      { error: "Nach dem Auflösen müssen mindestens 2 Optionen vorhanden sein" },
      { status: 400 },
    )
  }

  const poll = await prisma.poll.create({
    data: {
      title,
      description,
      userId,
      projectId,
      allowParticipantTime,
      allowParticipantShare,
      options: {
        create: expandedOptions,
      },
    },
    include: {
      options: {
        orderBy: { position: "asc" },
      },
      project: true,
    },
  })

  return NextResponse.json(poll)
}
