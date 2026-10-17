import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'aggregates',
  number: 8,
  title: 'Counting and Calculating',
  subtitle: 'COUNT, SUM, AVG, MIN, MAX',
  defaultQuery: `SELECT COUNT(*) AS total_students,
       AVG(age) AS average_age
FROM students;`,
  didYouKnow: `\`COUNT(*)\` counts every row. \`COUNT(column)\` counts only rows where that column is NOT NULL. Run \`SELECT COUNT(*), COUNT(phone) FROM students\` — the two numbers will differ, because some students have no phone.`,
  content: `So far we've been asking "show me rows". Now we ask **"tell me something about the data"**.

SQL gives us five **aggregate functions** — functions that turn many rows into one value:

| Function | What it does |
|---|---|
| \`COUNT()\` | how many rows |
| \`SUM()\` | add them up |
| \`AVG()\` | average |
| \`MIN()\` | smallest |
| \`MAX()\` | largest |

**Counting rows:**
\`\`\`sql
SELECT COUNT(*) FROM students;
\`\`\`

**Sum of ages:**
\`\`\`sql
SELECT SUM(age) FROM students;
\`\`\`

**Average age:**
\`\`\`sql
SELECT AVG(age) FROM students;
\`\`\`

**Highest and lowest:**
\`\`\`sql
SELECT MIN(age), MAX(age) FROM students;
\`\`\`

You can combine multiple aggregates in one query, and use \`AS\` to name the result:
\`\`\`sql
SELECT COUNT(*) AS total,
       AVG(age) AS avg_age
FROM students;
\`\`\`

**Important subtlety:** \`COUNT(*)\` counts every row, but \`COUNT(column)\` skips rows where that column is NULL.`,
  tasks: [
    {
      id: 'agg-1',
      prompt: 'How many students are there in total?',
      solutionQuery: 'SELECT COUNT(*) FROM students;',
    },
    {
      id: 'agg-2',
      prompt: 'What is the average age of all students?',
      solutionQuery: 'SELECT AVG(age) FROM students;',
    },
    {
      id: 'agg-3',
      prompt: 'What is the highest rating among all movies?',
      solutionQuery: 'SELECT MAX(rating) FROM movies;',
    },
    {
      id: 'agg-4',
      prompt: 'What is the total (sum) of all student ages?',
      solutionQuery: 'SELECT SUM(age) FROM students;',
    },
    {
      id: 'agg-5',
      prompt: 'Show the minimum and maximum age in the students table, aliased as min_age and max_age.',
      hint: 'Two aggregate functions in one SELECT.',
      solutionQuery: 'SELECT MIN(age) AS min_age, MAX(age) AS max_age FROM students;',
    },
  ],
};

export default lesson;