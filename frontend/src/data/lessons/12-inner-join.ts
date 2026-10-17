import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'inner-join',
  number: 12,
  title: 'INNER JOIN',
  subtitle: 'Combining rows from two tables',
  defaultQuery: `SELECT students.name AS student_name,
       courses.teacher AS teacher
FROM students
INNER JOIN courses
  ON students.course_id = courses.id;`,
  didYouKnow: `Every JOIN needs an ON condition. Without one, you'd get a "cross join" — every row from the left paired with every row from the right. With 1,000 students and 4 courses, that's 4,000 rows. Almost never what you want.`,
  content: `A **JOIN** combines rows from two tables based on a matching condition.

**The setup:**

- \`students\` has a \`course_id\` column that points to \`courses.id\`
- We want to see, for each student, the course they're enrolled in

**The syntax:**
\`\`\`sql
SELECT students.name, courses.name
FROM students
JOIN courses
  ON students.course_id = courses.id;
\`\`\`

Read this as:

- \`FROM students\` — start with the students table
- \`JOIN courses\` — attach the courses table
- \`ON students.course_id = courses.id\` — the rule for matching rows

**The two tables:**

| students.id | name | course_id |
|---|---|---|
| 1 | Anu | 1 |
| 2 | Rahul | 2 |
| 3 | Meera | 1 |
| 4 | Arjun | 3 |
| 6 | Karthik | NULL |

| courses.id | name | teacher |
|---|---|---|
| 1 | Python Basics | Mr. Nair |
| 2 | Web Development | Ms. Iyer |
| 3 | Data Science | Dr. Menon |
| 4 | Mobile Apps | Mr. Krishnan |

Each student row is matched to the course row whose \`id\` equals the student's \`course_id\`.

**INNER JOIN — the important bit:**

\`JOIN\` is shorthand for \`INNER JOIN\`. It only keeps rows that have a match on both sides.

Look at **Karthik** — his \`course_id\` is NULL. There's no course with \`id = NULL\`, so he's **excluded** from the result.

That's the defining behavior of an INNER JOIN: **only matching rows survive.**

**If both tables have a column with the same name**, you must qualify it: \`students.name\` and \`courses.name\`. Otherwise SQL doesn't know which one you mean.

**A common pattern** — alias the columns so the output is readable:

\`\`\`sql
SELECT students.name AS student_name,
       courses.name AS course_name
FROM students
JOIN courses ON students.course_id = courses.id;
\`\`\``,
  tasks: [
    {
      id: 'innerjoin-1',
      prompt:
        "Show each student's name (as student_name) and their course's name (as course_name).",
      hint: 'JOIN students to courses ON students.course_id = courses.id. Alias the two name columns.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name FROM students JOIN courses ON students.course_id = courses.id;',
    },
    {
      id: 'innerjoin-2',
      prompt:
        "Show each student's name (as student_name), their course's name (as course_name), and the teacher (as teacher).",
      hint: 'Three columns, two tables — the teacher comes from courses.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name, courses.teacher AS teacher FROM students JOIN courses ON students.course_id = courses.id;',
    },
    {
      id: 'innerjoin-3',
      prompt:
        "Show only students enrolled in 'Python Basics'. Display student_name and course_name.",
      hint: "Add a WHERE clause filtering courses.name = 'Python Basics'.",
      solutionQuery:
        "SELECT students.name AS student_name, courses.name AS course_name FROM students JOIN courses ON students.course_id = courses.id WHERE courses.name = 'Python Basics';",
    },
    {
      id: 'innerjoin-4',
      prompt:
        'Show all student_name / course_name pairs, sorted alphabetically by student_name.',
      hint: 'Add ORDER BY students.name.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name FROM students JOIN courses ON students.course_id = courses.id ORDER BY students.name;',
      orderMatters: true,
    },
    {
      id: 'innerjoin-5',
      prompt:
        "Show student_name, course_name, and teacher — but only for courses where active = 1.",
      hint: 'Add WHERE courses.active = 1.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name, courses.teacher AS teacher FROM students JOIN courses ON students.course_id = courses.id WHERE courses.active = 1;',
    },
  ],
  showSchema: true,
};

export default lesson;