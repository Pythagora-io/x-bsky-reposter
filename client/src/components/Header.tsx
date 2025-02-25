import { Bell, LogOut, Home, Settings } from "lucide-react"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ui/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link as RouterLink } from "react-router-dom"

export function Header() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate("/login")
  }
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="text-xl font-bold">X → BlueSky Reposter</div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <RouterLink to="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </RouterLink>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <RouterLink to="/accounts" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Accounts
            </RouterLink>
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}