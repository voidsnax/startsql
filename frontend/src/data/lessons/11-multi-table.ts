import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'multi-table',
  number: 11,
  title: 'Why Do We Need Multiple Tables?',
  subtitle: 'The problem JOINs solve',
  defaultQuery: 'SELECT name, course_id FROM students;',
  tasks: [],
  showSchema: true,
  didYouKnow: `The link between \`students.course_id\` and \`courses.id\` is called a **foreign key**. Real databases often enforce this — you couldn't insert a student with \`course_id = 99\` if no course 99 exists. SQLite doesn't enforce it by default, but the *concept* is universal.`,
  content: `Imagine storing everything in one giant table:

| id | name | course_name | teacher |
|---|---|---|---|
| 1 | Anu | Python Basics | Mr. Nair |
| 2 | Rahul | Web Development | Ms. Iyer |
| 3 | Meera | Python Basics | Mr. Nair |
| 4 | Arjun | Data Science | Dr. Menon |
| 5 | Divya | Web Development | Ms. Iyer |

It *works*, but it has three problems:

**1. Redundancy.** "Python Basics" and "Mr. Nair" repeat for every enrolled student. Change the teacher's name and you'd have to update *every row*.

**2. Inconsistency risk.** Nothing stops one row from saying "Mr. Nair" and another saying "Mr Nair" (missing period). The database can't help.

**3. Storage waste.** With 1,000 students across 4 courses, you're repeating the same 4 course names 1,000 times.

**The fix: split related information into its own table.**

The \`students\` table now just *points to* a course with \`course_id\`:

| id | name | course_id |
|---|---|---|
| 1 | Anu | 1 |
| 2 | Rahul | 2 |
| 3 | Meera | 1 |
| 4 | Arjun | 3 |
| 5 | Divya | 2 |

And the course data lives in its own table:

| id | name | teacher |
|---|---|---|
| 1 | Python Basics | Mr. Nair |
| 2 | Web Development | Ms. Iyer |
| 3 | Data Science | Dr. Menon |
| 4 | Mobile Apps | Mr. Krishnan |

Now the course data lives in exactly one place. Students just point to a course with \`course_id\`.

**This is called normalization** — one of the core ideas of database design. You'll rarely need to think about it deeply as a beginner, but know that it exists and that it's normal to split data across tables.

**The new problem:** how do you ask "show me each student's name *and* their course name" when the two pieces of data live in different tables?

That's exactly what the next two lessons solve.`,
};

export default lesson;