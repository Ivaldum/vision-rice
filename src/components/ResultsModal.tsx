import React from 'react';
import { X, MapPin, Calendar, Target, TrendingUp } from 'lucide-react';
import type { AnalysisResponse } from '../services/api';

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: AnalysisResponse;
    location: { lat: number; lng: number } | null;
    timestamp: string;
}

// Map class names to human-readable labels
const getClassName = (classId: number | string): string => {
    if (typeof classId === 'string') {
        return classId.toLowerCase() === 'pyr' ? 'Pyricularia' : 'No Pyricularia';
    }
    return classId === 1 ? 'Pyricularia' : 'No Pyricularia';
};

export const ResultsModal: React.FC<ResultsModalProps> = ({
    isOpen,
    onClose,
    result,
    location,
    timestamp
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
                        </div>
                    </div>

                    {/* Right Column: Detection Details */}
                    <div className="space-y-4">
                        {/* Best Detection */}
                        {result.best_detection ? (
                            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-300 shadow-md">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-6 h-6 text-green-700" />
                                    <h3 className="font-bold text-sm uppercase text-gray-700">Mejor Detección</h3>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-5xl font-black text-green-700">
                                        {(result.best_detection.confidence * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-xl font-semibold text-gray-700">
                                        {getClassName(result.best_detection.class)}
                                    </p>
                                </div>
                            </div>
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
