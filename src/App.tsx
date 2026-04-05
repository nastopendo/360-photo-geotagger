import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainPanel } from '@/components/layout/MainPanel'
import { useMatching } from '@/hooks/useMatching'

function AppInner() {
  useMatching()
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
    </div>
  )
}

export default function App() {
  return <AppInner />
}
