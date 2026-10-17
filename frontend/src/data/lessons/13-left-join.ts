import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'left-join',
  number: 13,
  title: 'LEFT JOIN',
  subtitle: 'Keeping every row from the left',
  defaultQuery: `SELECT students.name AS student_name,
       courses.teacher AS teacher
FROM students
LEFT JOIN courses
  ON students.course_id = courses.id;`,
  didYouKnow: `In real analytics work, LEFT JOIN is often used more than INNER JOIN — because losing rows silently is usually worse than seeing NULLs. NULLs tell you "there's missing data here", which is information. A missing row tells you nothing.`,
  content: `INNER JOIN only returns matching rows. **Karthik** — the student with no course — disappeared from the results.

But what if you want to keep *every* student, even the ones without a course? That's what **LEFT JOIN** does.

**The idea:**

> LEFT JOIN keeps every row from the **left** table, even when there's no match on the right.

When there's no match, the right-side columns come back as **NULL**.

**The syntax:**
\`\`\`sql
SELECT students.name, courses.name
FROM students
LEFT JOIN courses
  ON students.course_id = courses.id;
\`\`\`

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

**Result comparison:**

| Query | Rows returned |
|---|---|
| INNER JOIN | 7 (Karthik excluded) |
| LEFT JOIN | 8 (Karthik included, with NULL course) |

**A useful pattern** — find the "orphans" (rows with no match):

\`\`\`sql
SELECT students.name
FROM students
LEFT JOIN courses ON students.course_id = courses.id
WHERE courses.id IS NULL;
\`\`\`

That finds every student who isn't enrolled in any course. The LEFT JOIN keeps everyone; the WHERE filters down to just the ones with no course.

**The reverse also works** — to find courses with no students, use \`courses LEFT JOIN students\` and filter where \`students.id IS NULL\`.

**Direction matters:** LEFT JOIN keeps the *left* table's rows. Swap the tables and you keep the other side.`,
  tasks: [
    {
      id: 'leftjoin-1',
      prompt:
        "Show every student's name (as student_name) and their course name (as course_name). Include students who aren't enrolled in any course.",
      hint: 'Use LEFT JOIN instead of JOIN.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name FROM students LEFT JOIN courses ON students.course_id = courses.id;',
    },
    {
      id: 'leftjoin-2',
      prompt:
        "Find students who aren't enrolled in ANY course. Show their name as student_name.",
      hint: 'LEFT JOIN, then filter WHERE courses.id IS NULL.',
      solutionQuery:
        'SELECT students.name AS student_name FROM students LEFT JOIN courses ON students.course_id = courses.id WHERE courses.id IS NULL;',
    },
    {
      id: 'leftjoin-3',
      prompt:
        "Find courses that have no students enrolled. Show the course name as course_name.",
      hint: 'This time courses is the left table. Filter WHERE students.id IS NULL.',
      solutionQuery:
        'SELECT courses.name AS course_name FROM courses LEFT JOIN students ON students.course_id = courses.id WHERE students.id IS NULL;',
    },
    {
      id: 'leftjoin-4',
      prompt:
        "Show every course's name (as course_name) along with the name of each enrolled student (as student_name). Include courses with no students.",
      hint: 'courses is the left table, students is the right.',
      solutionQuery:
        'SELECT courses.name AS course_name, students.name AS student_name FROM courses LEFT JOIN students ON students.course_id = courses.id;',
    },
    {
      id: 'leftjoin-5',
      prompt:
        'Show every student name (as student_name) and their course name (as course_name), sorted by student_name. Include students with no course.',
      hint: 'LEFT JOIN + ORDER BY.',
      solutionQuery:
        'SELECT students.name AS student_name, courses.name AS course_name FROM students LEFT JOIN courses ON students.course_id = courses.id ORDER BY students.name;',
      orderMatters: true,
    },
  ],
  showSchema: true,
};

export default lesson;