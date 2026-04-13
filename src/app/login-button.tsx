"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginButton() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn("email", { email, redirect: false })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
        <p className="text-green-700 font-medium">Link gesendet!</p>
        <p className="text-sm text-green-600 mt-1">Bitte prüfe dein Postfach.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.de"
        required
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium py-3 px-4 rounded-xl transition-colors text-lg"
      >
        {loading ? "Sende Link..." : "Anmelden"}
      </button>
    </form>
  )
}
