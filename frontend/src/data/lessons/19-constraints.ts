import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'constraints',
  number: 19,
  title: 'Constraints',
  subtitle: 'Rules that protect your data',
  defaultQuery:
    "CREATE TABLE employees (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  department TEXT DEFAULT 'General',\n  salary INTEGER CHECK(salary >= 0)\n);",
  showSchema: true,
  didYouKnow: `Constraints run *inside* the database engine, so they can't be bypassed by a buggy app. Even if your code forgets to validate, the database rejects bad data. This is called "defense in depth" — the app validates, and the database validates again.`,
  content: `Constraints are rules attached to columns. They prevent bad data from ever entering the table.

**The five you'll use most:**

| Constraint | Meaning |
|---|---|
| \`PRIMARY KEY\` | Uniquely identifies each row |
| \`NOT NULL\` | Value must be provided (no NULLs allowed) |
| \`UNIQUE\` | No two rows can have the same value |
| \`DEFAULT\` | Value used when none is provided |
| \`CHECK\` | Value must satisfy a condition |

**Putting them all together:**

\`\`\`sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT DEFAULT 'General',
  salary INTEGER CHECK(salary >= 0)
);
\`\`\`

**What each one does — in plain English:**

- **PRIMARY KEY** — every row has a unique \`id\`. You can't insert two rows with the same id.
- **NOT NULL** — every employee must have a name. Inserting a NULL name fails.
- **UNIQUE** — no two employees can share an email. A duplicate insert fails.
- **DEFAULT 'General'** — if you don't specify a department, it becomes "General".
- **CHECK(salary >= 0)** — the database refuses to store a negative salary.

**Why this matters:**

Without constraints, nothing stops a student from having age = -5, or two users sharing the same email, or an order with no customer. Constraints are how you guarantee the data makes sense, no matter how buggy the application is.

**A new column type — FOREIGN KEY** — references another table's PRIMARY KEY:

\`\`\`sql
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  course_id INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
\`\`\`

This says "student_id must point to a real student". SQLite doesn't enforce it by default, but the *concept* matters — it's how relational databases link tables together.

**Note:** you can combine constraints on one column: \`name TEXT NOT NULL UNIQUE\`.`,
  tasks: [
    {
      id: 'constraint-1',
      prompt:
        'Create a table products with columns: id (INTEGER PRIMARY KEY), name (TEXT NOT NULL), price (REAL).',
      solutionQuery:
        'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL);',
      probeQuery:
        "SELECT name, notnull, pk FROM pragma_table_info('products') ORDER BY cid;",
    },
    {
      id: 'constraint-2',
      prompt:
        "Create a table accounts with columns: id (INTEGER PRIMARY KEY), email (TEXT UNIQUE), username (TEXT NOT NULL).",
      hint: 'UNIQUE prevents duplicate emails.',
      solutionQuery:
        'CREATE TABLE accounts (id INTEGER PRIMARY KEY, email TEXT UNIQUE, username TEXT NOT NULL);',
      probeQuery:
        "SELECT name FROM pragma_index_list('accounts') ORDER BY name;",
    },
    {
      id: 'constraint-3',
      prompt:
        "Create a table tasks with columns: id (INTEGER PRIMARY KEY), title (TEXT NOT NULL), status (TEXT DEFAULT 'todo'), priority (INTEGER DEFAULT 3).",
      solutionQuery:
        "CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'todo', priority INTEGER DEFAULT 3);",
      probeQuery:
        "SELECT name, notnull, dflt_value FROM pragma_table_info('tasks') ORDER BY cid;",
    },
    {
      id: 'constraint-4',
      prompt:
        'Create a table films where title is a TEXT PRIMARY KEY (not a separate id) and year is INTEGER NOT NULL.',
      hint: 'Combine NOT NULL with the primary key column.',
      solutionQuery:
        'CREATE TABLE films (title TEXT PRIMARY KEY, year INTEGER NOT NULL);',
      probeQuery:
        "SELECT name, pk, notnull FROM pragma_table_info('films') ORDER BY cid;",
    },
    {
      id: 'constraint-5',
      prompt:
        'Create a table enrollments with columns: id (INTEGER PRIMARY KEY), student_id (INTEGER NOT NULL), course_id (INTEGER NOT NULL).',
      solutionQuery:
        'CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, course_id INTEGER NOT NULL);',
      probeQuery:
        "SELECT name, notnull, pk FROM pragma_table_info('enrollments') ORDER BY cid;",
    },
  ],
};

export default lesson;