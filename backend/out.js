export const debugSession = {
    logCurrentSession: () => {
        console.group('Session Debug Info');
        console.log('LocalStorage Items:', {
            token: localStorage.getItem('token'),
            lastActivity: localStorage.getItem('lastActivity')
        });
        console.log('Redux State:', store.getState().user);
        console.groupEnd();
    },

    clearSession: () => {
        console.group('Clearing Session');
        localStorage.clear();
        store.dispatch({ type: 'user/authLogout' });
        console.log('Session cleared');
        console.groupEnd();
    },

    isSessionValid: () => {
        const token = localStorage.getItem('token');
        const lastActivity = localStorage.getItem('lastActivity');
        const timeout = 30 * 60 * 1000; // 30 minutes

        if (!token || !lastActivity) return false;

        const timeSinceLastActivity = Date.now() - new Date(lastActivity).getTime();
        return timeSinceLastActivity < timeout;
    }
};