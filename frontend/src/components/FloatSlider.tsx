import React, { useState } from 'react';

interface FloatSliderProps {
  onChange?: (value: number) => void;
}

const FloatSlider: React.FC<FloatSliderProps> = ({ onChange }) => {
  const [value, setValue] = useState(5); // Default value set to 5

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className='flex w-full h-full items-center justify-center'>
      <input
        type="range"
        className="w-4/5 h-1 bg-indigo-800 rounded-lg appearance-auto cursor-pointer"
        min={0}
        max={10}
        step={0.01} // Set the step to 0.1 for floating-point values
        value={value}
        onChange={handleChange}
      />
      <br />
    </div>
  );
};

export default FloatSlider;
