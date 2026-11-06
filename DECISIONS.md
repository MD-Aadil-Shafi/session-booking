# Technical Decisions

## 1. Architecture

-   The application uses Node.js, TypeScript, Express, Prisma, and
    PostgreSQL.
-   The API and reminder worker run as separate processes.
-   PostgreSQL is the source of truth for users, sessions, reminders,
    and notifications.
-   The reminder worker checks PostgreSQL for reminders that are due.
-   Kafka and Socket.IO are not used in the current version. This keeps
    the system simpler to build and operate.
-   The frontend retrieves notifications through authenticated API
    endpoints.

## 2. Booking and double-booking prevention

-   A session lasts 50 minutes.
-   A 10-minute buffer is kept between sessions.
-   Availability is calculated from the professional's configured weekly
    working hours.
-   The API checks that a requested slot is in the professional's
    availability and is in the future.
-   Application-level checks provide useful validation messages, but
    they are not the final protection against concurrent bookings.
-   PostgreSQL exclusion constraints prevent overlapping active sessions
    for the same professional.
-   A separate exclusion constraint prevents a member from having
    overlapping active sessions.
-   A unique constraint also prevents duplicate bookings for the same
    professional and start time.
-   These database constraints protect against two requests booking
    conflicting slots at the same time.
-   If concurrent requests conflict, one transaction succeeds and the
    other is rejected. The API should translate the database conflict
    into a clear `409 Conflict` response.
-   Booking and reminder creation are performed in a database
    transaction so a session is not committed without its reminder
    records.

## 3. Reminder scheduling and delivery

-   Two reminders are scheduled for each participant: 24 hours and 1
    hour before the session.
-   Both the member and the professional receive their own reminder
    records.
-   Reminder times are stored as timestamps in PostgreSQL. They
    represent absolute instants, not local clock strings.
-   The reminder worker runs separately from the API and periodically
    looks for due reminders.
-   The worker claims due rows inside a database transaction using row
    locks and `FOR UPDATE SKIP LOCKED`.
-   Row locking prevents two worker instances from processing the same
    pending reminder at the same time.
-   The worker creates the in-app notification and marks the reminder as
    sent in the same transaction.
-   A unique constraint on the notification's reminder ID prevents more
    than one notification record from being created for the same
    reminder.
-   If the worker crashes before the transaction commits, PostgreSQL
    rolls back the work and the reminder can be tried again.
-   If the transaction commits, the notification is stored and the
    reminder is marked as sent.
-   This provides effectively-once creation of the in-app notification
    record for each reminder.
-   It does not guarantee exactly-once delivery to a device, email
    inbox, or external push service. The current version only persists
    in-app notifications; the frontend retrieves them from the API.
-   A reminder that is already in the past when a booking is created is
    not scheduled. For example, a booking made less than one hour before
    its start does not receive a one-hour-before reminder.
-   Rescheduling cancels old pending reminders and creates new reminders
    for the updated session time.
-   Cancellation prevents pending reminders from being delivered.
-   The worker must re-check that the session is still active and the
    reminder is still pending before creating a notification.
    Cancellation, rescheduling, and reminder processing should use a
    consistent database lock order to avoid races.
-   Failed worker batches are logged and retried on a later poll.
    Production operation should add attempt limits, backoff, alerting,
    and a dead-letter or failed-reminder review process.

## 4. Timezones and daylight saving time

-   Each user and professional has an IANA timezone, such as
    `Asia/Kuala_Lumpur` or `Asia/Kolkata`.
-   Weekly working hours are interpreted in the professional's local
    timezone.
-   Availability is generated using the professional's local calendar
    and working hours.
-   The API converts available slot start and end times to UTC instants
    before storing or comparing them.
-   PostgreSQL stores session and reminder timestamps as absolute
    instants. The database server timezone must not be used to interpret
    a user's local working hours.
-   The member sees available times converted from UTC into the member's
    own timezone.
-   The frontend should display the timezone or a clear local-time label
    so users understand which timezone is being shown.
-   IANA timezone rules account for daylight saving changes when
    converting local dates and times.
-   A daylight saving transition can make a local time ambiguous because
    it occurs twice, or invalid because it does not occur.
-   The current implementation relies on the timezone library's
    conversion behavior for these edge cases. It does not provide an
    explicit user-facing choice for an ambiguous time or a dedicated
    validation flow for a nonexistent time.
