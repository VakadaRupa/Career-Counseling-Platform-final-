import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Custom hook for Supabase CRUD operations with Realtime support
 * @param {string} tableName - The name of the Supabase table
 * @param {object} options - Configuration options (e.g., filter, orderBy)
 */
export const useSupabaseData = (tableName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select('*');

      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
      }

      if (options.filter) {
        query = query.match(options.filter);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    // Set up Realtime subscription
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        console.log('Realtime change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          setData((prev) => {
            if (prev.some((item) => item.id === payload.new.id)) return prev;
            const isAsc = options.orderBy?.ascending === true;
            return isAsc ? [...prev, payload.new] : [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setData((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)));
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => prev.filter((item) => item.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tableName, fetchData]);

  const addItem = async (newItem) => {
    const { data: result, error: insertError } = await supabase
      .from(tableName)
      .insert([newItem])
      .select();
    if (insertError) throw insertError;
    return result[0];
  };

  const updateItem = async (id, updates) => {
    const { data: result, error: updateError } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select();
    if (updateError) throw updateError;
    return result[0];
  };

  const deleteItem = async (id) => {
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
  };

  return { data, loading, error, addItem, updateItem, deleteItem, refresh: fetchData, setData };
};
