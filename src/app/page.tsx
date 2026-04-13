import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginButton from "./login-button"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-violet-600 tracking-tight">agree</h1>
          <p className="text-gray-400 mt-2">Gemeinsam den besten Termin finden</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <LoginButton />
        </div>
      </div>
    </main>
  )
}
