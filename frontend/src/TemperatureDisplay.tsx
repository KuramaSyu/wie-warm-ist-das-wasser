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

    const interval = setInterval(fetchTemperature, 5000); // Fetch temperature every 5 seconds

    // Cleanup function to clear interval when component unmounts or changes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1 className="text-6xl font-bold mb-4">Temperature Display</h1>
      <div className="text-8xl font-bold my-10 p mx-10 m text-blue-500">
        <div className="bg-black py-5 rounded-3xl bg-opacity-20 p-4">
          {temperature !== null ? `${temperature.toFixed(2)}°C` : 'Loading...'}
        </div>
      </div>
      <p className="text-xl text-gray-600">Current Temperature</p>
    </div>
  );
};

export default TemperatureDisplay;
