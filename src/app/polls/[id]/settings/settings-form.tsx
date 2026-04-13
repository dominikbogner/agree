"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProjectOption {
  id: string
  name: string
  source: "MANUAL" | "PLANE"
}

export default function SettingsForm({
  pollId,
  initialValues,
  projects,
}: {
  pollId: string
  initialValues: {
    projectId: string
    allowParticipantTime: boolean
    allowParticipantShare: boolean
    closed: boolean
  }
  projects: ProjectOption[]
}) {
  const router = useRouter()

  const [projectId, setProjectId] = useState(initialValues.projectId)
  const [allowParticipantTime, setAllowParticipantTime] = useState(
    initialValues.allowParticipantTime,
  )
  const [allowParticipantShare, setAllowParticipantShare] = useState(
    initialValues.allowParticipantShare,
  )
  const [closed, setClosed] = useState(initialValues.closed)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/polls/${pollId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId || null,
          allowParticipantTime,
          allowParticipantShare,
          closed,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern")
      }

      setSuccess("Einstellungen gespeichert")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Projekt</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Kein Projekt</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.source === "PLANE" ? "(Plane)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Projekte aus einer späteren Plane-Synchronisation landen automatisch in derselben Liste.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={allowParticipantTime}
              onChange={(e) => setAllowParticipantTime(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Teilnehmende dürfen Uhrzeiten ergänzen</div>
              <div className="text-sm text-gray-500">
                Gilt für einzelne Tagesoptionen.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={allowParticipantShare}
              onChange={(e) => setAllowParticipantShare(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Linkfreigabe für Teilnehmende</div>
              <div className="text-sm text-gray-500">
                Zeigt auf der Umfrage-Seite auch für Nicht-Owner den Share-Button.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Umfrage schließen</div>
              <div className="text-sm text-gray-500">
                Geschlossene Umfragen zeigen weiter Ergebnisse, erlauben aber keine neuen Stimmen.
              </div>
            </div>
          </label>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:bg-violet-300"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>

        <Link
          href={`/polls/${pollId}`}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Zur Umfrage
        </Link>

        <Link
          href="/dashboard/projects"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Projekte verwalten
        </Link>
      </div>
    </div>
  )
}
