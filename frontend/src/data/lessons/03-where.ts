import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'where',
  number: 3,
  title: 'Filtering with WHERE',
  subtitle: 'Pick only the rows you want',
  defaultQuery: 'SELECT * FROM students WHERE age > 18;',
  didYouKnow: `The order of rows you get back from a query isn't guaranteed. If you need a specific order, you must use \`ORDER BY\` — even if the results "happen" to look sorted today.`,
  content: `\`WHERE\` filters rows based on a condition. Only rows that satisfy the condition are returned.

**Comparison operators:**

| Operator | Meaning |
|---|---|
| \`=\` | equal to |
| \`!=\` | not equal to |
| \`<\` | less than |
| \`>\` | greater than |
| \`<=\` | less than or equal |
| \`>=\` | greater than or equal |

**Example:**
\`\`\`sql
SELECT * FROM students
WHERE age > 18;
\`\`\`

The database checks every row; only rows where \`age > 18\` is true come back.

**Careful:** text values need quotes. \`city = 'Kochi'\`, not \`city = Kochi\`.`,
  tasks: [
    {
      id: 'where-1',
      prompt: 'Get every student whose age is greater than 20.',
      solutionQuery: 'SELECT * FROM students WHERE age > 20;',
    },
    {
      id: 'where-2',
      prompt: "Get every student who lives in 'Kochi'.",
      hint: "Text values go inside single quotes: city = 'Kochi'.",
      solutionQuery: "SELECT * FROM students WHERE city = 'Kochi';",
    },
    {
      id: 'where-3',
      prompt: 'Get every student whose age is at most 21 (i.e. 21 or younger).',
      hint: 'That\'s "less than or equal to".',
      solutionQuery: 'SELECT * FROM students WHERE age <= 21;',
    },
    {
      id: 'where-4',
      prompt: 'Get every movie released after 2010.',
      solutionQuery: 'SELECT * FROM movies WHERE year > 2010;',
    },
    {
      id: 'where-5',
      prompt: "Get every student NOT from 'Kozhikode'.",
      hint: 'Use != for "not equal".',
      solutionQuery: "SELECT * FROM students WHERE city != 'Kozhikode';",
    },
  ],
};

export default lesson;