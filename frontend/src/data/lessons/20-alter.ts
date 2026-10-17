import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'alter',
  number: 20,
  title: 'ALTER TABLE',
  subtitle: "Changing a table's structure",
  defaultQuery: `ALTER TABLE courses
ADD COLUMN duration_weeks INTEGER;`,
  didYouKnow: `SQLite's ALTER TABLE is deliberately limited — no "change the type of a column", no "reorder columns", no "add NOT NULL without a default". PostgreSQL and MySQL support much more. The reason: SQLite prioritizes never corrupting your data, so anything that would require rewriting every row is left to a manual copy-and-swap.`,
  content: `\`ALTER TABLE\` changes an existing table's structure — without losing the data inside.

**SQLite supports four ALTER operations:**

| Operation | Syntax |
|---|---|
| Add a column | \`ALTER TABLE t ADD COLUMN name TYPE;\` |
| Rename a column | \`ALTER TABLE t RENAME COLUMN old TO new;\` |
| Rename the table | \`ALTER TABLE t RENAME TO new_name;\` |
| Drop a column | \`ALTER TABLE t DROP COLUMN name;\` |

**Adding a column:**

\`\`\`sql
ALTER TABLE courses ADD COLUMN duration_weeks INTEGER;
\`\`\`

Every existing row gets NULL for the new column. If you want a default for existing rows, provide one:

\`\`\`sql
ALTER TABLE courses ADD COLUMN duration_weeks INTEGER DEFAULT 12;
\`\`\`

**Renaming a column:**

\`\`\`sql
ALTER TABLE students RENAME COLUMN phone TO phone_number;
\`\`\`

This preserves all the data — the column just has a new name.

**Renaming the table:**

\`\`\`sql
ALTER TABLE movies RENAME TO films;
\`\`\`

All queries that reference \`movies\` will need updating.

**Renaming a column requires SQLite 3.25+**, released in 2018. Any modern environment has it.

**What SQLite doesn't support:**

- Changing a column's type
- Adding a NOT NULL column to a table with existing rows (unless you provide a default)
- Reordering columns

For those, the standard workaround is: create a new table with the desired schema, copy the data over, drop the old table, rename the new one. This is sometimes called the "12-step ALTER" — you can find it in SQLite's official documentation.`,
  tasks: [
    {
      id: 'alter-1',
      prompt: 'Add a column phone (TEXT) to the courses table.',
      solutionQuery: 'ALTER TABLE courses ADD COLUMN phone TEXT;',
      probeQuery:
        "SELECT name FROM pragma_table_info('courses') ORDER BY cid;",
    },
    {
      id: 'alter-2',
      prompt: 'Add a column email (TEXT) to the students table.',
      solutionQuery: 'ALTER TABLE students ADD COLUMN email TEXT;',
      probeQuery:
        "SELECT name FROM pragma_table_info('students') ORDER BY cid;",
    },
    {
      id: 'alter-3',
      prompt: 'Rename the phone column in the students table to phone_number.',
      solutionQuery: 'ALTER TABLE students RENAME COLUMN phone TO phone_number;',
      probeQuery:
        "SELECT name FROM pragma_table_info('students') ORDER BY cid;",
    },
    {
      id: 'alter-4',
      prompt: 'Rename the teacher column in the courses table to instructor.',
      solutionQuery: 'ALTER TABLE courses RENAME COLUMN teacher TO instructor;',
      probeQuery:
        "SELECT name FROM pragma_table_info('courses') ORDER BY cid;",
    },
    {
      id: 'alter-5',
      prompt: 'Rename the movies table to films.',
      solutionQuery: 'ALTER TABLE movies RENAME TO films;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
  ],
};

export default lesson;