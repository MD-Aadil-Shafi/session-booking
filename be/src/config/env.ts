import { config } from "dotenv";

config();

export const env = {
    PORT: process.env.PORT || 5001,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET:process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '60m',
    REFRESH_SECRET:process.env.REFRESH_SECRET,
    REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || '30d',
    REFRESH_EXPIRES_DAYS: process.env.REFRESH_EXPIRES_DAYS,
    SESSION_DURATION_MINUTES: process.env.SESSION_DURATION_MINUTES || 50,
    SLOT_INTERVAL_MINUTES: process.env.SLOT_INTERVAL_MINUTES || 60
}
