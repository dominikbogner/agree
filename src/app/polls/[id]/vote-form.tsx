"use client"

import { useState } from "react"

type VoteType = "YES" | "IF_NEED_BE" | "NO"

interface Option {
  id: string
  label: string
  type: "TEXT" | "DATE" | "DATE_RANGE"
}

interface Vote {
  optionId: string
  voterName: string
  type: VoteType
  timeFrom: string | null
  timeTo: string | null
}

interface Poll {
  id: string
  closedAt: string | null
  allowParticipantTime: boolean
  options: Option[]
  votes: Vote[]
}

export default function VoteForm({
  poll,
  canShare,
}: {
  poll: Poll
  canShare: boolean
}) {
  const [name, setName] = useState("")
  const [votesByOption, setVotesByOption] = useState<Record<string, VoteType>>({})
  const [timesByOption, setTimesByOption] = useState<
    Record<string, { timeFrom: string; timeTo: string }>
  >({})
  const [allVotes, setAllVotes] = useState<Vote[]>(poll.votes)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const isClosed = !!poll.closedAt

  function updateVote(optionId: string, type: VoteType) {
    setVotesByOption((current) => ({
      ...current,
      [optionId]: type,
    }))

    if (type === "NO") {
      setTimesByOption((current) => ({
        ...current,
        [optionId]: {
          timeFrom: "",
          timeTo: "",
        },
      }))
    }
  }

  function updateTime(optionId: string, updates: Partial<{ timeFrom: string; timeTo: string }>) {
    setTimesByOption((current) => ({
      ...current,
      [optionId]: {
        timeFrom: current[optionId]?.timeFrom ?? "",
        timeTo: current[optionId]?.timeTo ?? "",
        ...updates,
      },
    }))
  }

  function getVotes(optionId: string, type: VoteType) {
    return allVotes.filter((vote) => vote.optionId === optionId && vote.type === type)
  }

  function formatVoteLabel(vote: Vote) {
    if (vote.timeFrom && vote.timeTo) {
      return `${vote.voterName} (${vote.timeFrom}–${vote.timeTo})`
    }

    if (vote.timeFrom) {
      return `${vote.voterName} (ab ${vote.timeFrom})`
    }

    if (vote.timeTo) {
      return `${vote.voterName} (bis ${vote.timeTo})`
    }

    return vote.voterName
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Bitte deinen Namen eingeben")
      return
    }

    if (Object.keys(votesByOption).length < poll.options.length) {
      setError("Bitte für alle Optionen abstimmen")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/polls/${poll.id}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterName: name.trim(),
          votes: Object.entries(votesByOption).map(([optionId, type]) => ({
            optionId,
            type,
            timeFrom: timesByOption[optionId]?.timeFrom || null,
            timeTo: timesByOption[optionId]?.timeTo || null,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern")
      }

      setAllVotes(data.votes)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isClosed && !submitted && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">Dein Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Max Mustermann"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
          />
        </div>
      )}

      {submitted && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="text-lg font-semibold text-emerald-800">Deine Abstimmung wurde gespeichert.</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
            >
              Abstimmung bearbeiten
            </button>

            {canShare && (
              <button
                onClick={copyLink}
                className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                {copied ? "Link kopiert" : "Link kopieren"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {poll.options.map((option) => {
          const yesVotes = getVotes(option.id, "YES")
          const maybeVotes = getVotes(option.id, "IF_NEED_BE")
          const noVotes = getVotes(option.id, "NO")
          const selectedType = votesByOption[option.id]
          const showTimeInputs =
            poll.allowParticipantTime &&
            option.type === "DATE" &&
            !!selectedType &&
            selectedType !== "NO" &&
            !isClosed &&
            !submitted

          return (
            <div key={option.id} className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{option.label}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                    {option.type === "TEXT"
                      ? "Text"
                      : option.type === "DATE"
                        ? "Tag"
                        : "Zeitraum"}
                  </p>
                </div>

                {!isClosed && !submitted && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        type: "YES" as VoteType,
                        label: "✓ Ja",
                        active: "bg-green-500 text-white",
                        idle: "bg-green-50 text-green-700 hover:bg-green-100",
                      },
                      {
                        type: "IF_NEED_BE" as VoteType,
                        label: "~ OK",
                        active: "bg-amber-500 text-white",
                        idle: "bg-amber-50 text-amber-700 hover:bg-amber-100",
                      },
                      {
                        type: "NO" as VoteType,
                        label: "✗ Nein",
                        active: "bg-red-500 text-white",
                        idle: "bg-red-50 text-red-700 hover:bg-red-100",
                      },
                    ].map((button) => (
                      <button
                        key={button.type}
                        onClick={() => updateVote(option.id, button.type)}
                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                          selectedType === button.type ? button.active : button.idle
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {showTimeInputs && (
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Von (optional)
                    </label>
                    <input
                      type="time"
                      value={timesByOption[option.id]?.timeFrom ?? ""}
                      onChange={(e) => updateTime(option.id, { timeFrom: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Bis (optional)
                    </label>
                    <input
                      type="time"
                      value={timesByOption[option.id]?.timeTo ?? ""}
                      onChange={(e) => updateTime(option.id, { timeTo: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {yesVotes.length > 0 && (
                  <p className="text-green-700">
                    <span className="font-medium">✓ Ja:</span>{" "}
                    {yesVotes.map(formatVoteLabel).join(", ")}
                  </p>
                )}

                {maybeVotes.length > 0 && (
                  <p className="text-amber-700">
                    <span className="font-medium">~ OK:</span>{" "}
                    {maybeVotes.map(formatVoteLabel).join(", ")}
                  </p>
                )}

                {noVotes.length > 0 && (
                  <p className="text-red-700">
                    <span className="font-medium">✗ Nein:</span>{" "}
                    {noVotes.map(formatVoteLabel).join(", ")}
                  </p>
                )}

                {yesVotes.length === 0 && maybeVotes.length === 0 && noVotes.length === 0 && (
                  <p className="text-gray-400">Noch keine Stimmen</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!isClosed && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-lg font-medium text-white transition hover:bg-violet-700 disabled:bg-violet-300"
        >
          {loading ? "Speichere…" : "Abstimmung speichern"}
        </button>
      )}

      {isClosed && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Diese Umfrage ist geschlossen.
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
    </div>
  )
}
