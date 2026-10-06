import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'having',
  number: 10,
  title: 'HAVING',
  subtitle: 'Filtering groups after grouping',
  defaultQuery:
    'SELECT city, COUNT(*) FROM students GROUP BY city HAVING COUNT(*) > 1;',
  didYouKnow: `The easiest way to remember: WHERE runs *before* grouping (it filters rows), HAVING runs *after* (it filters groups). If your condition uses an aggregate like COUNT or AVG, it must be in HAVING.`,
  content: `We've used \`WHERE\` to filter rows. But what if you want to filter **groups**?

For example: "show me only cities with more than one student."

You can't use \`WHERE\` for that — \`WHERE\` runs *before* grouping, when no count exists yet. You need **HAVING**.

**The distinction:**

| Clause | Filters | Runs |
|---|---|---|
| \`WHERE\` | rows | *before* grouping |
| \`HAVING\` | groups | *after* grouping |

**Cities with more than 1 student:**
\`\`\`sql
SELECT city, COUNT(*)
FROM students
GROUP BY city
HAVING COUNT(*) > 1;
\`\`\`

**Order matters in the query too:**

\`\`\`sql
SELECT   ...
FROM     ...
WHERE    ...          -- filters rows first
GROUP BY ...
HAVING   ...          -- then filters groups
ORDER BY ...
\`\`\`

**Combining WHERE and HAVING:** you can use both. \`WHERE\` narrows the rows before grouping; \`HAVING\` narrows the groups after.

\`\`\`sql
SELECT city, COUNT(*)
FROM students
WHERE age > 18
GROUP BY city
HAVING COUNT(*) > 1;
\`\`\`

That means: "among students over 18, which cities have more than one?"`,
  tasks: [
    {
      id: 'having-1',
      prompt: 'Show only cities that have more than 1 student. Display city and count.',
      solutionQuery:
        'SELECT city, COUNT(*) FROM students GROUP BY city HAVING COUNT(*) > 1;',
    },
    {
      id: 'having-2',
      prompt: 'Show only languages that have more than 1 movie. Display language and count.',
      solutionQuery:
        'SELECT language, COUNT(*) FROM movies GROUP BY language HAVING COUNT(*) > 1;',
    },
    {
      id: 'having-3',
      prompt: 'Show cities where the average age is above 20. Display city and average age.',
      solutionQuery:
        'SELECT city, AVG(age) FROM students GROUP BY city HAVING AVG(age) > 20;',
    },
    {
      id: 'having-4',
      prompt: 'Show genres where the highest rating is at least 8.5. Display genre and max rating.',
      solutionQuery:
        'SELECT genre, MAX(rating) FROM movies GROUP BY genre HAVING MAX(rating) >= 8.5;',
    },
    {
      id: 'having-5',
      prompt: 'Among movies released after 2000, show genres with more than 1 movie.',
      hint: 'WHERE filters rows (year > 2000), then GROUP BY genre, then HAVING COUNT(*) > 1.',
      solutionQuery:
        'SELECT genre, COUNT(*) FROM movies WHERE year > 2000 GROUP BY genre HAVING COUNT(*) > 1;',
    },
  ],
};

export default lesson;