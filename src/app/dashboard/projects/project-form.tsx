"use client"

import { useState } from "react"

interface ProjectListItem {
  id: string
  name: string
  source: "MANUAL" | "PLANE"
  pollCount: number
}

export default function ProjectForm({
  initialProjects,
}: {
  initialProjects: ProjectListItem[]
}) {
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!name.trim()) {
      setError("Bitte einen Projektnamen eingeben")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Projekt konnte nicht erstellt werden")
      }

      setProjects((current) => [
        ...current,
        {
          id: data.project.id,
          name: data.project.name,
          source: data.project.source,
          pollCount: data.project._count?.polls ?? 0,
        },
      ].sort((a, b) => a.name.localeCompare(b.name, "de")))
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Projekt konnte nicht erstellt werden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Neues Projekt</h2>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Relaunch, Team Offsite, Sprint 24"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700 disabled:bg-violet-300"
          >
            {loading ? "Erstelle…" : "Projekt anlegen"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Noch keine Projekte vorhanden.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {project.pollCount} Umfragen
                    </span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      {project.source === "PLANE" ? "Plane" : "Manuell"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
