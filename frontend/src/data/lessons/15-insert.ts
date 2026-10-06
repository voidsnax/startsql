import type { Lesson } from './types';

const lesson: Lesson = {
  id: 'insert',
  number: 15,
  title: 'INSERT',
  subtitle: 'Adding new rows',
  defaultQuery:
    "INSERT INTO students (id, name, age, city, phone, course_id) VALUES (9, 'Priya', 21, 'Kollam', '9876543216', 1);",
  didYouKnow: `You can insert many rows at once: \`INSERT INTO students (...) VALUES (...), (...), (...);\`. It's much faster than separate statements — often 10–100× — because the database only has to open and commit once.`,
  content: `\`INSERT\` adds a new row to a table.

**The recommended form** — name every column:

\`\`\`sql
INSERT INTO students (id, name, age, city, phone, course_id)
VALUES (9, 'Priya', 21, 'Kollam', '9876543216', 1);
\`\`\`

**The shorthand form** — rely on column order:

\`\`\`sql
INSERT INTO students
VALUES (9, 'Priya', 21, 'Kollam', '9876543216', 1);
\`\`\`

**Why name the columns anyway?**

- **Readability.** Anyone reading the query knows what each value means.
- **Safety.** If someone later adds a column, the shorthand form breaks; the named form keeps working.
- **Flexibility.** You can omit columns with a default value or NULL, and skip them entirely.

**Nullable columns:** if a column allows NULL, you can just leave it out:

\`\`\`sql
INSERT INTO students (id, name, age, city)
VALUES (9, 'Priya', 21, 'Kollam');
\`\`\`

The missing \`phone\` and \`course_id\` become NULL.

**Verify your insert** by running a \`SELECT\` afterwards:

\`\`\`sql
SELECT * FROM students WHERE id = 9;
\`\`\`

**Careful:** the \`id\` column is the PRIMARY KEY — inserting a row with an \`id\` that already exists will fail.`,
  tasks: [
    {
      id: 'insert-1',
      prompt:
        "Add a new student: id 9, name 'Priya', age 21, city 'Kollam', phone '9876543216', course_id 1.",
      solutionQuery:
        "INSERT INTO students (id, name, age, city, phone, course_id) VALUES (9, 'Priya', 21, 'Kollam', '9876543216', 1);",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'insert-2',
      prompt:
        "Add a new student: id 10, name 'Rohan', age 20, city 'Thrissur'. Leave phone and course_id as NULL.",
      hint: 'Only name the columns you provide values for.',
      solutionQuery:
        "INSERT INTO students (id, name, age, city) VALUES (10, 'Rohan', 20, 'Thrissur');",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
    {
      id: 'insert-3',
      prompt:
        "Add a new course: id 5, name 'Cloud Computing', teacher 'Ms. Pillai', active 1.",
      solutionQuery:
        "INSERT INTO courses (id, name, teacher, active) VALUES (5, 'Cloud Computing', 'Ms. Pillai', 1);",
      probeQuery: 'SELECT * FROM courses ORDER BY id;',
    },
    {
      id: 'insert-4',
      prompt:
        "Add a new movie: id 9, title 'Jawan', director 'Atlee', year 2023, rating 7.5, genre 'Action', language 'Hindi'.",
      solutionQuery:
        "INSERT INTO movies (id, title, director, year, rating, genre, language) VALUES (9, 'Jawan', 'Atlee', 2023, 7.5, 'Action', 'Hindi');",
      probeQuery: 'SELECT * FROM movies ORDER BY id;',
    },
    {
      id: 'insert-5',
      prompt:
        "Add TWO students in a single INSERT statement: (id 11, 'Anjali', 22, 'Kochi', '9876543217', 2) and (id 12, 'Suresh', 23, 'Kozhikode', '9876543218', 3).",
      hint: 'Use VALUES (...), (...) to insert multiple rows in one statement.',
      solutionQuery:
        "INSERT INTO students (id, name, age, city, phone, course_id) VALUES (11, 'Anjali', 22, 'Kochi', '9876543217', 2), (12, 'Suresh', 23, 'Kozhikode', '9876543218', 3);",
      probeQuery: 'SELECT * FROM students ORDER BY id;',
    },
  ],
};

export default lesson;