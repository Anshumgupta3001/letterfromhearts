import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Drawer from './components/Drawer'
import LetterDrawer from './components/LetterDrawer'
import GoogleRoleSetupModal from './components/auth/GoogleRoleSetupModal'
import HomePage from './pages/HomePage'
import WritePage from './pages/WritePage'
import MySpacePage from './pages/MySpacePage'
import MyLettersPage from './pages/MyLettersPage'
import ListenPage from './pages/ListenPage'
import MyRepliesPage from './pages/MyRepliesPage'
import ConnectionsPage from './pages/ConnectionsPage'
import SentLettersPage from './pages/SentLettersPage'
import PersonalLettersPage from './pages/PersonalLettersPage'
import CaringStrangerPage from './pages/CaringStrangerPage'
import ListenerReadPage from './pages/ListenerReadPage'
import ReportIssuePage from './pages/ReportIssuePage'
import AuthPage from './pages/AuthPage'
import { useApp } from './context/AppContext'

function PageRouter() {
  const { currentPage, authUser, authLoading, pendingRoleSetup } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[13px] text-ink-muted font-light animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!authUser) return <AuthPage />

  return (
    <>
      <Layout>
        {currentPage === 'home'           && <HomePage />}
        {currentPage === 'myspace'        && <MySpacePage />}
        {currentPage === 'write'          && <WritePage />}
        {currentPage === 'myletters'      && <MyLettersPage />}
        {currentPage === 'listen'         && <ListenPage />}
        {currentPage === 'myreplies'      && <MyRepliesPage />}
        {currentPage === 'connections'    && <ConnectionsPage />}
        {currentPage === 'sentletters'    && <SentLettersPage />}
        {currentPage === 'personalletters'&& <PersonalLettersPage />}
        {currentPage === 'caringstranger' && <CaringStrangerPage />}
        {currentPage === 'listenerread'   && <ListenerReadPage />}
        {currentPage === 'reportissue'    && <ReportIssuePage />}
      </Layout>
      <Drawer />
      <LetterDrawer />
      {pendingRoleSetup && <GoogleRoleSetupModal />}
    </>
  )

}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-cream font-sans">
        <PageRouter />
      </div>
    </AppProvider>
  )
}
