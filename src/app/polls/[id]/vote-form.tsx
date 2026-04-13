"use client"
import { useState } from "react"

type VoteType = "YES" | "IF_NEED_BE" | "NO"
interface Option { id: string; label: string }
interface Vote { optionId: string; voterName: string; type: VoteType }
interface Poll { id: string; closedAt: string | null; options: Option[]; votes: Vote[] }

export default function VoteForm({ poll }: { poll: Poll }) {
  const [name, setName] = useState("")
  const [votes, setVotes] = useState<Record<string, VoteType>>({})
  const [allVotes, setAllVotes] = useState<Vote[]>(poll.votes)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const getVoters = (optionId: string, type: VoteType) =>
    allVotes.filter(v => v.optionId === optionId && v.type === type).map(v => v.voterName)

  const allVoters = [...new Set(allVotes.map(v => v.voterName))]
  const isClosed = !!poll.closedAt

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Bitte deinen Namen eingeben"); return }
    if (Object.keys(votes).length < poll.options.length) { setError("Bitte für alle Optionen abstimmen"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/polls/${poll.id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterName: name.trim(), votes: Object.entries(votes).map(([optionId, type]) => ({ optionId, type })) }),
      })
      if (!res.ok) throw new Error("Fehler beim Speichern")
      const data = await res.json()
      setAllVotes(data.votes)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isClosed && !submitted && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dein Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
      )}

      <div className="space-y-3">
        {poll.options.map(option => {
          const yes = getVoters(option.id, "YES")
          const maybe = getVoters(option.id, "IF_NEED_BE")
          const no = getVoters(option.id, "NO")
          const sel = votes[option.id]
          return (
            <div key={option.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="font-medium text-gray-900 mb-3">{option.label}</p>
              {!isClosed && !submitted && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([
                    { type: "YES" as VoteType, label: "✓ Ja", active: "bg-green-500 text-white", idle: "bg-green-50 text-green-700 hover:bg-green-100" },
                    { type: "IF_NEED_BE" as VoteType, label: "~ OK", active: "bg-amber-500 text-white", idle: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                    { type: "NO" as VoteType, label: "✗ Nein", active: "bg-red-400 text-white", idle: "bg-red-50 text-red-600 hover:bg-red-100" },
                  ]).map(btn => (
                    <button key={btn.type} onClick={() => setVotes(v => ({ ...v, [option.id]: btn.type }))}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${sel === btn.type ? btn.active : btn.idle}`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {yes.length > 0 && <div className="flex gap-2 text-sm"><span className="text-green-500 shrink-0">✓</span><span className="text-gray-600">{yes.join(", ")}</span></div>}
                {maybe.length > 0 && <div className="flex gap-2 text-sm"><span className="text-amber-500 shrink-0">~</span><span className="text-gray-600">{maybe.join(", ")}</span></div>}
                {no.length > 0 && <div className="flex gap-2 text-sm"><span className="text-red-400 shrink-0">✗</span><span className="text-gray-600">{no.join(", ")}</span></div>}
                {yes.length === 0 && maybe.length === 0 && no.length === 0 && (
                  <p className="text-xs text-gray-300">Noch keine Stimmen</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!isClosed && !submitted && (
        <div className="space-y-3">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium py-3.5 rounded-xl transition-colors text-lg">
            {loading ? "Speichere..." : "Abstimmen"}
          </button>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-medium">✓ Deine Stimme wurde gespeichert!</p>
          <p className="text-sm text-green-600 mt-1">{allVoters.length} Person{allVoters.length !== 1 ? "en" : ""} {allVoters.length !== 1 ? "haben" : "hat"} abgestimmt</p>
        </div>
      )}

      {isClosed && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-gray-500">Diese Umfrage ist geschlossen.</p>
        </div>
      )}
    </div>
  )
}
