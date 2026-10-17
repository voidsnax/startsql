import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'select',
  number: 2,
  title: 'SELECT — Reading Data',
  subtitle: 'Your first real query',
  defaultQuery: `SELECT id, name, age
FROM students;`,
  didYouKnow: `\`SELECT *\` is convenient, but it's slow on huge tables — the database has to fetch every column. Once you're comfortable, prefer naming the columns you actually need. It also documents what your query depends on.`,
  content: `The \`SELECT\` statement reads data from a table.

**Basic structure:**

\`\`\`sql
SELECT column1, column2
FROM table_name;
\`\`\`

- \`SELECT\` — which columns you want
- \`FROM\` — which table to read from
- \`*\` — shorthand for "all columns"
- \`;\` — ends the statement (optional in SQLite, but a good habit)

**Examples:**

Fetch everything:
\`\`\`sql
SELECT * FROM students;
\`\`\`

Fetch only name and age:
\`\`\`sql
SELECT name, age FROM students;
\`\`\``,
  tasks: [
    {
      id: 'select-1',
      prompt: 'Select every column from the students table.',
      solutionQuery: 'SELECT * FROM students;',
    },
    {
      id: 'select-2',
      prompt: 'Select only the name and city columns from students.',
      solutionQuery: 'SELECT name, city FROM students;',
    },
    {
      id: 'select-3',
      prompt: 'Select the title and year columns from movies.',
      hint: 'Switch the table name to movies.',
      solutionQuery: 'SELECT title, year FROM movies;',
    },
    {
      id: 'select-4',
      prompt: 'Select the name, age, and city of every student.',
      solutionQuery: 'SELECT name, age, city FROM students;',
    },
    {
      id: 'select-5',
      prompt: 'Select every column from the courses table.',
      solutionQuery: 'SELECT * FROM courses;',
    },
  ],
};

export default lesson;