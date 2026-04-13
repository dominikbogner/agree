"use client"
import { signIn } from "next-auth/react"
export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("oidc")}
      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-lg"
    >
      Anmelden
    </button>
  )
}
