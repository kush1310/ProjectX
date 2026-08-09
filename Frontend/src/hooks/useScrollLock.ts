import { useCallback } from 'react';

export const useScrollLock = () => {
    const lockScroll = useCallback(() => {
        document.body.classList.add('no-scroll');
    }, []);

    const unlockScroll = useCallback(() => {
        document.body.classList.remove('no-scroll');
    }, []);

    return { lockScroll, unlockScroll };
};
