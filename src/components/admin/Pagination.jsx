import React from 'react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-3">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        ◀ Précédent
      </button>
      <span className="px-2 text-sm">Page {page} / {totalPages}</span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        Suivant ▶
      </button>
    </div>
  );
}
