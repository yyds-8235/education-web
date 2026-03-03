import { useState, useCallback } from 'react';

interface PaginationState {
    current: number;
    pageSize: number;
    total: number;
}

interface UsePaginationOptions {
    defaultCurrent?: number;
    defaultPageSize?: number;
    total?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
    const { defaultCurrent = 1, defaultPageSize = 10, total: defaultTotal = 0 } = options;

    const [pagination, setPagination] = useState<PaginationState>({
        current: defaultCurrent,
        pageSize: defaultPageSize,
        total: defaultTotal,
    });

    const setCurrent = useCallback((current: number) => {
        setPagination((prev) => ({ ...prev, current }));
    }, []);

    const setPageSize = useCallback((pageSize: number) => {
        setPagination((prev) => ({ ...prev, pageSize, current: 1 }));
    }, []);

    const setTotal = useCallback((total: number) => {
        setPagination((prev) => ({ ...prev, total }));
    }, []);

    const onChange = useCallback((current: number, pageSize: number) => {
        setPagination((prev) => ({
            ...prev,
            current,
            pageSize: pageSize || prev.pageSize,
        }));
    }, []);

    const reset = useCallback(() => {
        setPagination({
            current: defaultCurrent,
            pageSize: defaultPageSize,
            total: defaultTotal,
        });
    }, [defaultCurrent, defaultPageSize, defaultTotal]);

    return {
        ...pagination,
        setCurrent,
        setPageSize,
        setTotal,
        onChange,
        reset,
    };
}
