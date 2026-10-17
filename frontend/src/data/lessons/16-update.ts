import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'update',
  number: 16,
  title: 'UPDATE',
  subtitle: 'Changing existing rows',
  defaultQuery: `UPDATE students
SET age = 21
WHERE id = 3;`,
  didYouKnow: `Forgetting \`WHERE\` in an UPDATE changes *every row*. This is such a common bug that many production databases have "SQL_SAFE_UPDATES" mode — it refuses to run an UPDATE without WHERE. If your DB supports it, turn it on.`,
  content: `\`UPDATE\` changes values in existing rows.

**The syntax:**
\`\`\`sql
UPDATE students
SET age = 21
WHERE id = 3;
\`\`\`

Read this as: "in the students table, set age to 21 where id is 3."

**Update multiple columns at once:**
\`\`\`sql
UPDATE students
SET age = 21, city = 'Kochi'
WHERE id = 3;
\`\`\`

Comma-separated \`column = value\` pairs.

**You can use expressions:**
\`\`\`sql
UPDATE students SET age = age + 1 WHERE city = 'Kochi';
\`\`\`

That bumps every Kochi student's age by one year.

**The most important warning in this course:**

> If you forget \`WHERE\`, **every row** in the table gets updated.

\`\`\`sql
UPDATE students SET age = 21;   -- ❌ changes EVERY student's age to 21
\`\`\`

This is impossible to undo without a backup. **Always write \`WHERE\` first**, then fill in the rest of the query. It's a small habit that has saved many people their job.

**To be safe:** before running an UPDATE, run the same WHERE as a SELECT first:

\`\`\`sql
SELECT * FROM students WHERE city = 'Kochi';
\`\`\`

If the SELECT returns the rows you expect to change, then convert it to an UPDATE.`,
  tasks: [
    {
      id: 'update-1',
      prompt: "Change the age of the student with id 3 to 20.",
      solutionQuery: 'UPDATE students SET age = 20 WHERE id = 3;',
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'update-2',
      prompt: "Move the student named 'Anu' to 'Thrissur'.",
      hint: "Filter by name: WHERE name = 'Anu'.",
      solutionQuery: "UPDATE students SET city = 'Thrissur' WHERE name = 'Anu';",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'update-3',
      prompt: "Change the teacher of the 'Python Basics' course to 'Ms. Nair' and mark it inactive (active = 0).",
      hint: 'Two SET clauses separated by a comma.',
      solutionQuery:
        "UPDATE courses SET teacher = 'Ms. Nair', active = 0 WHERE name = 'Python Basics';",
      probeQuery: 'SELECT * FROM courses ORDER BY id;',
    },
    {
      id: 'update-4',
      prompt: "Increase the rating of every movie by 0.1.",
      hint: 'Use SET rating = rating + 0.1 with no WHERE clause.',
      solutionQuery: 'UPDATE movies SET rating = rating + 0.1;',
      probeQuery: 'SELECT * FROM movies ORDER BY id;',
    },
    {
      id: 'update-5',
      prompt: "Bump the age of every student from Kochi by 1 year.",
      hint: "WHERE city = 'Kochi' — use SET age = age + 1.",
      solutionQuery: "UPDATE students SET age = age + 1 WHERE city = 'Kochi';",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
  ],
};

export default lesson;