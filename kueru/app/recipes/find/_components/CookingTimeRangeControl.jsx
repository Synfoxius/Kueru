"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function CookingTimeRangeControl({ value, min = 0, max = 240, onChange }) {
    const [currentMin, currentMax] = value;

    const updateRange = (nextMin, nextMax) => {
        const boundedMin = clamp(nextMin, min, max);
        const boundedMax = clamp(nextMax, min, max);
        onChange([Math.min(boundedMin, boundedMax), Math.max(boundedMin, boundedMax)]);
    };

    const handleSliderChange = (nextValue) => {
        if (!Array.isArray(nextValue) || nextValue.length < 2) {
            return;
        }
        updateRange(Number(nextValue[0]), Number(nextValue[1]));
    };

    const handleMinInput = (rawValue) => {
        const parsedValue = Number(rawValue);
        if (!Number.isFinite(parsedValue)) {
            return;
        }
        updateRange(parsedValue, currentMax);
    };

    const handleMaxInput = (rawValue) => {
        const parsedValue = Number(rawValue);
        if (!Number.isFinite(parsedValue)) {
            return;
        }
        updateRange(currentMin, parsedValue);
    };

    return (
        <div className="space-y-3">
            <Label>Cooking Time (minutes)</Label>
            <Slider
                value={[currentMin, currentMax]}
                onValueChange={handleSliderChange}
                min={min}
                max={max}
                step={1}
                minStepsBetweenThumbs={1}
            />
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                        type="number"
                        value={currentMin}
                        min={min}
                        max={currentMax}
                        onChange={(event) => handleMinInput(event.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                        type="number"
                        value={currentMax}
                        min={currentMin}
                        max={max}
                        onChange={(event) => handleMaxInput(event.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
