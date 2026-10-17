import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'intro',
  number: 1,
  title: 'What Are Databases and SQL?',
  subtitle: 'Before we write any queries',
  defaultQuery: `SELECT *
FROM students;`,
  tasks: [],
  showSchema: true,
  didYouKnow: `SQL was invented at IBM in the 1970s. The name is pronounced either "sequel" or "S-Q-L" — both are considered correct. PostgreSQL, MySQL, and SQLite are different flavors of the same core language.`,
  content: `A **database** is an organized collection of data. Think of it as a very powerful, very structured spreadsheet.

A database is made up of **tables**. Each table has:

- **Columns** — the categories of information (e.g. \`name\`, \`age\`, \`city\`)
- **Rows** — the actual entries (e.g. one row per student)

A **schema** is the blueprint: what tables exist and what columns each table has.

**SQL** (Structured Query Language) is how we talk to a database. We write a *query*, the database executes it, and returns a result.

Try running the default query below. It fetches every row and every column from the \`students\` table.`,
};

export default lesson;