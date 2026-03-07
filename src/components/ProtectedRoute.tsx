import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout } from 'lucide-react';

const LoadingScreen: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-green-600 rounded-2xl text-white shadow-lg shadow-green-500/30 animate-pulse">
                <Sprout className="w-8 h-8" />
            </div>
            <p className="text-green-700 font-medium">Cargando...</p>
        </div>
    </div>
);

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { session, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!session) return <Navigate to="/login" replace />;

    return <>{children}</>;
};
