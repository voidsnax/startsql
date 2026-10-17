import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'order-limit',
  number: 6,
  title: 'Sorting, Limiting, and DISTINCT',
  subtitle: 'ORDER BY, LIMIT, DISTINCT',
  defaultQuery: `SELECT *
FROM students
ORDER BY city, age;`,
  didYouKnow: `\`LIMIT\` without \`ORDER BY\` gives you "some N rows" — but which N? The database decides. If you want "the top N", always pair them: \`ORDER BY ... LIMIT N\`.`,
  content: `Sometimes you want the data in a specific order, or just a few rows.

**ORDER BY** — sort the rows:
\`\`\`sql
SELECT * FROM students ORDER BY age;         -- youngest to oldest (ASC is default)
SELECT * FROM students ORDER BY age DESC;    -- oldest to youngest
\`\`\`

You can sort by multiple columns:
\`\`\`sql
SELECT * FROM students ORDER BY city, age;
\`\`\`

This sorts by **city first**, then by **age** within each city.

**LIMIT** — take only the first N rows:
\`\`\`sql
SELECT * FROM students ORDER BY age DESC LIMIT 3;
\`\`\`

That's the three oldest students. LIMIT is almost always paired with ORDER BY — without it, "first" is meaningless (the database can return rows in any order).

**DISTINCT** — remove duplicate rows:
\`\`\`sql
SELECT DISTINCT city FROM students;
\`\`\`

Each unique city appears once. Without DISTINCT, you'd get one row per student.`,
  tasks: [
    {
      id: 'order-1',
      prompt: 'All students sorted by age, youngest first (ascending).',
      solutionQuery: 'SELECT * FROM students ORDER BY age;',
      orderMatters: true,
    },
    {
      id: 'order-2',
      prompt: 'All students sorted by age, oldest first.',
      solutionQuery: 'SELECT * FROM students ORDER BY age DESC;',
      orderMatters: true,
    },
    {
      id: 'order-3',
      prompt: 'The three oldest students.',
      hint: 'Sort descending, then LIMIT 3.',
      solutionQuery: 'SELECT * FROM students ORDER BY age DESC LIMIT 3;',
      orderMatters: true,
    },
    {
      id: 'order-4',
      prompt: 'A list of every unique city students live in.',
      hint: 'Use DISTINCT so each city appears once.',
      solutionQuery: 'SELECT DISTINCT city FROM students;',
    },
    {
      id: 'order-5',
      prompt: 'The top 4 movies by rating (highest first). Show title and rating.',
      solutionQuery:
        'SELECT title, rating FROM movies ORDER BY rating DESC LIMIT 4;',
      orderMatters: true,
    },
  ],
};

export default lesson;