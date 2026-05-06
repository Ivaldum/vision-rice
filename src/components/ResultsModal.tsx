import React from 'react';
import { X, MapPin, Calendar, Target, TrendingUp } from 'lucide-react';
import type { AnalysisResponse } from '../services/api';

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: AnalysisResponse;
    location: { lat: number; lng: number } | null;
    timestamp: string;
    validationId?: string | null;
}

// Map class names to human-readable labels
const getClassName = (classId: number | string): string => {
    if (typeof classId === 'string') {
        return classId.toLowerCase() === 'pyr' ? 'Pyricularia' : 'No Pyricularia';
    }
    return classId === 1 ? 'Pyricularia' : 'No Pyricularia';
};

type SuggestionState = 'SANO' | 'SOSPECHOSO' | 'ALERTA' | 'CRITICO';

const getSuggestionState = (classId: string | number, confidencePct: number): SuggestionState => {
    const isPyr = typeof classId === 'string' ? classId.toLowerCase() === 'pyr' : classId === 1;

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
                diagnosis: 'No es Pyricularia',
                message: 'El modelo no detecta patrones anómalos significativos. La probabilidad residual se considera ruido estadístico.',
                suggestion: 'Mantener el esquema de monitoreo periódico estándar y archivar la consulta.'
            };
        case 'SOSPECHOSO':
            return {
                title: 'Sospechoso / Inconcluso',
                containerClass: 'bg-yellow-50 border-yellow-200',
                headerClass: 'text-yellow-800',
                badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                iconColor: 'text-yellow-600',
                diagnosis: 'Inconcluso / Sospechoso',
                message: 'El algoritmo identifica anomalías en el tejido vegetal (manchas o decoloraciones), pero no posee la certeza algorítmica suficiente para confirmar el patógeno. Esto puede deberse a lesiones incipientes, desenfoque de la cámara, estrés hídrico o deficiencias de nitrógeno que confunden al modelo.',
                suggestion: 'Rechazar la imagen y solicitar una nueva captura con mejor enfoque/iluminación, o programar una revisión exhaustiva del lote en 48 horas.'
            };
        case 'ALERTA':
            return {
                title: 'Positivo Moderado / Alerta',
                containerClass: 'bg-orange-50 border-orange-200',
                headerClass: 'text-orange-800',
                badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
                iconColor: 'text-orange-600',
                diagnosis: 'Posible Pyricularia / Alerta',
                message: 'Alta probabilidad algorítmica de presencia del hongo. Los síntomas visuales coinciden en gran medida con Pyricularia oryzae, pero existe un margen conservador de error.',
                suggestion: 'Se recomienda aislar el foco infeccioso, extraer una muestra física urgente para el INTA (CU03) y evaluar una aplicación fungicida focalizada.'
            };
        case 'CRITICO':
            return {
                title: 'Positivo Crítico / Certeza',
                containerClass: 'bg-red-50 border-red-200',
                headerClass: 'text-red-800',
                badgeClass: 'bg-red-100 text-red-800 border-red-300',
                iconColor: 'text-red-600',
                diagnosis: 'Es Pyricularia',
                message: 'Identificación inequívoca del patrón morfológico (lesiones romboidales típicas). El modelo posee certeza estadística de la infección.',
                suggestion: 'Se sugiere iniciar un tratamiento fitosanitario de contención de manera inmediata sobre el lote afectado, mitigando la ventana de espera del laboratorio.'
            };
    }
};

export const ResultsModal: React.FC<ResultsModalProps> = ({
    isOpen,
    onClose,
    result,
    location,
    timestamp,
    validationId
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 bg-red-500/90 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="mb-6">
                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></span>
                        RESULTADOS DEL ANÁLISIS
                    </h2>
                    <p className="text-gray-600 ml-5">Detección de Pyricularia Oryzae</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">                    {/* Left Column: Annotated Image */}
                    <div className="space-y-4">
                        <div className="bg-white/50 p-4 rounded-2xl">
                            <h3 className="font-bold text-sm uppercase text-gray-600 mb-3">Imagen Analizada</h3>
                            {result.image_base64 ? (
                                <img
                                    src={`data:image/jpeg;base64,${result.image_base64}`}
                                    alt="Analyzed"
                                    className="w-full rounded-xl shadow-md"
                                />
                            ) : (
                                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                                    <p className="text-gray-500">No hay imagen disponible</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl space-y-3">
                            <h3 className="font-bold text-sm uppercase text-gray-600 mb-3">Metadatos</h3>

                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Fecha y Hora</p>
                                    <p className="font-mono font-semibold text-gray-800">
                                        {new Date(timestamp).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>

                            {location && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Ubicación GPS</p>
                                        <p className="font-mono font-semibold text-gray-800">
                                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Archivo</p>
                                    <p className="font-semibold text-gray-800 truncate">
                                        {result.filename}
                                    </p>
                                </div>
                            </div>

                            {validationId && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cód. Lab</p>
                                        <p className="text-sm font-semibold text-gray-800">Cód. Validación</p>
                                    </div>
                                    <div className="bg-blue-100/80 px-4 py-1.5 rounded-lg border border-blue-200">
                                        <p className="font-mono font-black text-lg text-blue-800 tracking-widest">{validationId}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Detection Details */}
                    <div className="space-y-4">
                        {/* Best Detection */}
                        {result.best_detection ? (
                            (() => {
                                const confidencePct = result.best_detection.confidence * 100;
                                const suggestionState = getSuggestionState(result.best_detection.class, confidencePct);
                                const details = getSuggestionDetails(suggestionState);

                                return (
                                    <div className={`p-6 rounded-2xl border-2 shadow-md ${details.containerClass}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-6 h-6 ${details.iconColor}`} />
                                                <h3 className={`font-bold text-sm uppercase ${details.headerClass}`}>Mejor Detección</h3>
                                            </div>
                                            <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${details.badgeClass}`}>
                                                {details.diagnosis}
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-3 mb-6">
                                            <p className={`text-5xl font-black ${details.headerClass}`}>
                                                {confidencePct.toFixed(1)}%
                                            </p>
                                            <p className={`text-xl font-semibold opacity-80 ${details.headerClass}`}>
                                                {getClassName(result.best_detection.class)}
                                            </p>
                                        </div>

                                        <div className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40">
                                            <div>
                                                <h4 className={`font-bold mb-1 ${details.headerClass}`}>{details.title}</h4>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {details.message}
                                                </p>
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
                                );
                            })()
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
                                <p className="text-gray-600 font-semibold text-center">No se detectaron objetos</p>
                            </div>
                        )}

                        {/* All Detections */}
                        <div className="bg-white/50 p-6 rounded-2xl">
                            <h3 className="font-bold text-sm uppercase text-gray-600 mb-4">
                                Todas las Detecciones ({result.count})
                            </h3>

                            {result.detections.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {result.detections.map((det, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                                                    <p className="font-bold text-gray-800">{getClassName(det.class)}</p>
                                                </div>
                                                <span className="text-xl font-mono font-black text-blue-600">
                                                    {(det.confidence * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No hay detecciones</p>
                            )}
                        </div>
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
