import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'drop',
  number: 21,
  title: 'DROP TABLE',
  subtitle: 'Deleting an entire table',
  defaultQuery: `DROP TABLE IF EXISTS scratch;`,
  didYouKnow: `DROP TABLE is not reversible on most databases — the data is gone instantly. Some systems keep a "recycle bin" for a short window (SQL Server, Oracle), but SQLite doesn't. In production, dropping a table without a backup is the stuff of horror stories. Always think twice.`,
  content: `\`DROP TABLE\` deletes the **table itself** — its structure, all its rows, and any indexes on it.

**The syntax:**

\`\`\`sql
DROP TABLE table_name;
\`\`\`

**The safe version:**

\`\`\`sql
DROP TABLE IF EXISTS table_name;
\`\`\`

The \`IF EXISTS\` variant doesn't error if the table is already gone. Useful for reset scripts and migrations that may run multiple times.

**DELETE vs DROP — critical distinction:**

| Command | What it removes | Table still exists? |
|---|---|---|
| \`DELETE FROM students;\` | All rows | ✅ Yes (empty) |
| \`DROP TABLE students;\` | The table itself | ❌ No |

After \`DELETE\`, you can still \`INSERT\` new rows. After \`DROP\`, the table is gone — you'd need to \`CREATE TABLE\` again.

**A note on foreign keys:**

If another table references the one you're dropping (via FOREIGN KEY), most databases either refuse the drop or cascade-delete the referencing rows. SQLite's behavior depends on settings — by default, it allows the drop and leaves dangling references. In real projects, this is why "drop a parent table" is a serious operation.

**When to use DROP TABLE:**

- Cleaning up during development
- Removing obsolete tables in migrations
- Resetting a test database between runs

**When NOT to use it:**

- In production, without a backup
- On a table you're not 100% sure is unused`,
  tasks: [
    {
      id: 'drop-1',
      prompt: 'Drop the movies table.',
      solutionQuery: 'DROP TABLE movies;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
    {
      id: 'drop-2',
      prompt: 'Drop the courses table.',
      solutionQuery: 'DROP TABLE courses;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
    {
      id: 'drop-3',
      prompt: 'Drop the students table.',
      solutionQuery: 'DROP TABLE students;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
    {
      id: 'drop-4',
      prompt:
        'In a single script, drop both the movies table and the courses table.',
      hint: 'Two statements separated by a semicolon.',
      solutionQuery: 'DROP TABLE movies; DROP TABLE courses;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
    {
      id: 'drop-5',
      prompt:
        "Create a table called scratch with a single column note (TEXT), then drop it — in one script.",
      hint: 'CREATE TABLE scratch (note TEXT); then DROP TABLE scratch;',
      solutionQuery:
        'CREATE TABLE scratch (note TEXT); DROP TABLE scratch;',
      probeQuery:
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    },
  ],
};

export default lesson;