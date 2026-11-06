import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authTokenHeader, baseUrl } from "../baseUrl";
import { toast } from "react-toastify";
import { errorToast } from "../../utils/errorToast";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStub = {
  id: string;
  firstName: string;
  lastName: string;
  timezone?: string;
};

export type SessionStatus = "BOOKED" | "CANCELLED" | "COMPLETED";

export interface Session {
  id: string;
  memberId: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  member?: UserStub;
  professional?: UserStub;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

// POST /sessions/book  — MEMBER only
type BookPayload = {
  professionalId: string;
  startsAt: string; // ISO 8601 with offset e.g. "2026-11-09T01:00:00.000Z"
};

export const bookSessionAction = createAsyncThunk(
  "/sessions/book",
  async (value: BookPayload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${baseUrl}/sessions/book`, value, {
        headers: { ...authTokenHeader },
      });
      toast.success(res?.data?.message || "Session booked successfully.");
      return res.data.data as Session;
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to book session."
      );
    }
  }
);

// POST /sessions/:id/cancel  — MEMBER or PROFESSIONAL
export const cancelSessionAction = createAsyncThunk(
  "/sessions/cancel",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${baseUrl}/sessions/${sessionId}/cancel`,
        {},
        { headers: { ...authTokenHeader } }
      );
      toast.success(res?.data?.data?.message || "Session cancelled.");
      return sessionId;
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to cancel session."
      );
    }
  }
);

// PATCH /sessions/:id/reschedule  — MEMBER only
type ReschedulePayload = {
  sessionId: string;
  startsAt: string; // ISO 8601 with offset
};

export const rescheduleSessionAction = createAsyncThunk(
  "/sessions/reschedule",
  async (value: ReschedulePayload, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${baseUrl}/sessions/${value.sessionId}/reschedule`,
        { startsAt: value.startsAt },
        { headers: { ...authTokenHeader } }
      );
      toast.success("Session rescheduled successfully.");
      return res.data.data as Session;
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to reschedule session."
      );
    }
  }
);

// GET /sessions/my?type=upcoming|past  — any authenticated user
export const mySessionsAction = createAsyncThunk(
  "/sessions/my",
  async (type: "upcoming" | "past", { rejectWithValue }) => {
    try {
      const res = await axios.get(`${baseUrl}/sessions/my?type=${type}`, {
        headers: { ...authTokenHeader },
      });
      return { type, sessions: res.data.data as Session[] };
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch sessions."
      );
    }
  }
);

// ─── State ────────────────────────────────────────────────────────────────────

interface SessionState {
  loading: boolean;
  bookLoading: boolean;
  upcoming: Session[];
  past: Session[];
  booked: Session | null; // last successfully booked session
}

const initialState: SessionState = {
  loading: false,
  bookLoading: false,
  upcoming: [],
  past: [],
  booked: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearBooked(state) {
      state.booked = null;
    },
  },
  extraReducers: (builder) => {
    // book
    builder
      .addCase(bookSessionAction.pending, (state) => {
        state.bookLoading = true;
      })
      .addCase(
        bookSessionAction.fulfilled,
        (state, action: PayloadAction<Session>) => {
          state.bookLoading = false;
          state.booked = action.payload;
          // optimistically add to upcoming list if it's already loaded
          if (state.upcoming.length) {
            state.upcoming.unshift(action.payload);
          }
        }
      )
      .addCase(bookSessionAction.rejected, (state) => {
        state.bookLoading = false;
      });

    // cancel
    builder
      .addCase(cancelSessionAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        cancelSessionAction.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          const cancelId = action.payload;
          const markCancelled = (s: Session) =>
            s.id === cancelId ? { ...s, status: "CANCELLED" as SessionStatus } : s;
          state.upcoming = state.upcoming.map(markCancelled);
          state.past = state.past.map(markCancelled);
        }
      )
      .addCase(cancelSessionAction.rejected, (state) => {
        state.loading = false;
      });

    // reschedule
    builder
      .addCase(rescheduleSessionAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        rescheduleSessionAction.fulfilled,
        (state, action: PayloadAction<Session>) => {
          state.loading = false;
          const updated = action.payload;
          state.upcoming = state.upcoming.map((s) =>
            s.id === updated.id ? updated : s
          );
        }
      )
      .addCase(rescheduleSessionAction.rejected, (state) => {
        state.loading = false;
      });

    // my sessions
    builder
      .addCase(mySessionsAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(mySessionsAction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type === "upcoming") {
          state.upcoming = action.payload.sessions;
        } else {
          state.past = action.payload.sessions;
        }
      })
      .addCase(mySessionsAction.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { clearBooked } = sessionSlice.actions;
export default sessionSlice.reducer;
