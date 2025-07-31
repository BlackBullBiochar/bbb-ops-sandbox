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
      const res = await fetch(`${API}/forms/ahlstrom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('❌ submitForm error:', err);
      setError('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading, error };
};
