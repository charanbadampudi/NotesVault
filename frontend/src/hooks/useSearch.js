import { useState, useEffect } from 'react';

export const useSearch = (delay = 300) => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(t);
  }, [query, delay]);

  return { query, setQuery, debounced };
};
