// hooks/useSubmitForm.js
import { useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export const useSubmitForm = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitForm = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/forms/jenkinson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      // try to parse JSON safely
      let body = {};
      try {
        body = await res.json();
      } catch (_) {}

      // always return shape with status + body
      return { status: res.status, ...body };
    } catch (err) {
      console.error('❌ submitForm error:', err);
      setError('Failed to submit form');
      return { status: 0, ok: false, error: err.message || 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading, error };
};
