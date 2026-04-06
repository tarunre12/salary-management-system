import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600">Your current role ({user.role}) does not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
