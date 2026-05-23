// Frontendd/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // clears if value changes before delay
  }, [value, delay]);

  return debouncedValue;
}