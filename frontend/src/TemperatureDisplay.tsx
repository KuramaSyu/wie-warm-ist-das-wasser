import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimeRangePicker from './components/FloatSlider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import FloatSlider from './components/FloatSlider';

const BASE_URL = 'https://wwidw-backend.inuthebot.duckdns.org';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
  },
};

interface TemperatureEntry {
  time: number;
  temperature: number;
}

const initial_load = false;
const fetch_temperature_history = async (setter: React.Dispatch<React.SetStateAction<TemperatureEntry[]>>) => {
  try {
    const seconds = 60 * 60 * 12; // Fetch temperature history for the last 12 hours
    const response = await axios.get(`${BASE_URL}/get_temperature_history?seconds=${seconds}`);
    const temperature_history: number[] = response.data.history;

    // Construct an array to store formatted temperature data
    const formattedTemperatureData: TemperatureEntry[] = [];

    // Loop through the temperature history
    temperature_history.reverse().forEach((temperature, index) => {
      // Calculate time for each entry based on its position in the array
      const time = new Date(Date.now() - (index * 1000)); // Assuming each entry is 1 second apart

      // Construct an object with time and temperature
      const temperatureEntry: TemperatureEntry = {
        time: time.getTime(),
        temperature: temperature
      };

      // Add the temperature entry to the formatted data array
      formattedTemperatureData.push(temperatureEntry);
    });

    // Set the formatted temperature data using setTemperatureData
    console.log('Temperature history fetched:', formattedTemperatureData);
    return formattedTemperatureData.reverse();
  } catch (error) {
    console.error('Error fetching temperature history:', error);
    return [];
  }
}


