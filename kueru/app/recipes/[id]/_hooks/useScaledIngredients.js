import { useMemo } from "react";

const roundToTwo = (value) => Math.round(value * 100) / 100;

const formatAmount = (value) => {
    if (!Number.isFinite(value)) {
        return "0";
    }

    const rounded = roundToTwo(value);
    if (Number.isInteger(rounded)) {
        return String(rounded);
    }

    return String(rounded);
};

export const useScaledIngredients = (ingredients = {}, baseServings = 1, desiredServings = 1) => {
    const safeBaseServings = Number(baseServings) > 0 ? Number(baseServings) : 1;
    const safeDesiredServings = Number(desiredServings) > 0 ? Number(desiredServings) : safeBaseServings;
    const multiplier = safeDesiredServings / safeBaseServings;

    const scaledIngredients = useMemo(() => {
        if (!ingredients || typeof ingredients !== "object") {
            return [];
        }

        return Object.entries(ingredients)
            .map(([name, amountAndUnit]) => {
                const amount = Number(Array.isArray(amountAndUnit) ? amountAndUnit[0] : NaN);
                const unit = String(Array.isArray(amountAndUnit) ? amountAndUnit[1] ?? "" : "").trim();
                if (!name || !Number.isFinite(amount)) {
                    return null;
                }

                const scaledAmount = amount * multiplier;
                return {
                    name,
                    amount,
                    unit,
                    scaledAmount,
                    scaledAmountLabel: formatAmount(scaledAmount),
                };
            })
            .filter(Boolean);
    }, [ingredients, multiplier]);

    const scaleAmount = (amount) => {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount)) {
            return 0;
        }

        return numericAmount * multiplier;
    };

    return {
        scaledIngredients,
        multiplier,
        safeDesiredServings,
        formatAmount,
        scaleAmount,
    };
};
