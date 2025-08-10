import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

export function NewLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r bg-muted/40">
        <Sidebar />
      </aside>
      <main className="flex-1 p-8 bg-background">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}