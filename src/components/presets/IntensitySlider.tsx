import PrecisionSlider from '../editor/PrecisionSlider';

interface IntensitySliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

export default function IntensitySlider({ value, onValueChange }: IntensitySliderProps) {
  return (
    <PrecisionSlider
      label="Intensity"
      value={value}
      min={0}
      max={100}
      step={1}
      bipolar={false}
      formatValue={(v) => `${Math.round(v)}%`}
      onValueChange={onValueChange}
    />
  );
}
