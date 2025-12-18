import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that persists state to localStorage
 * @template T - The type of the state value
 * @param {string} key - The localStorage key to use
 * @param {T} initialValue - The initial value if no stored value exists
 * @returns {[T, (value: T | ((val: T) => T)) => void]} - The state value and setter function
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      // Try to get the value from localStorage
      const storedValue = localStorage.getItem(key);
      
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T;
      }
      
      return initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
  }, [key, state]);

  // Handle setter function that can accept both direct values and updater functions
  const setPersistentState = useCallback(
    (value: T | ((val: T) => T)) => {
      setState((prevState) => {
        const newValue = typeof value === 'function' 
          ? (value as (val: T) => T)(prevState)
          : value;
        
        return newValue;
      });
    },
    []
  );

  return [state, setPersistentState];
}
