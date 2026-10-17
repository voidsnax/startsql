import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'group-by',
  number: 9,
  title: 'GROUP BY',
  subtitle: 'Summarizing per category',
  defaultQuery: `SELECT genre, COUNT(*)
FROM movies
GROUP BY genre;`,
  didYouKnow: `Rule of thumb: every column in your \`SELECT\` must either be inside an aggregate function, or listed in \`GROUP BY\`. SQLite is forgiving about this, but most databases will throw an error if you break the rule.`,
  content: `Aggregates are powerful on their own, but the real magic happens when you group rows first.

**GROUP BY** splits the rows into buckets, then applies an aggregate to each bucket.

**Count students per city:**
\`\`\`sql
SELECT city, COUNT(*)
FROM students
GROUP BY city;
\`\`\`

**Visually**, the 8 students split into buckets by city, and COUNT runs on each bucket:

| city | COUNT(*) |
|---|---|
| Kochi | 3 |
| Kozhikode | 3 |
| Kannur | 1 |
| Thrissur | 1 |

**Average age per city:**
\`\`\`sql
SELECT city, AVG(age)
FROM students
GROUP BY city;
\`\`\`

**How many movies per language:**
\`\`\`sql
SELECT language, COUNT(*)
FROM movies
GROUP BY language;
\`\`\`

The column you group by must appear in \`SELECT\` — otherwise you can't tell which group each row belongs to. Everything else in \`SELECT\` must be inside an aggregate function.`,
  tasks: [
    {
      id: 'group-1',
      prompt: 'Count how many students live in each city.',
      solutionQuery: 'SELECT city, COUNT(*) FROM students GROUP BY city;',
    },
    {
      id: 'group-2',
      prompt: 'Show the average age per city.',
      solutionQuery: 'SELECT city, AVG(age) FROM students GROUP BY city;',
    },
    {
      id: 'group-3',
      prompt: 'How many movies are there per language?',
      solutionQuery: 'SELECT language, COUNT(*) FROM movies GROUP BY language;',
    },
    {
      id: 'group-4',
      prompt: 'How many movies are there per genre?',
      solutionQuery: 'SELECT genre, COUNT(*) FROM movies GROUP BY genre;',
    },
    {
      id: 'group-5',
      prompt: 'Show the highest rating per language.',
      hint: 'Group by language, then MAX(rating).',
      solutionQuery:
        'SELECT language, MAX(rating) FROM movies GROUP BY language;',
    },
  ],
};

export default lesson;