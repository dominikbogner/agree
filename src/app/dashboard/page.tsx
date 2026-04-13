import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import SignOutButton from "./sign-out-button"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/")
  }

  const userId = (session.user as { id: string }).id

  const polls = await prisma.poll.findMany({
    where: { userId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          source: true,
        },
      },
      options: true,
      _count: {
        select: {
          votes: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">agree</div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Hallo {session.user.name || "du"}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/projects"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Projekte
              </Link>
              <Link
                href="/polls/new"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
              >
                + Neue Umfrage
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {polls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Noch keine Umfragen</h2>
              <p className="mt-2 text-sm text-gray-500">
                Erstelle deine erste Umfrage oder lege zuerst Projekte an.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/polls/new"
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Erste Umfrage erstellen
                </Link>
                <Link
                  href="/dashboard/projects"
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Projekte
                </Link>
              </div>
            </div>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{poll.title}</h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {poll.options.length} Optionen
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {poll._count.votes} Stimmen
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          poll.closedAt
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {poll.closedAt ? "Geschlossen" : "Offen"}
                      </span>
                      {poll.project && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          {poll.project.name}
                        </span>
                      )}
                    </div>

                    {poll.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-500">{poll.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/polls/${poll.id}`}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Öffnen
                    </Link>
                    <Link
                      href={`/polls/${poll.id}/settings`}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Einstellungen
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
