export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/polls/new/:path*", "/polls/:id/settings/:path*"],
}
