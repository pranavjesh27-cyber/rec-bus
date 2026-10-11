import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import BusList from './pages/BusList'
import Track from './pages/Track'
import Share from './pages/Share'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/buses" element={<BusList />} />
        <Route path="/track/:busId" element={<Track />} />
        <Route path="/share" element={<Share />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
