import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import {
  listNotificationsAction,
  markReadAction,
  type Notification,
} from "../redux/slices/notificationSlice";
import { FiBell, FiCheckCircle, FiCircle } from "react-icons/fi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Notification Item ────────────────────────────────────────────────────────

const NotificationItem = ({ n }: { n: Notification }) => {
  const dispatch = useAppDispatch();
  const isRead = !!n.readAt;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors
        ${isRead
          ? "border-gray-100 bg-white"
          : "border-indigo-100 bg-indigo-50/60"}`}
    >
      {/* Read indicator */}
      <div className="mt-0.5 shrink-0">
        {isRead ? (
          <FiCheckCircle size={16} className="text-gray-300" />
        ) : (
          <FiCircle size={16} className="fill-indigo-500 text-indigo-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isRead ? "text-gray-600" : "text-gray-900"}`}>
          {n.title}
        </p>
        <p className="mt-0.5 text-sm text-gray-500 leading-5">{n.message}</p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Mark read button */}
      {!isRead && (
        <button
          onClick={() => dispatch(markReadAction(n.id))}
          className="shrink-0 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Mark read
        </button>
      )}
    </div>
  );
};

// ─── Notifications Page ───────────────────────────────────────────────────────

const Notifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, loading, unreadCount } = useAppSelector(
    (s) => s.notifications
  );

  useEffect(() => {
    dispatch(listNotificationsAction());
  }, [dispatch]);

  const unread: Notification[] = notifications.filter((n: Notification) => !n.readAt);
  const read: Notification[] = notifications.filter((n: Notification) => !!n.readAt);

  const markAllRead = () => {
    unread.forEach((n) => dispatch(markReadAction(n.id)));
  };

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FiBell className="text-indigo-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Your latest session reminders and updates.
            </p>
          </div>

          {unread.length > 1 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <FiBell size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400">
              You'll be notified about upcoming sessions here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Unread */}
            {unread.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Unread · {unread.length}
                </h2>
                <div className="space-y-2">
                  {unread.map((n: Notification) => (
                    <NotificationItem key={n.id} n={n} />
                  ))}
                </div>
              </section>
            )}

            {/* Read */}
            {read.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Earlier
                </h2>
                <div className="space-y-2">
                  {read.map((n: Notification) => (
                    <NotificationItem key={n.id} n={n} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Notifications;
