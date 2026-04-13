import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import PollHeader from "./poll-header"
import VoteForm from "./vote-form"

export default async function PollPage({ params }: { params: { id: string } }) {
  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          source: true,
        },
      },
      options: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          label: true,
          type: true,
        },
      },
      votes: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          optionId: true,
          voterName: true,
          type: true,
          timeFrom: true,
          timeTo: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!poll) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const canManage =
    !!session?.user && (session.user as { id: string }).id === poll.userId
  const canShare = canManage || poll.allowParticipantShare

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <PollHeader pollId={poll.id} canManage={canManage} canShare={canShare} />

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              agree
            </span>

            {poll.project && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                Projekt: {poll.project.name}
              </span>
            )}

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                poll.closedAt
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {poll.closedAt ? "Geschlossen" : "Offen"}
            </span>

            {poll.allowParticipantTime && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Uhrzeiten erlaubt
              </span>
            )}
          </div>

          <h1 className="text-3xl font-semibold text-gray-900">{poll.title}</h1>

          {poll.description && (
            <p className="mt-3 whitespace-pre-wrap text-gray-600">{poll.description}</p>
          )}

          <p className="mt-4 text-sm text-gray-500">
            Erstellt von {poll.user.name || "Unbekannt"}
          </p>
        </div>

        <VoteForm
          poll={{
            id: poll.id,
            closedAt: poll.closedAt ? poll.closedAt.toISOString() : null,
            allowParticipantTime: poll.allowParticipantTime,
            options: poll.options,
            votes: poll.votes,
          }}
          canShare={canShare}
        />
      </main>
    </div>
  )
}
