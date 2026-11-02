-- Users can view their own profile.
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());


-- Students can view their own student profile.
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.user_id = students.student_number
        AND users.auth_user_id = auth.uid()
    )
);


-- Student organizations can view their own profile.
CREATE POLICY "Organizations can view own profile"
ON public.student_organization
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.user_id = student_organization.org_id
        AND users.auth_user_id = auth.uid()
    )
);


-- Administrators can view their own profile.
CREATE POLICY "Admins can view own profile"
ON public.administrators
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE users.user_id = administrators.admin_id
        AND users.auth_user_id = auth.uid()
    )
);


-- Authenticated users can view event types.
CREATE POLICY "Authenticated users can view event types"
ON public.event_type
FOR SELECT
TO authenticated
USING (true);


-- Authenticated users can view venues.
CREATE POLICY "Authenticated users can view venues"
ON public.venue
FOR SELECT
TO authenticated
USING (true);


-- Organizations can view their own proposals. Admins can view all proposals.
CREATE POLICY "Organizations and admins can view proposals"
ON public.event_proposal
FOR SELECT
TO authenticated
USING (
    org_id IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = auth.uid()
    )
    OR public.get_my_role() = 'Admin'
);


-- Organizations can submit proposals under their own account.
CREATE POLICY "Organizations can insert own proposals"
ON public.event_proposal
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_my_role() = 'Student Organization'
    AND org_id IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = auth.uid()
    )
);


-- Organizations can update their own pending proposals.
CREATE POLICY "Organizations can update own pending proposals"
ON public.event_proposal
FOR UPDATE
TO authenticated
USING (
    public.get_my_role() = 'Student Organization'
    AND approval_status = 'Pending'
    AND org_id IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    public.get_my_role() = 'Student Organization'
    AND approval_status = 'Pending'
    AND org_id IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = auth.uid()
    )
);


-- Admins can update proposals.
CREATE POLICY "Admins can update proposals"
ON public.event_proposal
FOR UPDATE
TO authenticated
USING (public.get_my_role() = 'Admin')
WITH CHECK (public.get_my_role() = 'Admin');


-- Organizations can view schedules for their own proposals. Admins can view all.
CREATE POLICY "Organizations and admins can view proposal schedules"
ON public.proposal_schedule
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.event_proposal
        WHERE event_proposal.proposal_id = proposal_schedule.proposal_id
        AND (
            event_proposal.org_id IN (
                SELECT user_id
                FROM public.users
                WHERE auth_user_id = auth.uid()
            )
            OR public.get_my_role() = 'Admin'
        )
    )
);


-- Organizations can view reviews for their own proposals. Admins can view all.
CREATE POLICY "Organizations and admins can view proposal reviews"
ON public.proposal_review
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.event_proposal
        WHERE event_proposal.proposal_id = proposal_review.proposal_id
        AND (
            event_proposal.org_id IN (
                SELECT user_id
                FROM public.users
                WHERE auth_user_id = auth.uid()
            )
            OR public.get_my_role() = 'Admin'
        )
    )
);


-- Authenticated users can view published events. Admins can view all events.
CREATE POLICY "Users and admins can view events"
ON public.event
FOR SELECT
TO authenticated
USING (
    publication_status = 'Published'
    OR public.get_my_role() = 'Admin'
);


-- Students can view their own registrations.
CREATE POLICY "Students can view own registrations"
ON public.registration
FOR SELECT
TO authenticated
USING (
    student_number IN (
        SELECT students.student_number
        FROM public.students
        JOIN public.users ON users.user_id = students.student_number
        WHERE users.auth_user_id = auth.uid()
    )
);


-- Organizations can view registrations for their own events.
CREATE POLICY "Organizations can view own event registrations"
ON public.registration
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.event
        WHERE event.event_id = registration.event_id
        AND event.org_id IN (
            SELECT user_id
            FROM public.users
            WHERE auth_user_id = auth.uid()
        )
    )
);


-- Admins can view all registrations.
CREATE POLICY "Admins can view all registrations"
ON public.registration
FOR SELECT
TO authenticated
USING (public.get_my_role() = 'Admin');


-- Students can register using their own student number.
CREATE POLICY "Students can insert own registrations"
ON public.registration
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_my_role() = 'Student'
    AND student_number IN (
        SELECT students.student_number
        FROM public.students
        JOIN public.users ON users.user_id = students.student_number
        WHERE users.auth_user_id = auth.uid()
    )
);


-- Admins can update registrations.
CREATE POLICY "Admins can update registrations"
ON public.registration
FOR UPDATE
TO authenticated
USING (public.get_my_role() = 'Admin')
WITH CHECK (public.get_my_role() = 'Admin');


-- Admins can delete registrations.
CREATE POLICY "Admins can delete registrations"
ON public.registration
FOR DELETE
TO authenticated
USING (public.get_my_role() = 'Admin');


-- Organizations can view bookings for their own events. Admins can view all.
CREATE POLICY "Organizations and admins can view venue bookings"
ON public.venue_booking
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.event
        WHERE event.event_id = venue_booking.event_id
        AND (
            event.org_id IN (
                SELECT user_id
                FROM public.users
                WHERE auth_user_id = auth.uid()
            )
            OR public.get_my_role() = 'Admin'
        )
    )
);


-- Users can view their own notifications.
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    recipient_user_id IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = auth.uid()
    )
);