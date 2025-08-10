import { useState } from "react"
import { Outlet, Link } from "react-router-dom"
import { Menu, ChevronLeft, ChevronRight, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Sidebar } from "./Sidebar"
import { Toaster } from "sonner"

export function NewLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r bg-background transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}
      >
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* Main content */}
      <div className={`ml-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Global header */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur lg:h-16 lg:px-4">
          <div className="flex items-center gap-2">
            {/* Mobile open */}
            <Button
              className="lg:hidden"
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="ml-2">Menu</span>
            </Button>
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
            <Link to="/" className="text-sm font-medium">RussTools</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="https://github.com/russmckendrick/russ-tools" target="_blank" rel="noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}