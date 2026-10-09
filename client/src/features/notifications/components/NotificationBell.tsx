import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { authFetch } from "@/lib/auth-client";

type AppNotification = {
  id: string;
  userId: string;
  appointmentId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const response = await authFetch("/api/notifications/unread-count", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load notification count (${response.status})`
          );
        }

        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Error loading notification count:", error);
      }
    }

    loadUnreadCount();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-md p-2 hover:bg-muted"
        aria-label="Notifications"
        onClick={async () => {
          setIsOpen(!isOpen);

          if (!isOpen) {
            try {
              const response = await authFetch("/api/notifications", {
                method: "GET",
              });

              if (!response.ok) {
                throw new Error(
                  `Failed to load notifications (${response.status})`
                );
              }

              const data = await response.json();
              setNotifications(data);
            } catch (error) {
              console.error("Error loading notifications:", error);
            }
          }
        }}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Notifications</h2>

            {unreadCount > 0 && (
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={async () => {
                  try {
                    const response = await authFetch(
                      "/api/notifications/read-all",
                      {
                        method: "PATCH",
                      }
                    );

                    if (!response.ok) {
                      throw new Error(
                        `Failed to mark all notifications as read (${response.status})`
                      );
                    }

                    setNotifications((currentNotifications) =>
                      currentNotifications.map((notification) => ({
                        ...notification,
                        read: true,
                      }))
                    );

                    setUnreadCount(0);
                  } catch (error) {
                    console.error(
                      "Error marking all notifications as read:",
                      error
                    );
                  }
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No notifications.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`w-full border-b p-4 text-left last:border-b-0 hover:bg-muted ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={async () => {
                    if (notification.read) {
                      return;
                    }

                    try {
                      const response = await authFetch(
                        `/api/notifications/${notification.id}/read`,
                        {
                          method: "PATCH",
                        }
                      );

                      if (!response.ok) {
                        throw new Error(
                          `Failed to mark notification as read (${response.status})`
                        );
                      }

                      setNotifications((currentNotifications) =>
                        currentNotifications.filter(
                            (item) => item.id !== notification.id,
                        ),
                        );

                        setUnreadCount((currentCount) =>
                        Math.max(0, currentCount - 1),
                        );
                    } catch (error) {
                      console.error(
                        "Error marking notification as read:",
                        error
                      );
                    }
                  }}
                >
                  <p className="text-sm">{notification.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
