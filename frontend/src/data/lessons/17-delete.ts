import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'delete',
  number: 17,
  title: 'DELETE',
  subtitle: 'Removing rows',
  defaultQuery: `DELETE FROM students
WHERE id = 3;`,
  didYouKnow: `A DELETE can be rolled back if it runs inside a transaction that hasn't been committed yet (\`BEGIN; DELETE ...; ROLLBACK;\`). Outside a transaction, most databases treat DELETE as permanent. Some systems keep deleted rows in an "undo log" for a few minutes — but never rely on that.`,
  content: `\`DELETE\` removes rows from a table.

**The syntax:**
\`\`\`sql
DELETE FROM students
WHERE id = 3;
\`\`\`

**Delete multiple rows:**
\`\`\`sql
DELETE FROM students WHERE city = 'Kannur';
\`\`\`

**The same warning as UPDATE:**

> Without \`WHERE\`, \`DELETE\` removes **every row**.

\`\`\`sql
DELETE FROM students;   -- ❌ deletes every student
\`\`\`

The table still exists — it's just empty. That's the difference between DELETE and DROP TABLE (later lesson): DELETE removes *rows*, DROP removes the *table itself*.

**DELETE is not the same as setting a value to NULL:**

\`\`\`sql
UPDATE students SET phone = NULL WHERE id = 3;   -- row stays, phone is now NULL
DELETE FROM students WHERE id = 3;                -- row is gone entirely
\`\`\`

**Practice safe habits:**
1. Write the \`WHERE\` clause *first*, then the rest of the statement.
2. Run a \`SELECT * FROM ... WHERE ...\` to preview which rows will be deleted.
3. Only then write the actual DELETE.`,
  tasks: [
    {
      id: 'delete-1',
      prompt: "Delete the student with id 7.",
      solutionQuery: 'DELETE FROM students WHERE id = 7;',
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'delete-2',
      prompt: "Delete every student from 'Kannur'.",
      solutionQuery: "DELETE FROM students WHERE city = 'Kannur';",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'delete-3',
      prompt: "Delete every movie released before 2000.",
      solutionQuery: 'DELETE FROM movies WHERE year < 2000;',
      probeQuery: 'SELECT * FROM movies ORDER BY id;',
    },
    {
      id: 'delete-4',
      prompt: "Delete the course named 'Mobile Apps'.",
      solutionQuery: "DELETE FROM courses WHERE name = 'Mobile Apps';",
      probeQuery: 'SELECT * FROM courses ORDER BY id;',
    },
    {
      id: 'delete-5',
      prompt: "Delete every student who has no phone number (phone IS NULL).",
      hint: 'Use the NULL-safe comparison from Lesson 5.',
      solutionQuery: 'DELETE FROM students WHERE phone IS NULL;',
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
  ],
};

export default lesson;