import { useEffect, useState } from "react";
import { database } from "../firebase/config";
import { ref, onValue } from "firebase/database";

/**
 * Live-listens to a Firebase RTDB path.
 * Returns { data, loading, error } where data is an array of records.
 * Each record includes the push-id as `_id`.
 */
export function useRealtimeList(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    setLoading(true);
    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setData([]);
        } else {
          const arr = Object.entries(val).map(([id, rec]) => ({ _id: id, ...rec }));
          setData(arr);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase read error on", path, err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}
