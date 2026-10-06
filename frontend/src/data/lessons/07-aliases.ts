import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'aliases',
  number: 7,
  title: 'Aliases and Expressions',
  subtitle: 'AS and simple math',
  defaultQuery: 'SELECT name, age, age + 5 AS age_in_5_years FROM students;',
  didYouKnow: `Aliases only rename the output column — the underlying table is untouched. You can even alias without the \`AS\` keyword (\`name student_name\`), but \`AS\` makes the intent obvious to anyone reading your query.`,
  content: `You can **rename** a column in the output, and **calculate** new values on the fly.

**Aliases with AS:**
\`\`\`sql
SELECT name AS student_name, age AS years_old
FROM students;
\`\`\`

The output columns are now \`student_name\` and \`years_old\`. The table is unchanged — this only affects the result.

**Expressions** — do math on columns:
\`\`\`sql
SELECT name, age, age + 5 AS age_in_5_years
FROM students;
\`\`\`

Supported operators: \`+\` \`-\` \`*\` \`/\`

You can mix columns and constants freely. The result column needs an alias, otherwise it looks ugly (e.g. \`age + 5\`).

**Text concatenation** (SQLite-specific):
\`\`\`sql
SELECT name || ' lives in ' || city AS info
FROM students;
\`\`\`

The \`||\` operator glues strings together.

Aliases are especially useful once you start calculating — a header like \`age_in_5_years\` reads much better than \`age + 5\`.`,
  tasks: [
    {
      id: 'alias-1',
      prompt: 'Select name and age, aliasing name as student_name and age as student_age.',
      solutionQuery: 'SELECT name AS student_name, age AS student_age FROM students;',
    },
    {
      id: 'alias-2',
      prompt: 'For each student, show their name and their age 5 years from now (as age_in_5_years).',
      solutionQuery:
        'SELECT name, age + 5 AS age_in_5_years FROM students;',
    },
    {
      id: 'alias-3',
      prompt: 'For each movie, show title, rating, and rating multiplied by 10 as rating_percent.',
      solutionQuery:
        'SELECT title, rating, rating * 10 AS rating_percent FROM movies;',
    },
    {
      id: 'alias-4',
      prompt: "Show each student's name and city combined into one column called student_location, in the format 'Anu from Kochi'.",
      hint: "Use || to concatenate. You'll need a literal ' from ' between the two columns.",
      solutionQuery:
        "SELECT name || ' from ' || city AS student_location FROM students;",
    },
    {
      id: 'alias-5',
      prompt: 'For each movie, show its title and how many years old it is (2024 minus year) as age_years.',
      solutionQuery:
        'SELECT title, 2024 - year AS age_years FROM movies;',
    },
  ],
};

export default lesson;