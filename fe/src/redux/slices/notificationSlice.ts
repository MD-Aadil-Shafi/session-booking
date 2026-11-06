import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authTokenHeader, baseUrl } from "../baseUrl";
import { errorToast } from "../../utils/errorToast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  reminderId: string | null;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

// GET /notifications
export const listNotificationsAction = createAsyncThunk(
  "/notifications/list",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${baseUrl}/notifications`, {
        headers: { ...authTokenHeader },
      });
      return res.data.data as Notification[];
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch notifications."
      );
    }
  }
);

// GET /notifications/unread-count
export const unreadCountAction = createAsyncThunk(
  "/notifications/unread-count",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${baseUrl}/notifications/unread-count`, {
        headers: { ...authTokenHeader },
      });
      return res.data.data.count as number;
    } catch (err: any) {
      // silent — badge failure shouldn't toast
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch unread count."
      );
    }
  }
);

// PATCH /notifications/:id/read
export const markReadAction = createAsyncThunk(
  "/notifications/markRead",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await axios.patch(
        `${baseUrl}/notifications/${notificationId}/read`,
        {},
        { headers: { ...authTokenHeader } }
      );
      return notificationId;
    } catch (err: any) {
      errorToast(err);
      return rejectWithValue(
        err?.response?.data?.message || "Failed to mark notification as read."
      );
    }
  }
);

// ─── State ────────────────────────────────────────────────────────────────────

interface NotificationState {
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  loading: false,
  notifications: [],
  unreadCount: 0,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // list
    builder
      .addCase(listNotificationsAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        listNotificationsAction.fulfilled,
        (state, action: PayloadAction<Notification[]>) => {
          state.loading = false;
          state.notifications = action.payload;
        }
      )
      .addCase(listNotificationsAction.rejected, (state) => {
        state.loading = false;
      });

    // unread count
    builder
      .addCase(
        unreadCountAction.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.unreadCount = action.payload;
        }
      );

    // mark read — optimistically update in-state
    builder
      .addCase(
        markReadAction.fulfilled,
        (state, action: PayloadAction<string>) => {
          const id = action.payload;
          state.notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          );
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      );
  },
});

export default notificationSlice.reducer;
