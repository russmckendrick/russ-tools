import { useState } from "react"
import { Outlet, Link } from "react-router-dom"
import { Menu, ChevronLeft, ChevronRight, Github as GithubIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Sidebar } from "./Sidebar"
import { Toaster } from "sonner"

export function NewLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r bg-background lg:block ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* Main content */}
      <div className={`ml-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Global header */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/70 supports-[backdrop-filter]:bg-background/70 backdrop-blur px-3 lg:h-16 lg:px-4">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar trigger */}
            <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <DialogTrigger asChild>
                <Button
                  className="lg:hidden"
                  variant="outline"
                  size="sm"
                >
                  <Menu className="h-4 w-4" />
                  <span className="ml-2">Menu</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 w-72 max-w-[18rem] left-0 top-0 translate-x-0 translate-y-0 h-full rounded-none border-r">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </DialogContent>
            </Dialog>
            {/* Desktop collapse toggle */}
            <Button
              className="hidden lg:inline-flex"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Link to="/" className="text-sm font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">RussTools</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="https://github.com/russmckendrick/russ-tools" target="_blank" rel="noreferrer">
                <GithubIcon className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6 surface-bg grid-overlay">
          <div className="mx-auto max-w-7xl space-y-6 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}