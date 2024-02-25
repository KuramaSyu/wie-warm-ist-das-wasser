import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TemperatureDisplay: React.FC = () => {
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        const response = await axios.get('https://wwidw-backend.inuthebot.duckdns.org/get_temperature');
        setTemperature(response.data.temperature);
      } catch (error) {
        console.error('Error fetching temperature:', error);
      }
    };

    const interval = setInterval(fetchTemperature, 1000); // Fetch temperature every second

    // Cleanup function to clear interval when component unmounts or changes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-4">Wie warm ist das</h1>
      <h1 className="text-6xl sm:text-6xl font-bold sm:mb-4">Wasser?</h1>
      <div className="text-6xl sm:text-8xl font-bold mt-12 mb-12 sm:my-10 p-8 sm:px-10 sm:py-8 bg-black rounded-3xl bg-opacity-20 text-blue-500">
        {temperature !== null ? `${temperature.toFixed(2)}°C` : 'Loading...'}
      </div>
      <p className="text-xl sm:text-xl text-gray-600">Current Temperature</p>
    </div>
  );
};

export default TemperatureDisplay;