const TemperatureDisplay: React.FC = () => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [temperatureData, setTemperatureData] = useState<{ time: number, temperature: number }[]>([]);
  const [selectedChart, setSelectedChart] = useState<keyof typeof chartComponents>('Every second');// Initial selection
  const [selectedNumber, setSelectedNumber] = useState<number>(1); // Initial selection

  const chartComponents = {
    'Every second': 1,
    'Every 10 seconds': 10,
    'Every 30 seconds': 30,
    'Every minute': 60,
    'Every 5 minutes': 60*5,
    'Every 15 minutes': 60*15,
    'Every 30 minutes': 60*30,
    'Every hour': 60*60,
  };
  

  const handleChartSelection = (chartLabel: keyof typeof chartComponents) => {
    setSelectedChart(chartLabel);
  };


  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        if (temperatureData.length === 0) {
          const data = await fetch_temperature_history(setTemperatureData);
          if (data.length > 60*60*2 ) {
            setSelectedChart('Every 5 minutes');
          } else if (data.length > 60*30 ) {
            setSelectedChart('Every minute');
          } else if (data.length > 60*15 ) {
            setSelectedChart('Every 30 seconds');
          } else if (data.length > 60*10 ) {
            setSelectedChart('Every 10 seconds');
          }
          setTemperatureData(data);
        }
        const response = await axios.get(`${BASE_URL}/get_temperature`);
        const newTemperature = response.data.temperature;
        setTemperature(newTemperature);
        setTemperatureData(prevData => [...prevData, { time: Date.now(), temperature: newTemperature }]);
      } catch (error) {
        console.error('Error fetching temperature:', error);
      }
    };

    const interval = setInterval(fetchTemperature, 1000); // Fetch temperature every second

    // Cleanup function to clear interval when component unmounts or changes
    return () => clearInterval(interval);
  }, [temperatureData]);

  const [chartOptions, setChartOptions] = useState({
    responsive: true,
    scales: {
      y: {
        ticks: {
          color: 'white', // Set the font color for y-axis ticks to white
          fontSize: 16,
        },
      },
      x: {
        ticks: {
          color: 'white', // Set the font color for x-axis ticks to white
          fontSize: 16,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide the legend
        position: 'top' as const,
          labels: {
            color: 'white', // Set the label color to white
            fontSize: 20,
          },
      },
    },
  });

  const on_time_range_change = (selectedNumber: number) => {
    setSelectedNumber(selectedNumber);
    // Here you can handle the logic based on the selected timestamp
  };
  const now = Date.now(); // Current timestamp in milliseconds
  const selectedNumberHours = selectedNumber * 3600000; // Convert selectedNumber hours to milliseconds
  const filteredTemperatureDataByDate = temperatureData.filter(dataPoint => dataPoint.time >= now - selectedNumberHours);
  var filteredTemperatureData: any[] = [];

  if (selectedChart === 'Every second') {
    filteredTemperatureData = filteredTemperatureDataByDate;
  } else {
    
    const chunkSize = chartComponents[selectedChart];
    const chunks = [];
    
    for (let i = 0; i < filteredTemperatureDataByDate.length; i += chunkSize) {
      chunks.push(filteredTemperatureDataByDate.slice(i, i + chunkSize));
    }
    filteredTemperatureData = chunks.map(chunk => {
      const sumTemperature = chunk.reduce((acc, dataPoint) => acc + dataPoint.temperature, 0);
      const meanTemperature = sumTemperature / chunk.length;

      const sumTime = chunk.reduce((acc, dataPoint) => acc + dataPoint.time, 0);
      const meanTime = sumTime / chunk.length;
    
      return {
        temperature: meanTemperature,
        time: meanTime
      };
    });
  }
  var temperatureIncrease: any[] = [];

  for (let i = 0; i < filteredTemperatureData.length; i++) {
    if (i === 0) {
      temperatureIncrease.push({ time: filteredTemperatureData[i].time, increase: 0 });
    } else {
      temperatureIncrease.push({increase: filteredTemperatureData[i].temperature - filteredTemperatureData[i - 1].temperature, time: filteredTemperatureData[i].time});
    }
  }
  const data = {
    labels: filteredTemperatureData.map(dataPoint => new Date(dataPoint.time).toLocaleTimeString()),
    datasets: [
      {
        label: '',
        data: filteredTemperatureData.map(dataPoint => dataPoint.temperature),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };
  const increaseData = {
    labels: temperatureIncrease.map(dataPoint => new Date(dataPoint.time).toLocaleTimeString()),
    datasets: [
      {
        label: '',
        data: temperatureIncrease.map(dataPoint => dataPoint.increase),
        fill: false,
        borderColor: 'rgb(147, 0, 255)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="flex flex-col justify-center items-center px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-4">Wie warm ist mein</h1>
      <h1 className="text-6xl sm:text-6xl font-bold sm:mb-4">Zimmer?</h1>
      <div className={`text-6xl sm:text-8xl font-bold mt-12 mb-12 sm:my-10 p-8 sm:px-10 
                      sm:py-8 bg-black rounded-3xl bg-opacity-20 text-blue-500 
                      transition duration-150 ease-out ${temperature === null ? 'animate-pulse' : ''}`}>
        {temperature !== null ? `${temperature.toFixed(2)}°C` : 'Loading...'}
      </div>
      <div className="flex flex-col justify-center items-center px-4 w-full h-fit">
      <div className="flex">
        {Object.keys(chartComponents).map((label) => (
          <button
            key={label}
            className={`px-4 py-2 mr-4 rounded-md ${
              selectedChart === label ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleChartSelection(label as keyof typeof chartComponents)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col mt-2 w-full justify-center">
        <div className="flex mt-2 w-full h-3/4 justify-center">
          Show last {selectedNumber} hours
          <br/>
        </div >
        <div className="flex mt-2 w-full h-min justify-center opacity-50">
          <FloatSlider onChange={on_time_range_change}/>
        </div>
        
      </div>
      <div className='flex flex-col w-full h-max items-center mx-12 mt-10'>
        <div className="flex flex-col w-full h-[60vh] items-center justify-center text-3xl bg-black/10 p-10 rounded-2xl">
          Temperature
          {<Line data={data} options={chartOptions} updateMode={"active"}/>}
        </div>
        <div className="flex flex-col m-8 w-full h-[60vh] items-center justify-center text-3xl bg-black/10 p-10 rounded-2xl">
          Temperature Increase
          {<Line data={increaseData} options={chartOptions} updateMode={"active"}/>}
        </div>
      </div>

    </div>
    </div>
  );
};

export default TemperatureDisplay;
