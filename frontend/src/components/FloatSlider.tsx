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
    <div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.1} // Set the step to 0.1 for floating-point values
        value={value}
        onChange={handleChange}
      />
      <br />
      <output>{value}</output>
    </div>
  );
};

export default FloatSlider;
