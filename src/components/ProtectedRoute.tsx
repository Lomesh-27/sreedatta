import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthed(isAuthenticated());
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
