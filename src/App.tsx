import { useStore } from './store'
import SignInPage from './components/SignInPage'
import WorkspacePage from './components/WorkspacePage'

export default function App() {
  const isSignedIn = useStore(s => s.isSignedIn)
  return isSignedIn ? <WorkspacePage /> : <SignInPage />
}
