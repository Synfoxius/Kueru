import { useCallback, useEffect, useMemo, useState } from "react";

export const useStepNavigator = (totalSteps = 0) => {
    const [started, setStarted] = useState(false);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    useEffect(() => {
        if (totalSteps <= 0) {
            setStarted(false);
            setActiveStepIndex(0);
            return;
        }

        setActiveStepIndex((previous) => Math.min(previous, totalSteps - 1));
    }, [totalSteps]);

    const start = useCallback(() => {
        if (totalSteps <= 0) {
            return;
        }

        setStarted(true);
        setActiveStepIndex(0);
    }, [totalSteps]);

    const goPrevious = useCallback(() => {
        setActiveStepIndex((previous) => Math.max(0, previous - 1));
    }, []);

    const goNext = useCallback(() => {
        if (totalSteps <= 0) {
            return;
        }

        setActiveStepIndex((previous) => Math.min(totalSteps - 1, previous + 1));
    }, [totalSteps]);

    const canGoPrevious = useMemo(() => started && activeStepIndex > 0, [started, activeStepIndex]);
    const canGoNext = useMemo(
        () => started && totalSteps > 0 && activeStepIndex < totalSteps - 1,
        [started, totalSteps, activeStepIndex]
    );

    return {
        started,
        activeStepIndex,
        canGoPrevious,
        canGoNext,
        start,
        goPrevious,
        goNext,
    };
};
