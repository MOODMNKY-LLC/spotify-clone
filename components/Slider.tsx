'use client';

import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  /** Step for discrete values (e.g. 0.001 for progress scrubbing). Default 0.1 */
  step?: number;
  /** Called when user commits the value (e.g. on pointer up after drag). */
  onValueChangeCommit?: (value: number) => void;
  ariaLabel?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value = 1,
  onChange,
  step = 0.1,
  onValueChangeCommit,
  ariaLabel = 'Volume',
}) => {
  const handleChange = (newValue: number[]) => {
    onChange?.(newValue[0]);
  };
  return (
    <RadixSlider.Root
      className="
        relative
        flex
        items-center
        select-none
        touch-none
        w-full
        h-10
        "
      defaultValue={[1]}
      value={[value]}
      onValueChange={handleChange}
      onValueCommit={onValueChangeCommit ? (v) => onValueChangeCommit(v[0]) : undefined}
      max={1}
      step={step}
      aria-label={ariaLabel}
    >
      <RadixSlider.Track
        className="
            bg-neutral-600
            relative
            grow
            rounded-full
            h-[3px]
            "
      >
        <RadixSlider.Range
          className="
                    absolute
                    bg-white
                    rounded-full
                    h-full
                "
        />
      </RadixSlider.Track>
    </RadixSlider.Root>
  );
};
