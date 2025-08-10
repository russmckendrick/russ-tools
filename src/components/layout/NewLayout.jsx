import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./Sidebar"
import { Toaster } from "sonner"

export function NewLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <aside className={`
        fixed inset-y-0 left-0 z-50 
        w-64 border-r bg-background 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="ml-0 lg:ml-64">
        {/* Mobile header with menu button */}
        <div className="sticky top-0 z-30 lg:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="ml-2">Menu</span>
          </Button>
          <div className="text-sm font-medium">RussTools</div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}