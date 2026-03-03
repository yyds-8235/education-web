import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useDebouncedCallback<T extends unknown[], R>(
    callback: (...args: T) => R,
    delay: number
): (...args: T) => void {
    const timeoutRef = useState<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef[0]) {
                clearTimeout(timeoutRef[0]);
            }
        };
    }, []);

    return useCallback(
        (...args: T) => {
            if (timeoutRef[0]) {
                clearTimeout(timeoutRef[0]);
            }

            const id = setTimeout(() => {
                callback(...args);
            }, delay);
            timeoutRef[1](id);
        },
        [callback, delay]
    );
}
