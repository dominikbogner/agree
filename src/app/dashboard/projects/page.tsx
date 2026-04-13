import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import ProjectForm from "./project-form"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Projekte</h1>
              <p className="mt-2 text-sm text-gray-500">
                Manuelle Projekte jetzt, Plane-Sync später über dieselbe Tabelle.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <ProjectForm
          initialProjects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            source: project.source,
            pollCount: project._count.polls,
          }))}
        />
      </main>
    </div>
  )
}
