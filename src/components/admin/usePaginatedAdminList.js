import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/services/admin/api';

// Partagé par les 5 gestionnaires de la boîte de réception (contacts,
// adhésions, newsletter, partenariats, volontaires) qui suivent tous la
// même forme de réponse paginée { items, total, page, limit }.
export function usePaginatedAdminList(endpoint, limit = 25) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    adminFetch(`${endpoint}?page=${page}&limit=${limit}`)
      .then((data) => {
        setItems(data?.items || []);
        setTotal(data?.total || 0);
      })
      .catch(console.error);
  }, [endpoint, page, limit]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { items, setItems, page, setPage, total, totalPages, reload: load };
}
