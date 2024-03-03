import React from 'react';
import TemperatureDisplay from './TemperatureDisplay';
import './App.css'; // Import custom styles

const App: React.FC = () => {
  return (
    <div className="min-h-max flex justify-center items-center bg-gradient-to-br from-purple-400 to-indigo-600 text-white font-sans">
      <div className="text-center">
        <TemperatureDisplay />
      </div>
    </div>
  );
};

export default App;
