import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import SettingsForm from "./settings-form"

export default async function PollSettingsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/")
  }

  const userId = (session.user as { id: string }).id

  const [poll, projects] = await Promise.all([
    prisma.poll.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        project: true,
      },
    }),
    prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: [{ name: "asc" }],
    }),
  ])

  if (!poll) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Umfrage-Einstellungen</h1>
          <p className="mt-2 text-sm text-gray-500">{poll.title}</p>
        </div>

        <SettingsForm
          pollId={poll.id}
          initialValues={{
            projectId: poll.projectId ?? "",
            allowParticipantTime: poll.allowParticipantTime,
            allowParticipantShare: poll.allowParticipantShare,
            closed: !!poll.closedAt,
          }}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            source: project.source,
          }))}
        />
      </main>
    </div>
  )
}
