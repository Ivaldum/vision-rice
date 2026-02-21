import axios from 'axios';

export interface WeatherData {
    temperature: number;
    humidity: number;
}

export const getWeatherData = async (lat: number, lng: number): Promise<WeatherData | null> => {
    try {
        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m`
        );

        const current = response.data.current;

        return {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
};
