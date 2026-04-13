"use client"

import Link from "next/link"
import { useState } from "react"

export default function PollHeader({
  pollId,
  canManage,
  canShare,
}: {
  pollId: string
  canManage: boolean
  canShare: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}/polls/${pollId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href={canManage ? "/dashboard" : "/"}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {canManage ? "← Dashboard" : "← Start"}
        </Link>

        {canManage && (
          <Link
            href={`/polls/${pollId}/settings`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Einstellungen
          </Link>
        )}
      </div>

      {canShare && (
        <button
          onClick={copyLink}
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          {copied ? "Link kopiert" : "Link kopieren"}
        </button>
      )}
    </div>
  )
}
