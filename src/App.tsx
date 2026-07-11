import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Settings } from './pages/dashboard/Settings';
import { Profile } from './pages/dashboard/Profile';
import { VideoEditor } from './pages/dashboard/VideoEditor';
import { AutoClipper } from './pages/dashboard/AutoClipper';
import { Pipeline } from './pages/dashboard/Pipeline';
import { YouTubeAccounts } from './pages/dashboard/YouTubeAccounts';
import { Projects } from './pages/dashboard/Projects';
import { Uploads } from './pages/dashboard/Uploads';
import { Automation } from './pages/dashboard/Automation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Dashboard Routes */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="automation" element={<Automation />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="youtube-accounts" element={<YouTubeAccounts />} />
          <Route path="editor" element={<VideoEditor />} />
          <Route path="clipper" element={<AutoClipper />} />
          <Route path="projects" element={<Projects />} />
          <Route path="uploads" element={<Uploads />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
