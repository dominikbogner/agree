import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import VoteForm from "./vote-form"

export default async function PollPage({ params }: { params: { id: string } }) {
  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: {
      options: { orderBy: { position: "asc" } },
      votes: true,
      user: { select: { name: true } },
    },
  })
  if (!poll) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <span className="text-lg font-bold text-violet-600">agree</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
          {poll.description && <p className="text-gray-500 mt-1">{poll.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Erstellt von {poll.user.name}</p>
        </div>
        <VoteForm poll={JSON.parse(JSON.stringify(poll))} />
      </main>
    </div>
  )
}
