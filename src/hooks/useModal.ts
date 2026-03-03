import { useState, useCallback, useEffect } from 'react';

export function useModal(initialVisible = false): {
    visible: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    modalProps: {
        open: boolean;
        onCancel: () => void;
    };
} {
    const [visible, setVisible] = useState(initialVisible);

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);
    const toggle = useCallback(() => setVisible((v) => !v), []);

    useEffect(() => {
        if (initialVisible !== undefined) {
            setVisible(initialVisible);
        }
    }, [initialVisible]);

    return {
        visible,
        open,
        close,
        toggle,
        modalProps: {
            open: visible,
            onCancel: close,
        },
    };
}
