import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage a key in localStorage with automatic synchronization.
 * @param {string} key The key in localStorage to manage.
 * @param {any} defaultValue The default value to use if the key does not exist in storage.
 * @returns {Array} An array containing the current value and a setter function to update the value.
 */
function useLocalStorage(key, defaultValue = null) {
    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Set the value both locally and in localStorage
    const updateValue = useCallback((newValue) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
            setValue(valueToStore);
            
            if (valueToStore === null || valueToStore === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, value]);

    // Listen for changes in localStorage from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing localStorage value for key "${key}":`, error);
                }
            } else if (e.key === key && e.newValue === null) {
                setValue(defaultValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, defaultValue]);

    return [value, updateValue];
}

export default useLocalStorage;
