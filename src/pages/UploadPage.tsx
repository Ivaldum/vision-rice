import React, { useState, useRef, useEffect } from 'react';
import { Upload, MapPin, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { analyzeImage } from '../services/api';
import type { AnalysisResponse } from '../services/api';
import { getWeatherData } from '../services/weather';
import type { WeatherData } from '../services/weather';
import { cn } from '../utils/cn';
import { ResultsModal } from '../components/ResultsModal';

export const UploadPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [analysisTimestamp, setAnalysisTimestamp] = useState<string>('');
    const [weather, setWeather] = useState<WeatherData | null>(null);

    // Validation ID logic
    const [requiresValidation, setRequiresValidation] = useState(false);
    const [validationId, setValidationId] = useState<string | null>(null);

    const generateValidationId = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed O, 0, 1, I for clarity
        let id = 'VR-';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setRequiresValidation(checked);
        if (checked) {
            setValidationId(generateValidationId());
        } else {
            setValidationId(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setUploadSuccess(false);
            setAnalysisResult(null);
            setAnalysisError(null);
            setShowModal(false);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = () => {
        setLoadingLocation(true);
        setLocationError(null);
        if (!navigator.geolocation) {
            setLocationError('Geolocalización no soportada');
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setLocation({ lat, lng });
                setLoadingLocation(false);

                // Fetch weather data for this location
                const weatherData = await getWeatherData(lat, lng);
                if (weatherData) {
                    setWeather(weatherData);
                }
            },
            (error) => {
                console.error(error);
                setLocationError('Error obteniendo ubicación: ' + error.message);
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleUpload = async () => {
        if (!file || !location) return;
        setUploading(true);
        setAnalysisError(null);

        const timestamp = new Date().toISOString();
        setAnalysisTimestamp(timestamp);

        try {
            // Call the Object Detection API
            const result = await analyzeImage(file);
            setAnalysisResult(result);
            setShowModal(true); // Open modal with results

            // Upload to Supabase Storage
            const fileName = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);

            // Insert into Database with analysis results
            const { error: dbError } = await supabase
                .from('consultas')
                .insert([
                    {
                        image_url: publicUrl,
                        latitude: location.lat,
                        longitude: location.lng,
                        status: 'completed',
                        created_at: timestamp,
                        diagnosis_label: result.best_detection?.class?.toLowerCase() === 'pyr' ? 'Pyricularia' : 'No Pyricularia',
                        diagnosis_prob: result.best_detection?.confidence || null,
                        detection_count: result.count,
                        validation_id: validationId,
                    },
                ])
                .select()
                .single();

            if (dbError) {
                console.warn('Database insert failed:', dbError);
                // Continue even if DB insert fails
            }

            setUploadSuccess(true);

        } catch (error: any) {
            console.error('Analysis failed:', error);
            setAnalysisError(error.response?.data?.detail || error.message || 'Error al analizar la imagen');
        } finally {
            setUploading(false);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreview(null);
        setAnalysisResult(null);
        setAnalysisError(null);
        setUploadSuccess(false);
        setShowModal(false);
        setRequiresValidation(false);
        setValidationId(null);
        // Do not clear location so it persists for the next upload
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleModalClose = () => {
        setShowModal(false);
        // Reset form for new upload
        clearSelection();
    };

    return (
        <>
            {/* Results Modal */}
            {analysisResult && (
                <ResultsModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    result={analysisResult}
                    location={location}
                    timestamp={analysisTimestamp}
                    validationId={validationId}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20 md:pb-0">
                {/* Left Column: Upload */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                            NUEVA CAPTURA
                        </h2>

                        {!preview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-dashed border-2 border-green-200/50 rounded-2xl h-[600px] flex flex-col items-center justify-center cursor-pointer bg-white/40 hover:bg-white/60 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Upload className="w-16 h-16 text-green-600 mb-4 group-hover:scale-110 transition-transform relative z-10" />
                                <span className="font-bold text-xl text-green-900 relative z-10">Subir Foto del Cultivo</span>
                                <span className="text-sm text-green-700/60 relative z-10 mt-1">Soporta JPG, PNG (Max 5MB)</span>
                            </div>
                        ) : (
                            <div className="relative group">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-[600px] object-cover rounded-2xl shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <button
                                    onClick={clearSelection}
                                    className="absolute top-4 right-4 bg-red-500/90 text-white p-3 rounded-full shadow-lg backdrop-blur hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Error Display */}
                    {analysisError && (
                        <div className="glass-panel p-6 rounded-3xl bg-red-50 border-2 border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-red-800">Error en el Análisis</h3>
                                    <p className="text-sm text-red-600 mt-1">{analysisError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                        <div className={cn("p-4 rounded-full transition-colors",
                            location ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        )}>
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-bold text-sm uppercase text-gray-400 tracking-wider">Ubicación de la Imagen</h3>
                            {file && location ? (
                                <p className="text-xl font-mono font-bold text-gray-800 tracking-tight">
                                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </p>
                            ) : loadingLocation ? (
                                <p className="text-sm text-green-600 font-medium">Calibrando GPS...</p>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-400">{file ? "Esperando ubicación..." : "Esperando captura"}</p>
                                    {locationError && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{locationError}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                onClick={handleUpload}
                                disabled={!file || !location || uploading || uploadSuccess}
                                className={cn(
                                    "w-full md:w-auto px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all",
                                    uploadSuccess ? "bg-green-500 text-white" :
                                        (!file || !location) ? "bg-gray-200 text-gray-400 cursor-not-allowed" :
                                            "btn-primary hover:px-10"
                                )}
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : uploadSuccess ? <CheckCircle /> : "Analizar"}
                            </button>
                        </div>
                    </div>

                    {/* Validation Widget */}
                    {file && (
                        <div className={cn(
                            "glass-panel p-5 rounded-2xl transition-all duration-300 border-2",
                            requiresValidation ? "border-green-300 bg-green-50/50" : "border-transparent"
                        )}>
                            <div className="flex items-start gap-4">
                                <div className="flex items-center h-6 mt-1">
                                    <input
                                        id="validation-checkbox"
                                        type="checkbox"
                                        checked={requiresValidation}
                                        onChange={handleValidationChange}
                                        disabled={uploading || uploadSuccess}
                                        className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="validation-checkbox" className="font-bold text-gray-800 text-base cursor-pointer">
                                        Solicitar validación de laboratorio
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Marcá esta opción si vas a enviar esta misma muestra al laboratorio para contrastar resultados.
                                    </p>

                                    {requiresValidation && validationId && (
                                        <div className="mt-4 p-4 bg-white rounded-xl border border-green-200/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                                            <div>
                                                <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Código de muestra</p>
                                                <p className="text-sm text-gray-600">Anotá este código en en tu muestra y base de datos.</p>
                                            </div>
                                            <div className="bg-green-100/50 px-4 py-2 rounded-lg font-mono text-xl font-black text-green-800 tracking-wider">
                                                {validationId}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Info & Widgets */}
                <div className="space-y-6">
                    {/* Simulated Environmental Metrics */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Condiciones de Campo (Est.)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-2xl">
                                <span className="block text-2xl font-black text-blue-800">
                                    {weather ? `${weather.temperature}°C` : '--'}
                                </span>
                                <span className="text-xs text-blue-600 font-medium">Temperatura</span>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-2xl">
                                <span className="block text-2xl font-black text-indigo-800">
                                    {weather ? `${weather.humidity}%` : '--'}
                                </span>
                                <span className="text-xs text-indigo-600 font-medium">Humedad</span>
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Ubicación Actual</h3>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-full text-green-600">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                {location ? (
                                    <p className="text-lg font-mono font-bold text-gray-800">
                                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400">Obteniendo ubicación...</p>
                                )}
                                <p className="text-xs text-gray-500">Coordenadas del Campo</p>
                            </div>
                        </div>
                    </div>

                    {/* Photography Guide */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Guía de Captura</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-700">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Iluminación Natural</h4>
                                    <p className="text-xs text-gray-500">Evita sombras fuertes sobre la hoja.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-700">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Enfoque Cercano</h4>
                                    <p className="text-xs text-gray-500">Mantén una distancia de 10-15cm.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Fondo Limpio</h4>
                                    <p className="text-xs text-gray-500">Evita elementos distractores.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};
