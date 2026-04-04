import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Canvas from './Canvas'

export default function WorkspacePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <Canvas />
      </div>
    </div>
  )
}
