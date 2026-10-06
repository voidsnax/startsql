import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'grant',
  number: 22,
  title: 'GRANT and REVOKE',
  subtitle: 'Permissions — a concept lesson',
  defaultQuery: "SELECT 'GRANT and REVOKE are not supported in SQLite.' AS note;",
  tasks: [],
  didYouKnow: `On a real PostgreSQL server, you'd typically have three roles: an admin who can do anything, an app user who can INSERT/UPDATE/SELECT, and a read-only analyst who can only SELECT. If an attacker compromises the app, they still can't DROP tables. This is called "principle of least privilege".`,
  content: `**Note: this is a concept lesson.** SQLite doesn't support \`GRANT\` or \`REVOKE\`. This lesson is here because **every other database in the world uses them**, and you'll encounter them the moment you work with PostgreSQL, MySQL, or SQL Server.

**The problem they solve:**

So far, we've been treating the database as a single user with unlimited power. But in real systems, **different people need different levels of access**:

- An **admin** can create and drop tables
- An **application** can read, insert, and update rows — but never drop tables
- An **analyst** can only read (SELECT)
- A **backup script** can read everything but write nothing

**GRANT** gives a user a permission:

\`\`\`sql
GRANT SELECT ON students TO analyst;
\`\`\`

This lets the user "analyst" run SELECT queries on the students table. Nothing else — no INSERT, no UPDATE, no DELETE.

**REVOKE** takes a permission away:

\`\`\`sql
REVOKE INSERT ON students FROM analyst;
\`\`\`

**Common privileges:**

| Privilege | Allows |
|---|---|
| \`SELECT\` | Read rows |
| \`INSERT\` | Add new rows |
| \`UPDATE\` | Change existing rows |
| \`DELETE\` | Remove rows |
| \`CREATE\` | Make new tables |
| \`DROP\` | Delete tables |
| \`ALL\` | Everything |

**You can grant multiple privileges at once:**

\`\`\`sql
GRANT SELECT, INSERT, UPDATE ON students TO app_user;
\`\`\`

**You can grant on every table with \`*\`:**

\`\`\`sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst;
\`\`\`

**Why SQLite doesn't have them:**

SQLite doesn't have users — it's a **file-based** database. Access control is handled by the operating system's file permissions. If a user can read \`mydb.sqlite\`, they can read the data. If they can't, they can't. This makes SQLite simple and perfect for embedded use (mobile apps, desktop apps, single-user tools), but unsuitable for multi-user servers where permissions matter.

**When you graduate to PostgreSQL or MySQL, this lesson will pay off.** The mental model — different roles with different capabilities — is the foundation of secure database design.

**There is no task for this lesson.** When you're ready, move on.`,
};

export default lesson;