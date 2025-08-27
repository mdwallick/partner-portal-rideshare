import { Auth0Provider } from "@auth0/nextjs-auth0"
import { SuperAdminProvider } from "./contexts/SuperAdminContext"
import { PartnerProvider } from "./contexts/PartnerContext"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider>
          <SuperAdminProvider>
            <PartnerProvider>{children}</PartnerProvider>
          </SuperAdminProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}
