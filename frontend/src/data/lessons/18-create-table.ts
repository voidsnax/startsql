import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'create-table',
  number: 18,
  title: 'CREATE TABLE',
  subtitle: 'Building a table from scratch',
  defaultQuery:
    'CREATE TABLE books (\n  id INTEGER PRIMARY KEY,\n  title TEXT,\n  author TEXT,\n  year INTEGER\n);',
  showSchema: true,
  didYouKnow: `SQLite has only 5 storage types: INTEGER, TEXT, REAL (floats), BLOB (binary), and NULL. Other databases have many more (VARCHAR, DATE, BOOLEAN, etc.), but SQLite keeps it minimal — a design choice that makes it famously small and fast.`,
  content: `So far we've been *reading* and *changing* data. Now we build the table itself.

**The syntax:**

\`\`\`sql
CREATE TABLE table_name (
  column1 TYPE constraint,
  column2 TYPE constraint,
  ...
);
\`\`\`

**Example — a books table:**

\`\`\`sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  year INTEGER
);
\`\`\`

**Column types in SQLite:**

| Type | Stores |
|---|---|
| \`INTEGER\` | Whole numbers |
| \`TEXT\` | Strings |
| \`REAL\` | Decimal numbers |
| \`BLOB\` | Binary data (files, images) |
| \`NULL\` | No value |

**Rules to know:**

- Every \`CREATE TABLE\` needs a **table name** and a **parenthesized list of columns**
- Each column has a **name** and a **type** (type is optional in SQLite, but always specify it)
- Columns are separated by **commas**
- The \`id INTEGER PRIMARY KEY\` column is special — it uniquely identifies each row and auto-assigns the next number if you omit it

**The table name must be new.** If you run \`CREATE TABLE books\` twice, the second one errors: "table books already exists". Use \`DROP TABLE IF EXISTS books;\` first, or just pick a different name.

**Pro tip:** SQLite's canonical types are exactly \`INTEGER\`, \`TEXT\`, and \`REAL\`. Other databases use \`VARCHAR\`, \`INT\`, \`STRING\` — but in SQLite, use the canonical names to keep the schema readable.`,
  tasks: [
    {
      id: 'create-1',
      prompt:
        'Create a table called books with columns: id (INTEGER PRIMARY KEY), title (TEXT), author (TEXT), year (INTEGER).',
      solutionQuery:
        'CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, year INTEGER);',
      probeQuery:
        "SELECT name, upper(type) AS col_type, pk FROM pragma_table_info('books') ORDER BY cid;",
    },
    {
      id: 'create-2',
      prompt:
        'Create a table called teachers with columns: id (INTEGER PRIMARY KEY), name (TEXT), subject (TEXT).',
      solutionQuery:
        'CREATE TABLE teachers (id INTEGER PRIMARY KEY, name TEXT, subject TEXT);',
      probeQuery:
        "SELECT name, upper(type) AS col_type, pk FROM pragma_table_info('teachers') ORDER BY cid;",
    },
    {
      id: 'create-3',
      prompt:
        'Create a table called reviews with columns: id (INTEGER PRIMARY KEY), movie_id (INTEGER), rating (REAL), comment (TEXT).',
      solutionQuery:
        'CREATE TABLE reviews (id INTEGER PRIMARY KEY, movie_id INTEGER, rating REAL, comment TEXT);',
      probeQuery:
        "SELECT name, upper(type) AS col_type, pk FROM pragma_table_info('reviews') ORDER BY cid;",
    },
    {
      id: 'create-4',
      prompt:
        'Create a table called cities where name is a TEXT PRIMARY KEY (not a separate id column) and population is INTEGER.',
      hint: 'The PRIMARY KEY goes right after the type: name TEXT PRIMARY KEY.',
      solutionQuery:
        'CREATE TABLE cities (name TEXT PRIMARY KEY, population INTEGER);',
      probeQuery:
        "SELECT name, upper(type) AS col_type, pk FROM pragma_table_info('cities') ORDER BY cid;",
    },
    {
      id: 'create-5',
      prompt:
        'Create a table called products with columns: id (INTEGER PRIMARY KEY), name (TEXT), price (REAL).',
      solutionQuery:
        'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);',
      probeQuery:
        "SELECT name, upper(type) AS col_type, pk FROM pragma_table_info('products') ORDER BY cid;",
    },
  ],
};

export default lesson;