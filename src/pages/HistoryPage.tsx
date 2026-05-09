import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, MoreHorizontal, ClipboardList, AlertTriangle, CheckCircle2, Activity, Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { HistoryDetailModal } from '../components/HistoryDetailModal';

interface Consulta {
    id: number;
    created_at: string;
    image_url: string;
    latitude: number;
    longitude: number;
    diagnosis_prob?: number;
    diagnosis_label?: string;
    status: string;
    validation_id?: string;
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
    const [selectedItem, setSelectedItem] = useState<Consulta | null>(null);

    // Filters
    const [diagnosisFilter, setDiagnosisFilter] = useState<'all' | 'pyr' | 'no_pyr'>('all');
    const [dateFilter, setDateFilter] = useState('');
    const [searchCode, setSearchCode] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // 1. Diagnosis Filter
            if (diagnosisFilter !== 'all') {
                const isPyr = item.diagnosis_label?.toLowerCase() === 'pyricularia';
                if (diagnosisFilter === 'pyr' && !isPyr) return false;
                if (diagnosisFilter === 'no_pyr' && isPyr) return false;
            }

            // 2. Date Filter
            if (dateFilter) {
                const itemDate = new Date(item.created_at).toISOString().split('T')[0];
                if (itemDate !== dateFilter) return false;
            }

            // 3. Search Code Filter
            if (searchCode.trim()) {
                const code = item.validation_id?.toLowerCase() || '';
                if (!code.includes(searchCode.toLowerCase().trim())) return false;
            }

            return true;
        });
    }, [items, diagnosisFilter, dateFilter, searchCode]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [diagnosisFilter, dateFilter, searchCode]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredItems.slice(start, end);
    }, [filteredItems, currentPage]);

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
            {/* Detail modal */}
            <HistoryDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black flex items-center gap-3">
                    <span className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-800 rounded-full"></span>
                    HISTORIAL DE CONSULTAS
                </h2>
            </div>
            {/* ── Stats cards ── */}
            {!loading && !fetchError && (() => {
                const total = filteredItems.length;
                const positivos = filteredItems.filter(i => i.diagnosis_label?.toLowerCase() === 'pyricularia').length;
                const tasa = total > 0 ? ((positivos / total) * 100).toFixed(0) : '—';
                const ultima = total > 0 ? new Date(filteredItems[0].created_at).toLocaleDateString('es-AR') : '—';

                const stats = [
                    {
                        label: 'Total de consultas',
                        value: total,
                        icon: <ClipboardList className="w-5 h-5" />,
                        color: 'bg-blue-50 text-blue-700 border-blue-100',
                        valueColor: 'text-blue-800',
                    },
                    {
                        label: 'Casos positivos',
                        value: positivos,
                        icon: <AlertTriangle className="w-5 h-5" />,
                        color: 'bg-red-50 text-red-700 border-red-100',
                        valueColor: 'text-red-700',
                    },
                    {
                        label: 'Tasa de detección',
                        value: `${tasa}%`,
                        icon: <Activity className="w-5 h-5" />,
                        color: 'bg-orange-50 text-orange-700 border-orange-100',
                        valueColor: 'text-orange-700',
                    },
                    {
                        label: 'Última consulta',
                        value: ultima,
                        icon: <CheckCircle2 className="w-5 h-5" />,
                        color: 'bg-green-50 text-green-700 border-green-100',
                        valueColor: 'text-green-800',
                    },
                ];

                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((s) => (
                            <div key={s.label} className={`glass-panel rounded-2xl p-5 flex flex-col gap-2 border ${s.color}`}>
                                <div className="flex items-center gap-2 opacity-70">
                                    {s.icon}
                                    <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
                                </div>
                                <p className={`text-3xl font-black ${s.valueColor}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* ── Filters ── */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 w-full md:w-auto">
                    <Filter className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">Filtros</span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {/* Diagnosis */}
                    <div className="relative">
                        <select
                            value={diagnosisFilter}
                            onChange={(e) => setDiagnosisFilter(e.target.value as any)}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block p-2.5 outline-none font-medium appearance-none cursor-pointer"
                        >
                            <option value="all">Todos los diagnósticos</option>
                            <option value="pyr">Pyricularia (Positivo)</option>
                            <option value="no_pyr">No Pyricularia (Sano)</option>
                        </select>
                    </div>

                    {/* Date */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-2.5 outline-none font-medium cursor-pointer"
                        />
                        {dateFilter && (
                            <button
                                onClick={() => setDateFilter('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-red-500"
                            >
                                Borrar
                            </button>
                        )}
                    </div>

                    {/* Search Code */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar Cód. Validación..."
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-2.5 outline-none font-medium uppercase placeholder:normal-case"
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                <th className="p-5">ID</th>
                                <th className="p-5">Código de Validación</th>
                                <th className="p-5">Captura</th>
                                <th className="p-5">Probabilidad</th>
                                <th className="p-5">Fecha & Hora</th>
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
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400">
                                        {items.length === 0
                                            ? "No hay consultas aún. ¡Subí una imagen para comenzar!"
                                            : "No hay resultados para los filtros aplicados."}
                                    </td>
                                </tr>
                            ) : paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                                    <td className="p-5 align-middle">
                                        <span className="font-mono text-sm font-bold text-gray-500">#{item.id}</span>
                                    </td>
                                    <td className="p-5 align-middle">
                                        {item.validation_id ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-widest text-blue-800 bg-blue-100 border border-blue-200 transition-all hover:bg-blue-200 hover:shadow-sm" title="Código de validación de laboratorio">
                                                {item.validation_id}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 relative group-hover:scale-105 transition-transform">
                                            <img src={item.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="p-5 align-middle">
                                        <div className="max-w-[200px]">
                                            <p className="font-bold text-gray-800 text-sm mb-1">{formatLabel(item.diagnosis_label)}</p>
                                            {item.diagnosis_prob != null && (
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
                                    <td className="p-5 align-middle text-right">
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <span>
                        Mostrando {filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} resultados
                        {filteredItems.length !== items.length ? ` (filtrados de ${items.length} totales)` : ''}
                    </span>
                    
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center px-3 font-medium bg-white border border-gray-200 rounded-md">
                                Página {currentPage} de {totalPages}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
