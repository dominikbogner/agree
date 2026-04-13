import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import SignOutButton from "./sign-out-button"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")
  const userId = (session.user as any).id
  const polls = await prisma.poll.findMany({
    where: { userId },
    include: { options: true, _count: { select: { votes: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-violet-600">agree</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Meine Umfragen</h2>
          <Link href="/polls/new" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
            + Neu
          </Link>
        </div>

        {polls.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 mb-4">Noch keine Umfragen</p>
            <Link href="/polls/new" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
              Erste Umfrage erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{poll.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {poll.options.length} Optionen · {poll._count.votes} Stimmen
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${poll.closedAt ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                    {poll.closedAt ? "Geschlossen" : "Offen"}
                  </span>
                </div>
                <Link
                  href={`/polls/${poll.id}`}
                  className="block text-center text-sm text-violet-600 hover:text-violet-700 font-medium py-2 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
                >
                  Ansehen & Link teilen
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
