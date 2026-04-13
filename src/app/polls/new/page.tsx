"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type OptionType = "TEXT" | "DATE" | "DATE_RANGE"

interface OptionInput {
  id: string
  type: OptionType
  label: string
  dateFrom: string
  dateTo: string
}

interface Project {
  id: string
  name: string
  source: "MANUAL" | "PLANE"
  _count?: {
    polls: number
  }
}

function dateOnlyToDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`)
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateOnlyToDate(value))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateOnlyToDate(value))
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

function getExpandedOptionCount(options: OptionInput[]) {
  return options.reduce((sum, option) => {
    if (option.type === "TEXT" || option.type === "DATE_RANGE") {
      return sum + 1
    }

    if (!option.dateFrom) {
      return sum
    }

    if (option.dateTo && option.dateTo >= option.dateFrom) {
      return sum + getDateRangeStrings(option.dateFrom, option.dateTo).length
    }

    return sum + 1
  }, 0)
}

function getPreview(option: OptionInput) {
  if (option.type === "TEXT") {
    return option.label.trim()
  }

  if (option.type === "DATE") {
    if (!option.dateFrom) return ""

    if (option.dateTo && option.dateTo >= option.dateFrom) {
      const count = getDateRangeStrings(option.dateFrom, option.dateTo).length
      return `${count} einzelne Tage: ${formatShortDate(option.dateFrom)} – ${formatShortDate(option.dateTo)}`
    }

    return formatLongDate(option.dateFrom)
  }

  if (option.type === "DATE_RANGE" && option.dateFrom && option.dateTo) {
    return `${formatShortDate(option.dateFrom)} – ${formatShortDate(option.dateTo)}`
  }

  return ""
}

export default function NewPollPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [allowParticipantTime, setAllowParticipantTime] = useState(false)
  const [allowParticipantShare, setAllowParticipantShare] = useState(true)
  const [options, setOptions] = useState<OptionInput[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects")
        const data = await res.json()
        setProjects(data.projects ?? [])
      } catch {
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    loadProjects()
  }, [])

  const expandedCount = useMemo(() => getExpandedOptionCount(options), [options])

  function addOption(type: OptionType) {
    setOptions((current) => [
      ...current,
      {
        id: Math.random().toString(36).slice(2),
        type,
        label: "",
        dateFrom: "",
        dateTo: "",
      },
    ])
  }

  function updateOption(id: string, updates: Partial<OptionInput>) {
    setOptions((current) =>
      current.map((option) => (option.id === id ? { ...option, ...updates } : option)),
    )
  }

  function removeOption(id: string) {
    setOptions((current) => current.filter((option) => option.id !== id))
  }

  function validate() {
    if (!title.trim()) {
      return "Bitte Titel eingeben"
    }

    if (!options.length) {
      return "Bitte mindestens eine Eingabe hinzufügen"
    }

    for (const option of options) {
      if (option.type === "TEXT" && !option.label.trim()) {
        return "Bitte alle Text-Optionen ausfüllen"
      }

      if (option.type === "DATE" && !option.dateFrom) {
        return "Bitte bei allen Tag-Optionen mindestens ein Startdatum setzen"
      }

      if (option.type === "DATE" && option.dateTo && option.dateTo < option.dateFrom) {
        return "Bei Tag-Bereichen darf 'Bis' nicht vor 'Von' liegen"
      }

      if (option.type === "DATE_RANGE" && (!option.dateFrom || !option.dateTo)) {
        return "Bitte alle Zeitraum-Optionen vollständig ausfüllen"
      }

      if (option.type === "DATE_RANGE" && option.dateTo < option.dateFrom) {
        return "Bei Zeiträumen darf 'Bis' nicht vor 'Von' liegen"
      }
    }

    if (expandedCount < 2) {
      return "Nach dem Auflösen müssen mindestens 2 Optionen entstehen"
    }

    return ""
  }

  async function handleSubmit() {
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          projectId: projectId || null,
          allowParticipantTime,
          allowParticipantShare,
          options: options.map((option) => ({
            type: option.type,
            label: option.label.trim(),
            dateFrom: option.dateFrom || null,
            dateTo: option.dateTo || null,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Erstellen")
      }

      router.push(`/polls/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Zurück
          </button>
          <Link href="/dashboard/projects" className="text-sm text-violet-600 hover:text-violet-700">
            Projekte verwalten
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Neue Umfrage</h1>
          <p className="mt-2 text-sm text-gray-500">
            Tag-Bereiche werden automatisch in einzelne abstimmbare Tage aufgeteilt.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Titel *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Sprint-Planung Mai"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Beschreibung
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Zusätzliche Infos für die Teilnehmenden"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                />
              </div>

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
                {!loadingProjects && projects.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Noch keine Projekte vorhanden. Lege zuerst eines unter{" "}
                    <Link href="/dashboard/projects" className="text-violet-600 hover:text-violet-700">
                      Projekte
                    </Link>{" "}
                    an.
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                  <input
                    type="checkbox"
                    checked={allowParticipantTime}
                    onChange={(e) => setAllowParticipantTime(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Teilnehmende dürfen Uhrzeiten angeben</div>
                    <div className="text-sm text-gray-500">
                      Nur bei einzelnen Tages-Optionen.
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
                      Zeigt den „Link kopieren“-Button auch für Nicht-Owner an.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Optionen</h2>
                <p className="text-sm text-gray-500">
                  Entstehen aktuell {expandedCount} abstimmbare Optionen.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addOption("TEXT")}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  + Text
                </button>
                <button
                  onClick={() => addOption("DATE")}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  + Tag
                </button>
                <button
                  onClick={() => addOption("DATE_RANGE")}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  + Zeitraum
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {options.map((option) => (
                <div key={option.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      {option.type === "TEXT"
                        ? "Text"
                        : option.type === "DATE"
                          ? "Tag"
                          : "Zeitraum"}
                    </span>
                    <button
                      onClick={() => removeOption(option.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Entfernen
                    </button>
                  </div>

                  {option.type === "TEXT" && (
                    <input
                      value={option.label}
                      onChange={(e) => updateOption(option.id, { label: e.target.value })}
                      placeholder="z.B. Remote, Büro, Donnerstag"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  )}

                  {option.type === "DATE" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Von
                        </label>
                        <input
                          type="date"
                          value={option.dateFrom}
                          onChange={(e) => updateOption(option.id, { dateFrom: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Bis (optional)
                        </label>
                        <input
                          type="date"
                          value={option.dateTo}
                          onChange={(e) => updateOption(option.id, { dateTo: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  )}

                  {option.type === "DATE_RANGE" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Von
                        </label>
                        <input
                          type="date"
                          value={option.dateFrom}
                          onChange={(e) => updateOption(option.id, { dateFrom: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Bis
                        </label>
                        <input
                          type="date"
                          value={option.dateTo}
                          onChange={(e) => updateOption(option.id, { dateTo: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  )}

                  {getPreview(option) && (
                    <p className="mt-3 text-sm text-gray-500">Vorschau: {getPreview(option)}</p>
                  )}
                </div>
              ))}

              {options.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                  Noch keine Optionen angelegt.
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-lg font-medium text-white transition hover:bg-violet-700 disabled:bg-violet-300"
          >
            {loading ? "Erstelle…" : "Umfrage erstellen"}
          </button>
        </div>
      </main>
    </div>
  )
}
