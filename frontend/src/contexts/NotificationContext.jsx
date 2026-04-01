import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get("/notifications?limit=100");
      const data = response.data || [];
      const count = data.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch {
      // silently fail — badge just won't update
    }
  }, [user]);

  // Busca initial + polling a cada 30s
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const decrementUnread = (by = 1) =>
    setUnreadCount((prev) => Math.max(0, prev - by));

  const clearUnread = () => setUnreadCount(0);

  const value = { unreadCount, fetchUnreadCount, decrementUnread, clearUnread };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
