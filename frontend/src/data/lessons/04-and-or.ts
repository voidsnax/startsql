import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'and-or',
  number: 4,
  title: 'Combining Conditions',
  subtitle: 'AND, OR, NOT, IN, BETWEEN',
  defaultQuery: "SELECT * FROM students WHERE age > 18 AND city = 'Kochi';",
  didYouKnow: `Parentheses aren't just for looks — they change meaning. \`a OR b AND c\` evaluates as \`a OR (b AND c)\` because AND binds tighter than OR. When in doubt, always use parentheses.`,
  content: `One condition isn't always enough. SQL lets you combine conditions with **logical operators**.

**AND** — both conditions must be true:
\`\`\`sql
SELECT * FROM students
WHERE age > 18 AND city = 'Kochi';
\`\`\`

**OR** — at least one condition must be true:
\`\`\`sql
SELECT * FROM students
WHERE city = 'Kochi' OR city = 'Kozhikode';
\`\`\`

**NOT** — reverses a condition:
\`\`\`sql
SELECT * FROM students
WHERE NOT city = 'Kochi';
\`\`\`

**Precedence warning:** SQL evaluates \`AND\` before \`OR\`. So this:

\`\`\`sql
WHERE city = 'Kochi' OR city = 'Kozhikode' AND age > 20
\`\`\`

means "Kochi (any age), OR (Kozhikode and over 20)". To get "either city, and over 20", use parentheses:

\`\`\`sql
WHERE (city = 'Kochi' OR city = 'Kozhikode') AND age > 20
\`\`\`

**IN** — shorthand for multiple ORs:
\`\`\`sql
WHERE city IN ('Kochi', 'Kozhikode', 'Kannur')
\`\`\`

**BETWEEN** — inclusive range:
\`\`\`sql
WHERE age BETWEEN 20 AND 22
\`\`\`

\`BETWEEN 20 AND 22\` includes both 20 and 22.`,
  tasks: [
    {
      id: 'andor-1',
      prompt: 'Students older than 18 who live in Kochi.',
      solutionQuery: "SELECT * FROM students WHERE age > 18 AND city = 'Kochi';",
    },
    {
      id: 'andor-2',
      prompt: 'Students from Kochi or Kozhikode.',
      solutionQuery:
        "SELECT * FROM students WHERE city = 'Kochi' OR city = 'Kozhikode';",
    },
    {
      id: 'andor-3',
      prompt: 'Students NOT from Kochi.',
      solutionQuery: "SELECT * FROM students WHERE NOT city = 'Kochi';",
    },
    {
      id: 'andor-4',
      prompt: 'Students whose age is between 20 and 22 (inclusive).',
      hint: 'BETWEEN is inclusive on both ends.',
      solutionQuery: 'SELECT * FROM students WHERE age BETWEEN 20 AND 22;',
    },
    {
      id: 'andor-5',
      prompt: "Movies in Hindi or Tamil. Use IN.",
      solutionQuery:
        "SELECT * FROM movies WHERE language IN ('Hindi', 'Tamil');",
    },
  ],
};

export default lesson;