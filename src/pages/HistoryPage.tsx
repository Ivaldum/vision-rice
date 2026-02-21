import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, MapPin, MoreHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

interface Consulta {
    id: number;
    created_at: string;
    image_url: string;
    latitude: number;
    longitude: number;
    diagnosis_prob?: number;
    diagnosis_label?: string;
    status: string;
}

// Map raw class names to human-readable labels
const formatLabel = (label?: string): string => {
    if (!label) return 'Procesando...';
    const lower = label.toLowerCase();
    if (lower === 'pyr') return 'Pyricularia';
    if (lower === 'no_pyr') return 'No Pyricularia';
    return label; // Already mapped (e.g. "Pyricularia")
};



export const HistoryPage: React.FC = () => {
    const [items, setItems] = useState<Consulta[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('consultas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                setFetchError('Error al cargar el historial.');
                setItems([]);
            } else {
                setItems(data || []);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            setFetchError('Error de conexión con la base de datos.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black flex items-center gap-3">
                    <span className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-800 rounded-full"></span>
                    HISTORIAL DE CONSULTAS
                </h2>
                <button className="text-sm font-bold text-green-700 hover:text-green-900 border border-green-200 bg-white px-4 py-2 rounded-xl shadow-sm transition-colors">
                    Exportar CSV
                </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                <th className="p-5">ID / Estado</th>
                                <th className="p-5">Captura</th>
                                <th className="p-5">Probabilidad</th>
                                <th className="p-5">Fecha & Hora</th>
                                <th className="p-5">Ubicación</th>
                                <th className="p-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin w-5 h-5" /> Cargando...
                                        </div>
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-red-500 font-medium">
                                        {fetchError}
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400">
                                        No hay consultas aún. ¡Subí una imagen para comenzar!
                                    </td>
                                </tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                                    <td className="p-5 align-middle">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs font-bold text-gray-400">#{item.id}</span>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide w-fit border",
                                                item.status === 'completed'
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                            )}>
                                                {item.status === 'completed' ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 relative group-hover:scale-105 transition-transform">
                                            <img src={item.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="max-w-[200px]">
                                            <p className="font-bold text-gray-800 text-sm mb-1">{formatLabel(item.diagnosis_label)}</p>
                                            {item.diagnosis_prob !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full",
                                                                item.diagnosis_prob > 0.8 ? "bg-green-500" :
                                                                    item.diagnosis_prob > 0.5 ? "bg-yellow-500" : "bg-red-500"
                                                            )}
                                                            style={{ width: `${item.diagnosis_prob * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400">{(item.diagnosis_prob * 100).toFixed(0)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="text-sm text-gray-600">
                                            <p className="font-medium text-gray-800">{new Date(item.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-100">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle text-right">
                                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
                    <span>Mostrando {items.length} resultados</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded-md hover:border-gray-300 disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded-md hover:border-gray-300">Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
