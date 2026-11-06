import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { addWorkingHoursAction } from "../redux/slices/professionalSlice";
import { FiClock, FiPlus, FiTrash2, FiCalendar, FiList, FiEdit2 } from "react-icons/fi";

const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

type HourRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const defaultRow = (): HourRow => ({
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
});

// ─── Saved Hours Display ─────────────────────────────────────────────────────

type SavedHoursProps = {
  onEdit: () => void;
};

const SavedHours = ({ onEdit }: SavedHoursProps) => {
  const { addedHours } = useAppSelector((state) => state.professionals);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <FiClock className="text-indigo-500" />
            Your Working Hours
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            These are your current availability hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <FiEdit2 size={12} />
          Edit Hours
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...addedHours]
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map((wh) => (
            <div
              key={wh.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-700">
                {DAY_NAMES[wh.dayOfWeek] ?? `Day ${wh.dayOfWeek}`}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {wh.startTime} – {wh.endTime}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
};

// ─── Professional: Set Working Hours ────────────────────────────────────────

type SetWorkingHoursProps = {
  onSuccess: () => void;
};

const SetWorkingHours = ({ onSuccess }: SetWorkingHoursProps) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.professionals);
  const [rows, setRows] = useState<HourRow[]>([defaultRow()]);

  // Days already picked across all rows
  const usedDays = (currentIndex: number) =>
    rows
      .filter((_, i) => i !== currentIndex)
      .map((r) => r.dayOfWeek);

  const addRow = () => {
    // Find first day not yet used
    const allDays = Object.keys(DAY_NAMES).map(Number);
    const taken = rows.map((r) => r.dayOfWeek);
    const nextFree = allDays.find((d) => !taken.includes(d)) ?? 1;
    setRows((prev) => [...prev, { dayOfWeek: nextFree, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = <K extends keyof HourRow>(
    index: number,
    field: K,
    value: HourRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(addWorkingHoursAction({ hours: rows }));
    if (addWorkingHoursAction.fulfilled.match(result)) {
      onSuccess();
    }
  };

  const allDaysTaken = rows.length >= Object.keys(DAY_NAMES).length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <FiClock className="text-indigo-500" />
            Set Working Hours
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Define the days and times you are available for sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          disabled={allDaysTaken}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiPlus size={12} />
          Add Day
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {rows.map((row, i) => {
          const blocked = usedDays(i);
          return (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              {/* Day selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Day
                </label>
                <select
                  value={row.dayOfWeek}
                  onChange={(e) =>
                    updateRow(i, "dayOfWeek", Number(e.target.value))
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {Object.entries(DAY_NAMES).map(([val, label]) => {
                    const dayNum = Number(val);
                    const isBlocked = blocked.includes(dayNum);
                    return (
                      <option key={val} value={dayNum} disabled={isBlocked}>
                        {label}{isBlocked ? " (taken)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Start time */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Start
                </label>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateRow(i, "startTime", e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* End time */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  End
                </label>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateRow(i, "endTime", e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Remove row */}
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="ml-auto self-end rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  aria-label="Remove row"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          );
        })}

        {/* Preview */}
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
            Preview
          </p>
          <div className="flex flex-wrap gap-2">
            {rows
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((r, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white border border-indigo-200 px-2.5 py-0.5 text-xs text-indigo-700"
                >
                  {DAY_NAMES[r.dayOfWeek]}: {r.startTime} – {r.endTime}
                </span>
              ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Saving…" : "Save Working Hours"}
          </button>
        </div>
      </form>
    </section>
  );
};

// ─── Member: My Bookings placeholder ────────────────────────────────────────

const MyBookings = () => {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-800">
        <FiList className="text-indigo-500" />
        My Sessions
      </h2>
      <p className="mb-5 text-xs text-gray-400">
        View and manage your upcoming session bookings.
      </p>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <FiCalendar size={32} className="text-gray-300" />
        <p className="text-sm font-medium text-gray-500">
          View all your upcoming and past sessions
        </p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => navigate("/sessions")}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            My Sessions
          </button>
          <button
            onClick={() => navigate("/professionals")}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Find a Professional
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

type UserShape = {
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
};

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { addedHours } = useAppSelector((state) => state.professionals);
  const { firstName, lastName, role } = user as UserShape;

  const isProfessional = role === "PROFESSIONAL";

  // Show saved view if hours have been saved this session, otherwise show form
  const [showForm, setShowForm] = useState(addedHours.length === 0);

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Welcome header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 select-none">
              {firstName?.[0]}{lastName?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome back, {firstName}!
              </h1>
              <span
                className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold
                  ${isProfessional
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700"
                  }`}
              >
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Role-specific section */}
        {isProfessional ? (
          showForm ? (
            <SetWorkingHours onSuccess={() => setShowForm(false)} />
          ) : (
            <SavedHours onEdit={() => setShowForm(true)} />
          )
        ) : (
          <MyBookings />
        )}

      </div>
    </main>
  );
};

export default Dashboard;
