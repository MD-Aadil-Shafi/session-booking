CREATE EXTENSION IF NOT EXISTS btree_gist;

-- A professional cannot have two active sessions
-- whose time ranges overlap.

ALTER TABLE "Session"
ADD CONSTRAINT "professional_no_overlap"
EXCLUDE USING gist (
    "professionalId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'BOOKED');


-- A member cannot book overlapping sessions
-- with different professionals either.

ALTER TABLE "Session"
ADD CONSTRAINT "member_no_overlap"
EXCLUDE USING gist (
    "memberId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'BOOKED');


-- Only one active booking for the same professional
-- and starting timestamp.

CREATE UNIQUE INDEX "professional_unique_active_start"
ON "Session" ("professionalId", "startsAt")
WHERE "status" = 'BOOKED';