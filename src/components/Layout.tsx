import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Camera, History, Sprout } from 'lucide-react';
import { cn } from '../utils/cn';

export const Layout: React.FC = () => {
    return (
        <div className="dashboard-layout">
            <nav className="sidebar">
                <div className="hidden md:flex items-center gap-3 mb-8 px-2">
                    <div className="p-2 bg-green-600 rounded-xl text-white shadow-lg shadow-green-500/30">
                        <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-wider leading-none text-green-900">VISION</h1>
                        <span className="text-sm font-light tracking-[0.2em] text-green-700 uppercase">Rice</span>
                    </div>
                </div>
                <NavLink
                    to="/"
                    className={({ isActive }) => cn("nav-item", isActive && "active")}
                >
                    <Camera className="w-6 h-6" />
                    <span className="hidden md:inline font-medium">Nueva Consulta</span>
                    <span className="md:hidden text-[10px] font-bold mt-1">NUEVA</span>
                </NavLink>
                <NavLink
                    to="/history"
                    className={({ isActive }) => cn("nav-item", isActive && "active")}
                >
                    <History className="w-6 h-6" />
                    <span className="hidden md:inline font-medium">Historial</span>
                    <span className="md:hidden text-[10px] font-bold mt-1">HISTORIAL</span>
                </NavLink>
                <div className="hidden md:block mt-auto px-4 py-4 bg-green-50 rounded-xl w-full">
                    <p className="text-xs text-green-800 font-bold mb-1">Estado del Sistema</p>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Online v2.0
                    </div>
                </div>
            </nav>
            <main className="main-content">
                <header className="md:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-600 rounded-lg text-white">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <h1 className="text-lg font-black text-green-900">VISION RICE</h1>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </header>

                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
