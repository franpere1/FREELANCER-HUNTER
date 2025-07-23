import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;