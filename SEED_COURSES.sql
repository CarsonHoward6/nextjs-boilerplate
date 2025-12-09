-- ==============================================================================
-- SEED COURSES SCRIPT
-- ==============================================================================
-- This script populates the database with the standard courses expected by the LMS.
-- It also adds a UNIQUE constraint to course titles to prevent duplicates.
-- ==============================================================================

-- 1. Add Unique Constraint to Course Titles (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_title_key'
    ) THEN
        ALTER TABLE course ADD CONSTRAINT course_title_key UNIQUE (title);
    END IF;
END $$;

-- 2. Insert Standard Courses
-- These titles MUST match the "COURSE_TITLE_TO_ID" map in app/lms/page.tsx exactly.
INSERT INTO course (title) VALUES
    ('MATH 101'),
    ('CSC 102'),
    ('CHEM 103'),
    ('PHYS 104'),
    ('ENG 105'),
    ('BIO 106'),
    ('HIST 107'),
    ('ECON 108'),
    ('PSY 109'),
    ('ART 110'),
    ('MUS 111'),
    ('SPAN 112'),
    ('SOC 113'),
    ('PHIL 114'),
    ('STAT 115'),
    ('GEO 116'),
    ('BUS 117'),
    ('ENV 118'),
    ('NURS 119'),
    ('LAW 120')
ON CONFLICT (title) DO NOTHING;

-- 3. Success Message
DO $$
BEGIN
    RAISE NOTICE 'Standard courses seeded successfully.';
END $$;
