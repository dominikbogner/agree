"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type OptionType = "TEXT" | "DATE" | "DATE_RANGE"
interface OptionInput { id: string; type: OptionType; label: string; dateFrom: string; dateTo: string }

function formatLabel(opt: OptionInput): string {
  if (opt.type === "TEXT") return opt.label
  if (opt.type === "DATE" && opt.dateFrom)
    return new Date(opt.dateFrom).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
  if (opt.type === "DATE_RANGE" && opt.dateFrom && opt.dateTo) {
    const from = new Date(opt.dateFrom).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    const to = new Date(opt.dateTo).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    return `${from} – ${to}`
  }
  return ""
}

export default function NewPoll() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<OptionInput[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addOption = (type: OptionType) =>
    setOptions(o => [...o, { id: Math.random().toString(36).slice(2), type, label: "", dateFrom: "", dateTo: "" }])

  const update = (id: string, u: Partial<OptionInput>) =>
    setOptions(o => o.map(x => x.id === id ? { ...x, ...u } : x))

  const remove = (id: string) => setOptions(o => o.filter(x => x.id !== id))

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Bitte Titel eingeben"); return }
    if (options.length < 2) { setError("Mindestens 2 Optionen nötig"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          options: options.map((o, i) => ({
            type: o.type,
            label: o.type === "TEXT" ? o.label : formatLabel(o),
            dateFrom: o.dateFrom || null,
            dateTo: o.dateTo || null,
            position: i,
          })),
        }),
      })
      if (!res.ok) throw new Error("Fehler beim Erstellen")
      const poll = await res.json()
      router.push(`/polls/${poll.id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-lg font-semibold text-gray-900">Neue Umfrage</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Weihnachtsfeier 2026"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Zusätzliche Infos..." rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-medium text-gray-900 mb-4">Optionen</h2>
          <div className="space-y-3 mb-4">
            {options.map(opt => (
              <div key={opt.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    {opt.type === "TEXT" ? "Text" : opt.type === "DATE" ? "Datum" : "Zeitraum"}
                  </span>
                  <button onClick={() => remove(opt.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                </div>
                {opt.type === "TEXT" && (
                  <input value={opt.label} onChange={e => update(opt.id, { label: e.target.value })} placeholder="Option eingeben..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                )}
                {opt.type === "DATE" && (
                  <input type="date" value={opt.dateFrom} onChange={e => update(opt.id, { dateFrom: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                )}
                {opt.type === "DATE_RANGE" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Von</label>
                      <input type="date" value={opt.dateFrom} onChange={e => update(opt.id, { dateFrom: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Bis</label>
                      <input type="date" value={opt.dateTo} onChange={e => update(opt.id, { dateTo: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                    </div>
                  </div>
                )}
                {formatLabel(opt) && (
                  <p className="text-xs text-gray-400 mt-1.5">→ {formatLabel(opt)}</p>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["TEXT", "DATE", "DATE_RANGE"] as OptionType[]).map(type => (
              <button key={type} onClick={() => addOption(type)}
                className="text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 py-2.5 px-3 rounded-xl transition-colors">
                + {type === "TEXT" ? "Text" : type === "DATE" ? "Datum" : "Zeitraum"}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium py-3.5 px-4 rounded-xl transition-colors text-lg">
          {loading ? "Erstelle..." : "Umfrage erstellen"}
        </button>
      </main>
    </div>
  )
}
