import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import {
  getSingProfAction,
  getAvailabilityAction,
  type availabilityData,
  type workingHoursType,
} from "../redux/slices/professionalSlice";
import {
  bookSessionAction,
  clearBooked,
} from "../redux/slices/sessionSlice";

type Slot = availabilityData["slots"][number];
import { FiArrowLeft, FiClock, FiGlobe, FiCalendar } from "react-icons/fi";

const DAY_NAMES = [
  "",          // 0 – unused (dayOfWeek is 1-based)
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Format "2026-11-09" → "Mon, Nov 9" */
const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/** Format "2026-11-09 06:30" → "06:30" */
const timeOnly = (localDt: string) => localDt.split(" ")[1] ?? localDt;

/** Extract date part "2026-11-09" from localStart string */
const dateKey = (localDt: string) => localDt.split(" ")[0] ?? localDt;

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { profProfile, availability, loading } = useAppSelector(
    (state) => state.professionals
  );
  const { bookLoading, booked } = useAppSelector((state) => state.sessions);

  // Detect the user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    if (id) {
      dispatch(getSingProfAction(id));
    }
  }, [id, dispatch]);

  // Fetch availability once we have the profile id
  useEffect(() => {
    if (id) {
      dispatch(
        getAvailabilityAction({ professional_id: id, timezone: userTimezone })
      );
    }
  }, [id, dispatch, userTimezone]);

  // Group slots by date
  const slots: Slot[] = availability?.slots ?? [];
  const slotsByDate: Record<string, Slot[]> = slots.reduce(
    (acc: Record<string, Slot[]>, slot: Slot) => {
      const key = dateKey(slot.localStart);
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(slotsByDate).sort();

  // Auto-select first date when availability loads
  useEffect(() => {
    if (sortedDates.length && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates.join(",")]);

  if (loading && !profProfile) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600" />
          <p className="text-sm">Loading profile…</p>
        </div>
      </main>
    );
  }

  if (!profProfile) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-gray-50">
        <p className="text-gray-500">Professional not found.</p>
      </main>
    );
  }

  const { firstName, lastName, timezone, workingHours } = profProfile;

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate("/professionals")}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <FiArrowLeft />
          Back to Professionals
        </button>

        {/* ── Profile Header ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 select-none">
                {firstName?.[0]}{lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {firstName} {lastName}
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                  <FiGlobe className="shrink-0" />
                  {timezone}
                </p>
              </div>
            </div>

            {/* Quick info pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <FiCalendar size={12} />
                {availability?.totalSlots ?? "—"} available slots
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <FiClock size={12} />
                {availability?.memberTimezone ?? userTimezone}
              </span>
            </div>
          </div>

          {/* About placeholder */}
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </section>

        {/* ── Working Hours ───────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
            <FiClock className="text-indigo-500" />
            Working Hours
            <span className="ml-1 text-xs font-normal text-gray-400">
              ({timezone})
            </span>
          </h2>

          {workingHours && workingHours.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(workingHours as workingHoursType[])
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((wh) => (
                  <div
                    key={wh.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
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
          ) : (
            <p className="text-sm text-gray-400">No working hours set.</p>
          )}
        </section>

        {/* ── Availability Slots ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-800">
            <FiCalendar className="text-indigo-500" />
            Available Slots
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Times shown in your local timezone:{" "}
            <span className="font-medium text-gray-500">
              {availability?.memberTimezone ?? userTimezone}
            </span>
          </p>

          {loading && !availability ? (
            <p className="text-sm text-gray-400">Loading slots…</p>
          ) : sortedDates.length === 0 ? (
            <p className="text-sm text-gray-400">No available slots found.</p>
          ) : (
            <>
              {/* Date tabs */}
              <div className="mb-5 flex flex-wrap gap-2">
                {sortedDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot(null);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                      ${
                        selectedDate === d
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                  >
                    {formatDateLabel(d)}
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                        ${selectedDate === d ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      {slotsByDate[d].length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Slot grid for selected date */}
              {selectedDate && slotsByDate[selectedDate] && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {slotsByDate[selectedDate].map((slot) => {
                    const key = slot.startsAt;
                    const isSelected = selectedSlot === key;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setSelectedSlot(isSelected ? null : key)
                        }
                        className={`flex flex-col items-center rounded-xl border px-3 py-3 text-sm transition-all
                          ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-400"
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                      >
                        <span
                          className={`font-semibold ${isSelected ? "text-indigo-700" : "text-gray-800"}`}
                        >
                          {timeOnly(slot.localStart)}
                        </span>
                        <span className="mt-0.5 text-xs text-gray-400">
                          – {timeOnly(slot.localEnd)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Confirm booking bar */}
              {selectedSlot && selectedDate && (
                <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                  {booked?.startsAt === selectedSlot ? (
                    // ── Success state ──
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold">✓ Session booked!</p>
                        <p className="text-sm font-semibold text-indigo-700">
                          {formatDateLabel(selectedDate)}{" "}
                          {timeOnly(
                            slotsByDate[selectedDate].find(
                              (s) => s.startsAt === selectedSlot
                            )?.localStart ?? ""
                          )}{" "}
                          –{" "}
                          {timeOnly(
                            slotsByDate[selectedDate].find(
                              (s) => s.startsAt === selectedSlot
                            )?.localEnd ?? ""
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          dispatch(clearBooked());
                          setSelectedSlot(null);
                          navigate("/sessions");
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
                      >
                        View My Sessions
                      </button>
                    </div>
                  ) : (
                    // ── Confirm state ──
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Selected slot</p>
                        <p className="text-sm font-semibold text-indigo-700">
                          {formatDateLabel(selectedDate)}{" "}
                          {timeOnly(
                            slotsByDate[selectedDate].find(
                              (s) => s.startsAt === selectedSlot
                            )?.localStart ?? ""
                          )}{" "}
                          –{" "}
                          {timeOnly(
                            slotsByDate[selectedDate].find(
                              (s) => s.startsAt === selectedSlot
                            )?.localEnd ?? ""
                          )}
                        </p>
                      </div>
                      <button
                        disabled={bookLoading}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                        onClick={() => {
                          if (!profProfile?.id) return;
                          dispatch(
                            bookSessionAction({
                              professionalId: profProfile.id,
                              startsAt: selectedSlot,
                            })
                          );
                        }}
                      >
                        {bookLoading ? "Booking…" : "Book Session"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProfessionalProfile;
