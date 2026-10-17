import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'complete-queries',
  number: 14,
  title: 'Putting Queries Together',
  subtitle: 'The full SELECT toolkit',
  defaultQuery: `SELECT courses.name AS course_name,
       AVG(students.age) AS average_age
FROM students
JOIN courses
  ON students.course_id = courses.id
GROUP BY courses.id, courses.name;`,
  didYouKnow: `SQL is written top-to-bottom but executed bottom-to-top-ish: FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. That's why you can't use a column alias in WHERE — the alias doesn't exist yet at that point in execution.`,
  content: `You now have all the pieces. This lesson is about combining them into real queries.

**Query execution order** (memorize the shape):

| Step | Clause | What it does |
|---|---|---|
| 1 | \`FROM\` | Start with the table(s) |
| 2 | \`JOIN\` | Combine tables |
| 3 | \`WHERE\` | Filter individual rows |
| 4 | \`GROUP BY\` | Collapse into groups |
| 5 | \`HAVING\` | Filter groups |
| 6 | \`SELECT\` | Pick columns / compute values |
| 7 | \`ORDER BY\` | Sort |
| 8 | \`LIMIT\` | Cut |

This order explains why:

- \`WHERE\` can't use aggregate functions (they don't exist yet at step 3)
- \`HAVING\` can (it runs after step 4)
- Column aliases from \`SELECT\` can't be used in \`WHERE\` (step 6 comes after step 3)

**Building up a real query:**

**Step 1** — Join students to courses:
\`\`\`sql
SELECT students.name, courses.name, students.age
FROM students
JOIN courses ON students.course_id = courses.id;
\`\`\`

**Step 2** — Only active courses:
\`\`\`sql
SELECT students.name, courses.name, students.age
FROM students
JOIN courses ON students.course_id = courses.id
WHERE courses.active = 1;
\`\`\`

**Step 3** — Count students per course:
\`\`\`sql
SELECT courses.name, COUNT(*) AS student_count
FROM students
JOIN courses ON students.course_id = courses.id
WHERE courses.active = 1
GROUP BY courses.id, courses.name;
\`\`\`

**Step 4** — Only busy courses:
\`\`\`sql
SELECT courses.name, COUNT(*) AS student_count
FROM students
JOIN courses ON students.course_id = courses.id
WHERE courses.active = 1
GROUP BY courses.id, courses.name
HAVING COUNT(*) > 1;
\`\`\`

**Step 5** — Sort and limit:
\`\`\`sql
SELECT courses.name, COUNT(*) AS student_count
FROM students
JOIN courses ON students.course_id = courses.id
WHERE courses.active = 1
GROUP BY courses.id, courses.name
HAVING COUNT(*) > 1
ORDER BY student_count DESC
LIMIT 2;
\`\`\`

**Two important habits:**

1. **Always GROUP BY every non-aggregated column** you select. Here, that's \`courses.id\` and \`courses.name\`. SQLite is lenient, but stricter databases aren't.
2. **When in doubt, build up step by step.** Run after each clause you add. If results look wrong, the last clause you added is the culprit.

That's the complete SELECT toolkit. The next lessons cover changing data — INSERT, UPDATE, DELETE.`,
  tasks: [
    {
      id: 'complete-1',
      prompt:
        "Show each course's name (as course_name) and the number of students enrolled (as student_count).",
      hint: 'JOIN students and courses, GROUP BY courses.id and courses.name.',
      solutionQuery:
        'SELECT courses.name AS course_name, COUNT(*) AS student_count FROM students JOIN courses ON students.course_id = courses.id GROUP BY courses.id, courses.name;',
    },
    {
      id: 'complete-2',
      prompt:
        "Same as before, but only for courses where active = 1. Display course_name and student_count.",
      hint: 'Add a WHERE clause before the GROUP BY.',
      solutionQuery:
        'SELECT courses.name AS course_name, COUNT(*) AS student_count FROM students JOIN courses ON students.course_id = courses.id WHERE courses.active = 1 GROUP BY courses.id, courses.name;',
    },
    {
      id: 'complete-3',
      prompt:
        'Show only active courses with more than 2 students. Display course_name and student_count.',
      hint: 'Add a HAVING clause after GROUP BY.',
      solutionQuery:
        'SELECT courses.name AS course_name, COUNT(*) AS student_count FROM students JOIN courses ON students.course_id = courses.id WHERE courses.active = 1 GROUP BY courses.id, courses.name HAVING COUNT(*) > 2;',
    },
    {
      id: 'complete-4',
      prompt:
        "For each active course, show its name (as course_name) and the average student age (as avg_age), sorted by avg_age descending.",
      hint: 'AVG(students.age), GROUP BY, ORDER BY AVG(students.age) DESC.',
      solutionQuery:
        'SELECT courses.name AS course_name, AVG(students.age) AS avg_age FROM students JOIN courses ON students.course_id = courses.id WHERE courses.active = 1 GROUP BY courses.id, courses.name ORDER BY AVG(students.age) DESC;',
      orderMatters: true,
    },
    {
      id: 'complete-5',
      prompt:
        'Show the single active course with the highest average student age. Display course_name and avg_age.',
      hint: 'Same query as task 4, but add LIMIT 1.',
      solutionQuery:
        'SELECT courses.name AS course_name, AVG(students.age) AS avg_age FROM students JOIN courses ON students.course_id = courses.id WHERE courses.active = 1 GROUP BY courses.id, courses.name ORDER BY AVG(students.age) DESC LIMIT 1;',
      orderMatters: true,
    },
  ],
};

export default lesson;