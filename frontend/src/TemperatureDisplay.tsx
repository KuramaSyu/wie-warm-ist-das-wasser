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

interface TemperatureData {
  temperature: number;
  timestamp: number;
}


class TemperatureHistory {
  private history: TemperatureData[] = [];
  private _last_time_added: number = 0;

  constructor(
      private index_size: number,
      private record_interval: number
  ) {}

  add(temperature: number, timestamp: number): void {
      const now = Date.now();
      if ((now - this._last_time_added) < this.record_interval * 1000) {
          return;
      }

      this.history.push({ temperature, timestamp });
      this._last_time_added = now;

      if (this.history.length > this.index_size) {
          this.history.shift();
      }
  }

  getDataForChart(): { labels: string[], datasets: { label: string, data: number[], fill: boolean, borderColor: string, tension: number }[] } {
      return {
          labels: this.history.map(data => new Date(data.timestamp).toLocaleTimeString()),
          datasets: [
              {
                  label: 'Temperature',
                  data: this.history.map(data => data.temperature),
                  fill: false,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
              },
          ],
      };
  }
}

interface TemperatureHistoryChartProps {
  option: ChartOption;
  fetchTemperature: () => Promise<TemperatureData>;
}

const TemperatureHistoryChart: React.FC<TemperatureHistoryChartProps> = ({ option, fetchTemperature }) => {
  const [temperatureHistory, setTemperatureHistory] = useState<TemperatureHistory | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchTemperature();
        if (response.temperature <= 0) return;
        const newTemperature = response.temperature;
        const newTimestamp = response.timestamp;
        temperatureHistory?.add(newTemperature, newTimestamp);
      } catch (error) {
        console.error('Error fetching temperature:', error);
      }
    };

    const interval = setInterval(fetchData, option.recordInterval * 1000);

    return;
  }, [option.recordInterval, temperatureHistory, fetchTemperature]);

  useEffect(() => {
    setTemperatureHistory(new TemperatureHistory(option.maxIndex, option.recordInterval));
  }, [option.maxIndex, option.recordInterval]);

  const chartData = temperatureHistory?.getDataForChart() || { labels: [], datasets: [] };

  return <Line data={chartData} className='h-[40vw] w-[85vw]' />;
};

interface ChartOption {
  label: string;
  recordInterval: number;
  maxIndex: number;
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
        const response = await axios.get('https://wwidw-backend.inuthebot.duckdns.org/get_temperature');
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
  }, []);

  const [chartOptions, setChartOptions] = useState({
    responsive: true,
    scales: {
      y: {
        ticks: {
          color: 'white', // Set the font color for y-axis ticks to white
        },
      },
      x: {
        ticks: {
          color: 'white', // Set the font color for x-axis ticks to white
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  });

  useEffect(() => {
    // Function to update chart options based on window size
    const updateChartOptions = () => {
      setChartOptions(prevOptions => ({
        ...prevOptions,
        maintainAspectRatio: window.innerWidth > 768, // Adjust maintainAspectRatio based on window width
      }));
    };

    // Initial options update
    updateChartOptions();

    // Add event listener for window resize
    window.addEventListener('resize', updateChartOptions);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('resize', updateChartOptions);
    };
  }, []); // Empty dependency array ensures this effect runs only once after the initial render

  const on_time_range_change = (selectedNumber: number) => {
    setSelectedNumber(selectedNumber);
    // Here you can handle the logic based on the selected timestamp
  };
  const now = Date.now(); // Current timestamp in milliseconds
  const selectedNumberHours = selectedNumber * 3600000; // Convert selectedNumber hours to milliseconds
  const chunkSize = chartComponents[selectedChart];
  const chunks = [];
  var filteredTemperatureData: any[] = [];
  for (let i = 0; i < temperatureData.length; i += chunkSize) {
    chunks.push(temperatureData.slice(i, i + chunkSize));
  }
  if (selectedChart === 'Every second') {
    filteredTemperatureData = temperatureData.filter(dataPoint => dataPoint.time >= now - selectedNumberHours);
  } else {
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

  // const filteredTemperatureDataByMod = temperatureData.filter((dataPoint, index) => {
  //   return index % chartComponents[selectedChart] === 0 &&
  //   dataPoint.time >= now - selectedNumberHours
  // });
  // const filteredTemperatureData = filteredTemperatureDataByMod.filter(dataPoint => {
  //   const dataPointTime = dataPoint.time; // Assuming dataPoint.time is the timestamp in milliseconds
  //   return dataPointTime >= now - selectedNumberHours && dataPointTime <= now;
  // });
  const data = {
    labels: filteredTemperatureData.map(dataPoint => new Date(dataPoint.time).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature',
        data: filteredTemperatureData.map(dataPoint => dataPoint.temperature),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-4">Wie warm ist das</h1>
      <h1 className="text-6xl sm:text-6xl font-bold sm:mb-4">Wasser?</h1>
      <div className={`text-6xl sm:text-8xl font-bold mt-12 mb-12 sm:my-10 p-8 sm:px-10 
                      sm:py-8 bg-black rounded-3xl bg-opacity-20 text-blue-500 
                      transition duration-150 ease-out ${temperature === null ? 'animate-pulse' : ''}`}>
        {temperature !== null ? `${temperature.toFixed(2)}°C` : 'Loading...'}
      </div>
      <div className="flex flex-col justify-center items-center h-screen w-screen px-4">
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
      <div>
        Show last {selectedNumber} hours
        <FloatSlider onChange={on_time_range_change} />
      </div>
      
      <div className="flex mt-8 w-full h-4/5 justify-center">
        {<Line data={data} options={chartOptions} updateMode={"active"}/>}
      </div>
    </div>
    </div>
  );
};

export default TemperatureDisplay;
