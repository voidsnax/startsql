import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'like-null',
  number: 5,
  title: 'Text Search and NULL',
  subtitle: 'LIKE, %, _, IS NULL',
  defaultQuery: `SELECT *
FROM students
WHERE name LIKE '%a';`,
  didYouKnow: `NULL isn't zero, and it isn't an empty string. It means "unknown". That's why \`NULL = NULL\` is not true in SQL — even NULL doesn't equal itself. Use \`IS NULL\` / \`IS NOT NULL\` instead.`,
  content: `Two real-world essentials: finding text patterns, and handling "no value".

**LIKE** — pattern matching with wildcards:

- \`%\` matches **any number of characters** (including zero)
- \`_\` matches **exactly one character**

Names starting with A:
\`\`\`sql
SELECT * FROM students WHERE name LIKE 'A%';
\`\`\`

Names ending with a:
\`\`\`sql
SELECT * FROM students WHERE name LIKE '%a';
\`\`\`

Names containing "ee" anywhere:
\`\`\`sql
SELECT * FROM students WHERE name LIKE '%ee%';
\`\`\`

**NULL** — a special value meaning "unknown" or "no value".

Some students don't have a phone number. Their \`phone\` column is **NULL** — not an empty string, not zero.

**The trap:** you cannot use \`=\` to compare with NULL.

\`\`\`sql
WHERE phone = NULL       -- ❌ never matches anything
\`\`\`

NULL isn't equal to anything — not even itself. Use \`IS NULL\`:

\`\`\`sql
WHERE phone IS NULL      -- ✅ rows with no phone
WHERE phone IS NOT NULL  -- ✅ rows that have a phone
\`\`\``,
  tasks: [
    {
      id: 'likenull-1',
      prompt: "Students whose name starts with 'A'.",
      solutionQuery: "SELECT * FROM students WHERE name LIKE 'A%';",
    },
    {
      id: 'likenull-2',
      prompt: "Students whose name ends with the letter 'a'.",
      hint: "Use '%a' — the % matches anything before the a.",
      solutionQuery: "SELECT * FROM students WHERE name LIKE '%a';",
    },
    {
      id: 'likenull-3',
      prompt: 'Students whose phone number is NULL.',
      hint: 'Use IS NULL, not = NULL.',
      solutionQuery: 'SELECT * FROM students WHERE phone IS NULL;',
    },
    {
      id: 'likenull-4',
      prompt: 'Students whose phone number is NOT NULL.',
      solutionQuery: 'SELECT * FROM students WHERE phone IS NOT NULL;',
    },
    {
      id: 'likenull-5',
      prompt: "Movies whose title starts with 'K'.",
      solutionQuery: "SELECT * FROM movies WHERE title LIKE 'K%';",
    },
  ],
};

export default lesson;