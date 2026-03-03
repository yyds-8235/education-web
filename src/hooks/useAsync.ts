import { useState, useCallback } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

export function useAsync<T, P extends unknown[]>(
    asyncFunction: (...args: P) => Promise<T>
): [
        AsyncState<T>,
        (...args: P) => Promise<void>,
        () => void
    ] {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(
        async (...args: P) => {
            setState({ data: null, loading: true, error: null });
            try {
                const data = await asyncFunction(...args);
                setState({ data, loading: false, error: null });
            } catch (error) {
                setState({ data: null, loading: false, error: error as Error });
            }
        },
        [asyncFunction]
    );

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return [state, execute, reset];
}
