// src/hooks/useUpload.js
import { useState } from 'react';
import { API } from '../config/api';

export function useUpload({ token }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /**
   * @param {string} path         – e.g. '/sites/ARA/temps/upload'
   * @param {File}   file
   * @param {object} extraFields  – any additional form fields
   */
  const upload = async (path, file, extraFields = {}) => {
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('file', file);
    Object.entries(extraFields).forEach(([k, v]) => {
      if (v != null) form.append(k, v);
    });

    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}\n${text}`);
      }

      const json = await res.json();
      setData(json);
      return json;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { upload, data, loading, error };
}
