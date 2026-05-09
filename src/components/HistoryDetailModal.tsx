import React from 'react';
import { X, Calendar, Target, TrendingUp, FlaskConical, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface Consulta {
    id: number;
    created_at: string;
    image_url: string;
    latitude: number | null;
    longitude: number | null;
    diagnosis_prob?: number | null;
    diagnosis_label?: string | null;
    status: string;
    validation_id?: string | null;
}

interface HistoryDetailModalProps {
    item: Consulta | null;
    onClose: () => void;
}

// ── Diagnosis logic (mirrors ResultsModal) ────────────────────────────────────

type SuggestionState = 'SANO' | 'SOSPECHOSO' | 'ALERTA' | 'CRITICO';

const getSuggestionState = (isPyr: boolean, confidencePct: number): SuggestionState => {
    if (isPyr) {
        if (confidencePct >= 90) return 'CRITICO';
        if (confidencePct >= 70) return 'ALERTA';
        if (confidencePct >= 20) return 'SOSPECHOSO';
        return 'SANO';
    } else {
        if (confidencePct > 90) return 'SANO';
        if (confidencePct >= 70) return 'SOSPECHOSO';
        if (confidencePct >= 20) return 'ALERTA';
        return 'CRITICO';
    }
};

const getSuggestionDetails = (state: SuggestionState) => {
    switch (state) {
        case 'SANO':
            return {
                title: 'Negativo / Sano',
                containerClass: 'bg-green-50 border-green-200',
                headerClass: 'text-green-800',
                badgeClass: 'bg-green-100 text-green-800 border-green-300',
                iconColor: 'text-green-600',
                barColor: 'bg-green-500',
                diagnosis: 'No es Pyricularia',
                message: 'El modelo no detecta patrones anómalos significativos. La probabilidad residual se considera ruido estadístico.',
                suggestion: 'Mantener el esquema de monitoreo periódico estándar y archivar la consulta.',
            };
        case 'SOSPECHOSO':
            return {
                title: 'Sospechoso / Inconcluso',
                containerClass: 'bg-yellow-50 border-yellow-200',
                headerClass: 'text-yellow-800',
                badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                iconColor: 'text-yellow-600',
                barColor: 'bg-yellow-500',
                diagnosis: 'Inconcluso / Sospechoso',
                message: 'El algoritmo identifica anomalías en el tejido vegetal, pero no posee certeza algorítmica suficiente para confirmar el patógeno. Puede deberse a lesiones incipientes, desenfoque, estrés hídrico o deficiencias de nitrógeno.',
                suggestion: 'Rechazar la imagen y solicitar una nueva captura con mejor enfoque/iluminación, o programar revisión exhaustiva del lote en 48 horas.',
            };
        case 'ALERTA':
            return {
                title: 'Positivo Moderado / Alerta',
                containerClass: 'bg-orange-50 border-orange-200',
                headerClass: 'text-orange-800',
                badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
                iconColor: 'text-orange-600',
                barColor: 'bg-orange-500',
                diagnosis: 'Posible Pyricularia / Alerta',
                message: 'Alta probabilidad algorítmica de presencia del hongo. Los síntomas visuales coinciden en gran medida con Pyricularia oryzae, pero existe un margen conservador de error.',
                suggestion: 'Se recomienda aislar el foco infeccioso, extraer una muestra física urgente para el INTA (CU03) y evaluar una aplicación fungicida focalizada.',
            };
        case 'CRITICO':
            return {
                title: 'Positivo Crítico / Certeza',
                containerClass: 'bg-red-50 border-red-200',
                headerClass: 'text-red-800',
                badgeClass: 'bg-red-100 text-red-800 border-red-300',
                iconColor: 'text-red-600',
                barColor: 'bg-red-500',
                diagnosis: 'Es Pyricularia',
                message: 'Identificación inequívoca del patrón morfológico (lesiones romboidales típicas). El modelo posee certeza estadística de la infección.',
                suggestion: 'Se sugiere iniciar un tratamiento fitosanitario de contención de manera inmediata sobre el lote afectado, mitigando la ventana de espera del laboratorio.',
            };
    }
};

// ── Component ─────────────────────────────────────────────────────────────────

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    const isPyr = item.diagnosis_label?.toLowerCase() === 'pyricularia';
    const hasProb = item.diagnosis_prob != null;
    const confidencePct = hasProb ? (item.diagnosis_prob! * 100) : 0;

    const state = hasProb ? getSuggestionState(isPyr, confidencePct) : 'SANO';
    const details = getSuggestionDetails(state);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="glass-panel relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 bg-red-500/90 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-3xl font-black mb-1 flex items-center gap-3">
                        <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full" />
                        DETALLE DE CONSULTA
                    </h2>
                    <p className="text-gray-500 ml-5 font-mono text-sm">#{item.id}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── Left: Image + Metadata ── */}
                    <div className="space-y-4">
                        {/* Image */}
                        <div className="bg-white/50 p-4 rounded-2xl">
                            <h3 className="font-bold text-sm uppercase text-gray-500 mb-3">Imagen Analizada</h3>
                            <img
                                src={item.image_url}
                                alt={`Consulta #${item.id}`}
                                className="w-full rounded-xl shadow-md object-cover max-h-80"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Sin+imagen';
                                }}
                            />
                        </div>

                        {/* Metadata */}
                        <div className="bg-white/50 p-5 rounded-2xl space-y-4">
                            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Metadatos</h3>

                            {/* Date */}
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Fecha y Hora</p>
                                    <p className="font-mono font-semibold text-gray-800 text-sm">
                                        {new Date(item.created_at).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Estado</p>
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border",
                                        item.status === 'completed'
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : "bg-amber-100 text-amber-800 border-amber-200"
                                    )}>
                                        {item.status === 'completed' ? 'Completado' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>

                            {/* Validation ID */}
                            {item.validation_id && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FlaskConical className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Código de Laboratorio</p>
                                        <p className="font-mono font-black text-lg text-blue-800 tracking-widest">
                                            {item.validation_id}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Diagnosis ── */}
                    <div className="space-y-4">
                        {hasProb ? (
                            <div className={cn('p-6 rounded-2xl border-2 shadow-md', details.containerClass)}>
                                {/* Badge + title */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={cn('w-6 h-6', details.iconColor)} />
                                        <h3 className={cn('font-bold text-sm uppercase', details.headerClass)}>
                                            Diagnóstico
                                        </h3>
                                    </div>
                                    <span className={cn(
                                        'self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border',
                                        details.badgeClass
                                    )}>
                                        {details.diagnosis}
                                    </span>
                                </div>

                                {/* Confidence big number */}
                                <div className="flex items-baseline gap-3 mb-2">
                                    <p className={cn('text-5xl font-black', details.headerClass)}>
                                        {confidencePct.toFixed(1)}%
                                    </p>
                                    <p className={cn('text-xl font-semibold opacity-80', details.headerClass)}>
                                        {item.diagnosis_label}
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-6">
                                    <div
                                        className={cn('h-full rounded-full transition-all', details.barColor)}
                                        style={{ width: `${confidencePct}%` }}
                                    />
                                </div>

                                {/* Message + suggestion */}
                                <div className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40">
                                    <div>
                                        <h4 className={cn('font-bold mb-1', details.headerClass)}>{details.title}</h4>
                                        <p className="text-sm text-gray-700 leading-relaxed">{details.message}</p>
                                    </div>
                                    <div className="pt-3 border-t border-black/5">
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-purple-600" />
                                            Sugerencia del sistema:
                                        </h4>
                                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                            {details.suggestion}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 flex items-center justify-center h-40">
                                <p className="text-gray-500 font-semibold text-center">
                                    Sin datos de diagnóstico disponibles
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
