import { useState, useCallback, useEffect } from 'react';

export function useSelection<T extends { id: string }>(
    items: T[],
    key: keyof T = 'id' as keyof T
): {
    selectedKeys: string[];
    selectedItems: T[];
    isSelected: (key: string) => boolean;
    select: (key: string) => void;
    deselect: (key: string) => void;
    toggle: (key: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    clearSelection: () => void;
} {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    const isSelected = useCallback(
        (key: string) => selectedKeys.includes(key),
        [selectedKeys]
    );

    const select = useCallback((key: string) => {
        setSelectedKeys((prev) => {
            if (prev.includes(key)) return prev;
            return [...prev, key];
        });
    }, []);

    const deselect = useCallback((key: string) => {
        setSelectedKeys((prev) => prev.filter((k) => k !== key));
    }, []);

    const toggle = useCallback((key: string) => {
        setSelectedKeys((prev) => {
            if (prev.includes(key)) {
                return prev.filter((k) => k !== key);
            }
            return [...prev, key];
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedKeys(items.map((item) => String(item[key])));
    }, [items, key]);

    const deselectAll = useCallback(() => {
        setSelectedKeys([]);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedKeys([]);
    }, []);

    useEffect(() => {
        const validKeys = items.map((item) => String(item[key]));
        setSelectedKeys((prev) => prev.filter((k) => validKeys.includes(k)));
    }, [items, key]);

    const selectedItems = items.filter((item) =>
        selectedKeys.includes(String(item[key]))
    );

    return {
        selectedKeys,
        selectedItems,
        isSelected,
        select,
        deselect,
        toggle,
        selectAll,
        deselectAll,
        clearSelection,
    };
}
