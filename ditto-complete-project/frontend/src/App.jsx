import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import VotePage from './pages/VotePage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ScheduleMeeting from './pages/ScheduleMeeting';

function PrivateRoute({ children, adminOnly = false }) {
  const user = JSON.parse(localStorage.getItem('ditto_user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/create"    element={<CreatePoll />} />
        <Route path="/poll/:id"  element={<VotePage />} />
        <Route path="/schedule"  element={<ScheduleMeeting />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin"     element={<PrivateRoute adminOnly={true}><AdminDashboard /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
