# EduShare PCLU update

## What changed

- Replaced the app’s existing school marks with the supplied PCLU seal.
- Reframed class feeds as faculty-authored Announcements. Students can read and comment; creating a post through the API is faculty-only.
- Renamed the roster page to Student Information Sheet. Faculty can search enrolled students by name, email, or department/program and export the visible roster to CSV.
- Added numeric assignment scores (0–100) and student-visible faculty feedback. The Grading System displays assignment and assessment scores, per-student averages, and can export the gradebook to CSV.
- Connected short-answer assessment grading to the existing grading API, including per-question partial credit.
- Added a Syllabus tab for the course overview, learning outcomes, grading policy, weekly schedule, and syllabus/course-file attachments.
- Added attendance sessions with Present, Absent, Late, Excused, and Unmarked states. Faculty can record roll calls, and students can review their own attendance.

## Database update required

The grading and new syllabus/attendance fields and tables are additive. Before deploying the updated app, run:

```bash
npx prisma db push
npx prisma generate
```

Assignment grades use a 100-point scale. A student’s overall grade is the arithmetic mean of recorded assignment scores and best assessment-attempt percentages; ungraded items are excluded. Assessment grading retains its per-question points/rubric.
Course files use the existing `post-files` Supabase Storage bucket, with a 50 MB per-file limit.