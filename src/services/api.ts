import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Detection {
    class: string;
    confidence: number;
    box: number[];
}

export interface AnalysisResponse {
    filename: string;
    count: number;
    best_detection: Detection | null;
    detections: Detection[];
    image_base64: string | null;
}

export const analyzeImage = async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<AnalysisResponse>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};
