import { Toaster } from "react-hot-toast"
import { Auth0Provider } from "@auth0/nextjs-auth0"
import "./globals.css"
import TokenDebugger from "./components/TokenDebugger"
import NavigationLogger from "./components/NavigationLogger"

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Partner Portal",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Partner Portal",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Log when layout renders
  console.log("--------------------------------")
  console.log("🔄 Root Layout Rendered")

  return (
    <html lang="en" className="h-full bg-gray-900">
      <body className="min-h-screen bg-gray-900">
        <Auth0Provider>
          {children}
          <Toaster position="top-right" />
          <TokenDebugger />
          <NavigationLogger />
        </Auth0Provider>
      </body>
    </html>
  )
}
