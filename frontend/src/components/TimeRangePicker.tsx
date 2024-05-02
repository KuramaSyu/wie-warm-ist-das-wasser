import React, { useState } from 'react';

interface TimeRangePickerProps {
  startTimestamp: number;
  endTimestamp: number;
  onChange?: (selectedTimestamp: number) => void;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({ startTimestamp, endTimestamp, onChange }) => {
  const [selectedTimestamp, setSelectedTimestamp] = useState(startTimestamp);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = parseInt(e.target.value);
    setSelectedTimestamp(selectedValue);
    if (onChange) {
      onChange(selectedValue);
    }
  };

  const timeRange = Math.abs(endTimestamp - startTimestamp);
  const step = timeRange / 1000; // Set the step to 1 second

  return (
    <div>
      <input
        type="range"
        min={startTimestamp}
        max={endTimestamp}
        step={step}
        value={selectedTimestamp}
        onChange={handleChange}
      />
      <br />
      <output>{new Date(selectedTimestamp * 1000).toLocaleString()}</output>
    </div>
  );
};

export default TimeRangePicker;
