import React from 'react';
import TemperatureDisplay from './TemperatureDisplay';
import './App.css'; // Import custom styles

const App: React.FC = () => {
  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-purple-400 to-indigo-600 text-white font-sans min-w-full min-h-full">
      <div className="text-center w-full h-full">
        <TemperatureDisplay />
      </div>
    </div>
  );
};

export default App;
