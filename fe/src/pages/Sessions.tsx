import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import {
  mySessionsAction,
  cancelSessionAction,
  rescheduleSessionAction,
  type Session,
} from "../redux/slices/sessionSlice";
import {
  getAvailabilityAction,
  type availabilityData,
} from "../redux/slices/professionalSlice";
import { FiCalendar, FiClock, FiUser, FiX, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import { AnimatePresence, motion } from "motion/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusColor: Record<string, string> = {
  BOOKED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-600",
  COMPLETED: "bg-gray-100 text-gray-500",
};

// ─── Reschedule Modal ─────────────────────────────────────────────────────────

type RescheduleModalProps = {
  session: Session;
  onClose: () => void;
};

const RescheduleModal = ({ session, onClose }: RescheduleModalProps) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.sessions);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Fetch available slots for that professional
  const [slots, setSlots] = useState<availabilityData["slots"]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    dispatch(
      getAvailabilityAction({
        professional_id: session.professionalId,
        timezone: userTimezone,
      })
    ).then((res: any) => {
      if (getAvailabilityAction.fulfilled.match(res)) {
        setSlots(res.payload?.slots ?? []);
      }
      setSlotsLoading(false);
    });
  }, []);

  // Group by date
  const byDate: Record<string, availabilityData["slots"]> = slots.reduce(
    (acc: Record<string, availabilityData["slots"]>, slot) => {
      const key = slot.localStart.split(" ")[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    },
    {}
  );
  const dates = Object.keys(byDate).sort();
  const [activeDate, setActiveDate] = useState<string | null>(null);
  useEffect(() => {
    if (dates.length && !activeDate) setActiveDate(dates[0]);
  }, [dates.join(",")]);

  const handleConfirm = async () => {
    if (!selected) return;
    const result = await dispatch(
      rescheduleSessionAction({ sessionId: session.id, startsAt: selected })
    );
    if (rescheduleSessionAction.fulfilled.match(result)) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            Reschedule Session
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Current:{" "}
          <span className="font-medium text-gray-700">{fmt(session.startsAt)}</span>
        </p>

        {slotsLoading ? (
          <p className="text-sm text-gray-400">Loading available slots…</p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-gray-400">No slots available.</p>
        ) : (
          <>
            {/* Date tabs */}
            <div className="mb-3 flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => { setActiveDate(d); setSelected(null); }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                    ${activeDate === d
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}
                >
                  {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                  })}
                </button>
              ))}
            </div>

            {/* Slot grid */}
            {activeDate && (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {byDate[activeDate].map((slot) => {
                  const isSelected = selected === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      onClick={() => setSelected(isSelected ? null : slot.startsAt)}
                      className={`rounded-xl border px-2 py-2 text-xs transition-all
                        ${isSelected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                    >
                      <span className="font-semibold">
                        {slot.localStart.split(" ")[1]}
                      </span>
                      <span className="block text-gray-400">
                        – {slot.localEnd.split(" ")[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

type UserShape = { role?: string; id?: string };

type SessionCardProps = {
  session: Session;
  role: string;
};

const SessionCard = ({ session, role }: SessionCardProps) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.sessions);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isMember = role === "MEMBER";
  const canAct = session.status === "BOOKED";

  const counterpart = isMember ? session.professional : session.member;

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <FiUser size={13} className="text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-800">
                {isMember ? "Professional" : "Member"}:{" "}
                {counterpart?.firstName ?? "—"} {counterpart?.lastName ?? ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FiClock size={12} className="shrink-0" />
              {fmt(session.startsAt)} – {new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[session.status] ?? "bg-gray-100 text-gray-500"}`}>
            {session.status}
          </span>
        </div>

        {canAct && (
          <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
            {isMember && (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <FiRefreshCw size={11} />
                Reschedule
              </button>
            )}
            <button
              onClick={() => setConfirmCancel(true)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <FiX size={11} />
              Cancel
            </button>
          </div>
        )}

        {/* Inline cancel confirm */}
        {confirmCancel && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
            <p className="text-xs text-rose-700 font-medium">Cancel this session?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                No
              </button>
              <button
                disabled={loading}
                onClick={async () => {
                  await dispatch(cancelSessionAction(session.id));
                  setConfirmCancel(false);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
              >
                {loading ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {rescheduleOpen && (
          <RescheduleModal
            session={session}
            onClose={() => setRescheduleOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Sessions Page ────────────────────────────────────────────────────────────

const Sessions = () => {
  const dispatch = useAppDispatch();
  const { upcoming, past, loading } = useAppSelector((s) => s.sessions);
  const { user } = useAppSelector((s) => s.auth);
  const { role } = user as unknown as UserShape;

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    dispatch(mySessionsAction(tab));
  }, [tab, dispatch]);

  const sessions = tab === "upcoming" ? upcoming : past;

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FiCalendar className="text-indigo-500" />
            My Sessions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {role === "MEMBER"
              ? "View, reschedule, or cancel your booked sessions."
              : "View your upcoming and past sessions."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit shadow-sm">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors
                ${tab === t
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <FiCalendar size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No {tab} sessions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: Session) => (
              <SessionCard key={s.id} session={s} role={role ?? ""} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Sessions;