-   Before production, define and test a clear policy: reject
    nonexistent local times, and require an explicit offset or
    earlier/later choice for ambiguous local times.
-   Store the resolved UTC instant for every confirmed session. Do not
    recalculate an existing booking's instant just because timezone
    rules or a user's timezone setting later changes.
-   Changing a user's display timezone should change how times are
    shown, not silently move an already-booked session.

## 5. Authentication and authorization

-   Access tokens are short-lived JWTs.
-   Refresh tokens are stored as hashes in the database and rotated when
    used.
-   Protected endpoints identify the current user from the verified
    access token.
-   Members and professionals have different permissions.
-   Every session, notification, and reminder query must be scoped to
    the authenticated user or checked against the user's role. A
    client-supplied user ID must not be trusted for authorization.
-   Public registration should not allow a user to grant themselves a
    privileged professional role unless that is an intentional
    onboarding policy.

## 6. Assumptions

-   A session is 50 minutes long, with a 10-minute buffer.
-   A professional has one working interval per weekday in the initial
    version.
-   Availability is shown for the next 28 calendar days in the
    professional's timezone.
-   A member cannot have overlapping active sessions.
-   A professional cannot have overlapping active sessions.
-   Members may cancel or reschedule up to 24 hours before a session.
-   Professionals may cancel or reschedule at any time, subject to the
    product's business rules.
-   The current notification channel is in-app notification storage and
    API retrieval. Email, SMS, and mobile push delivery are not
    included.
-   The system uses PostgreSQL as the authoritative store. It does not
    depend on an in-memory timer for reminder durability.

## 7. Known limitations and risks

-   The current worker is a polling process. It introduces a small delay
    between the scheduled reminder time and notification creation.
-   Running multiple workers is supported only when all workers use the
    same database locking and idempotency rules.
-   A worker outage delays reminders until it restarts. Monitoring and
    alerting are needed to detect this.
-   The current design does not provide email, SMS, or mobile push
    delivery.
-   A database notification being created does not prove that a person
    saw or read it.
-   The current design does not include a complete audit trail for every
    sensitive action.
-   The initial weekly-hours model supports only one interval per
    weekday.
-   Daylight saving ambiguous and nonexistent local times need an
    explicit product policy and stronger validation.
-   Database constraint errors, authorization failures, validation
    errors, and unexpected server errors need consistent typed error
    handling and safe API responses.
-   Automated integration tests are needed for simultaneous bookings,
    cancellations racing with reminders, rescheduling, worker restarts,
    and daylight saving transitions.

## 8. What I would do next
1.  Add worker health checks, structured logs, metrics, alerting, retry
    backoff, and failed-reminder recovery.
2.  Add pagination, retention rules, and indexes for notification
    history.
3.  Add an audit log for booking, cancellation, rescheduling, access to
    sensitive records, and administrative actions.
4.  Add email or push delivery through a separate provider integration
    if the product requires it. Keep the database notification as the
    durable source of truth.
5.  Add rate limits, stricter input validation, secure cookie settings
    where cookies are used, secret rotation, and dependency/security
    scanning.
6.  Add database backups and a documented incident response process.
7. Load-test availability queries, booking transactions, and reminder
    processing using realistic traffic.

## 9. What must change before using this for a healthcare product?

This implementation is a scheduling prototype, not a
healthcare-compliance-ready system. Before handling real patient
information, I would make the following changes.

### Privacy and data minimization

-   Store only the personal and appointment information required for the
    service.
-   Keep sensitive health information out of notification titles,
    messages, URLs, logs, and analytics.
-   Use generic reminder text, such as "You have an upcoming
    appointment." Show sensitive details only after the user signs in
    and is authorized.
-   Define data retention, deletion, export, and legal-hold policies.
-   Encrypt network traffic with TLS and encrypt database storage,
    backups, and other sensitive data at rest.
-   Manage encryption keys and application secrets in a dedicated
    secrets-management service. Rotate them and restrict access.

## 10. Summary

The current design favors simplicity and uses PostgreSQL transactions
and constraints for correctness. Database constraints prevent
conflicting bookings, while a separate worker processes durable reminder
records. UTC timestamps and IANA timezones support users in different
regions. Before healthcare use, the system needs formal privacy,
security, audit, resilience, compliance, and clinical-safety reviews.
