export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export const LESSON_QUIZZES: Record<string, QuizQuestion[]> = {
  intro: [
    { q: "What is one row in a table?", options: ["One record", "One column", "A whole table", "A saved query"], answer: 0, why: "A row holds a single record; columns describe its fields." },
    { q: "Where does your SQL actually run in StartSQL?", options: ["In your browser, via SQLite", "On a remote MySQL server", "Inside the assistant", "In a spreadsheet"], answer: 0, why: "sql.js runs SQLite locally, so your data never leaves the page." },
    { q: "What does a table's schema describe?", options: ["Its columns and their types", "How many rows it has", "Only its indexes", "The last query run"], answer: 0, why: "Schema is structure — names and types — not the data itself." },
  ],
  select: [
    { q: "Which query returns every column?", options: ["`SELECT * FROM students;`", "`SELECT all FROM students;`", "`GET * FROM students;`", "`SELECT columns FROM students;`"], answer: 0, why: "`*` is the shorthand for all columns." },
    { q: "What does `SELECT name, age` return?", options: ["Only those two columns", "All columns", "Only two rows", "An error"], answer: 0, why: "Listing columns narrows the output to exactly those." },
    { q: "Is the trailing semicolon required in SQLite?", options: ["No, but it's a good habit", "Yes, always", "Only for SELECT", "Only for INSERT"], answer: 0, why: "SQLite accepts a single statement without it, but `;` separates statements." },
  ],
  where: [
    { q: "Which keeps students older than 21?", options: ["`WHERE age > 21`", "`WHERE age => 21`", "`HAVING age > 21`", "`FILTER age > 21`"], answer: 0, why: "`WHERE` filters rows before they are returned." },
    { q: "`WHERE city = 'Delhi'` matches…", options: ["Exactly 'Delhi', case-sensitive", "Any city containing Delhi", "Any casing of Delhi", "Cities starting with D"], answer: 0, why: "SQLite's default TEXT comparison is binary, so casing matters." },
    { q: "Which operator means 'not equal'?", options: ["`<>`", "`=/=`", "`NOT =`", "`><`"], answer: 0, why: "`<>` is standard SQL; SQLite also accepts `!=`." },
  ],
  "and-or": [
    { q: "Which requires both conditions to be true?", options: ["`AND`", "`OR`", "`NOT`", "`IN`"], answer: 0, why: "`AND` narrows; `OR` widens." },
    { q: "`a OR b AND c` is evaluated as…", options: ["`a OR (b AND c)`", "`(a OR b) AND c`", "Strictly left to right", "A syntax error"], answer: 0, why: "`AND` binds tighter than `OR`, so parentheses make intent explicit." },
    { q: "Why wrap mixed conditions in parentheses?", options: ["To make the grouping unambiguous", "To speed up the query", "SQLite requires them", "To sort the results"], answer: 0, why: "They remove any doubt about which conditions travel together." },
  ],
  null: [
    { q: "What does NULL represent?", options: ["An unknown or missing value", "Zero", "An empty string", "False"], answer: 0, why: "NULL is absence of value, which is different from 0 or ''." },
    { q: "Which correctly tests for a missing phone?", options: ["`WHERE phone IS NULL`", "`WHERE phone = NULL`", "`WHERE phone == NULL`", "`WHERE phone IS 'NULL'`"], answer: 0, why: "Comparing to NULL with `=` never matches; use `IS NULL`." },
    { q: "`NULL = NULL` evaluates to…", options: ["NULL, not true", "true", "false", "An error"], answer: 0, why: "Any arithmetic comparison with NULL yields NULL." },
  ],
  "order-limit": [
    { q: "What is the default `ORDER BY` direction?", options: ["Ascending", "Descending", "Insertion order", "Random"], answer: 0, why: "`ASC` is the default; write `DESC` to reverse it." },
    { q: "Which returns the three oldest students?", options: ["`ORDER BY age DESC LIMIT 3`", "`ORDER BY age ASC LIMIT 3`", "`LIMIT 3 ORDER BY age DESC`", "`TOP 3 ORDER BY age`"], answer: 0, why: "Sort oldest first, then cap the row count." },
    { q: "Where does `LIMIT` belong?", options: ["At the end of the statement", "Before `WHERE`", "Before `FROM`", "Anywhere"], answer: 0, why: "Clause order is SELECT … FROM … WHERE … ORDER BY … LIMIT." },
  ],
  aliases: [
    { q: "What does `AS` do?", options: ["Renames a column in the output", "Renames the table permanently", "Sorts the rows", "Filters the rows"], answer: 0, why: "An alias is a display label for that result set only." },
    { q: "`SELECT name student_name FROM students` is…", options: ["Valid — `AS` is optional", "A syntax error", "A table rename", "A column delete"], answer: 0, why: "A space alone creates the alias; `AS` just makes it explicit." },
    { q: "Do aliases change the stored schema?", options: ["No, output only", "Yes, permanently", "Only when using `AS`", "Only inside views"], answer: 0, why: "The table keeps its original column names." },
  ],
  aggregates: [
    { q: "What does `COUNT(*)` count?", options: ["All rows, including NULLs", "Only non-NULL phones", "Columns", "Tables"], answer: 0, why: "`COUNT(*)` counts rows regardless of content." },
    { q: "`COUNT(phone)` skips…", options: ["Rows where phone is NULL", "Rows where phone is 0", "Duplicate numbers", "Nothing"], answer: 0, why: "Counting a specific column ignores NULLs in that column." },
    { q: "Which returns the average age?", options: ["`AVG(age)`", "`MEAN(age)`", "`AVERAGE(age)`", "`TOTAL(age)`"], answer: 0, why: "SQLite's aggregate for the mean is `AVG`." },
  ],
  "group-by": [
    { q: "`GROUP BY city` produces…", options: ["One row per city", "One row per student", "Exactly one row", "Sorted cities only"], answer: 0, why: "Grouping collapses each distinct city into a single output row." },
    { q: "In `SELECT city, COUNT(*) … GROUP BY city`, `COUNT(*)` counts…", options: ["Students in that city", "All students", "All cities", "Columns"], answer: 0, why: "Aggregates are evaluated per group, not over the whole table." },
    { q: "Can you group by a column you don't select?", options: ["Yes", "No", "Only with `HAVING`", "Only numeric columns"], answer: 0, why: "Grouping and projection are independent choices." },
  ],
  having: [
    { q: "`HAVING` filters…", options: ["Groups after aggregation", "Rows before grouping", "Columns", "Tables"], answer: 0, why: "`WHERE` filters rows; `HAVING` filters the grouped results." },
    { q: "Which keeps cities with two or more students?", options: ["`HAVING COUNT(*) >= 2`", "`WHERE COUNT(*) >= 2`", "`LIMIT 2`", "`ORDER BY COUNT(*)`"], answer: 0, why: "Aggregates aren't available to `WHERE`, so the test lives in `HAVING`." },
    { q: "What is the written clause order?", options: ["WHERE → GROUP BY → HAVING", "HAVING → WHERE → GROUP BY", "GROUP BY → WHERE → HAVING", "Any order"], answer: 0, why: "Rows are filtered, then grouped, then groups are filtered." },
  ],
  "multi-table": [
    { q: "Why split data into two tables?", options: ["To avoid repeating the same facts", "To type less", "SQLite requires it", "To make files smaller"], answer: 0, why: "Storing each course once removes duplication and update anomalies." },
    { q: "`students.course_id` acts as a…", options: ["Reference to another table's key", "Primary key", "Index name", "Check constraint"], answer: 0, why: "It points at `courses.id`, linking a student to a course." },
    { q: "A student with `course_id` NULL means…", options: ["No course assigned", "The course was deleted", "A data error", "Course number 0"], answer: 0, why: "NULL models 'not yet enrolled' without inventing a fake course." },
  ],
  "inner-join": [
    { q: "`INNER JOIN` returns…", options: ["Only rows that match on both sides", "Every left row", "Every row from both tables", "Always a cartesian product"], answer: 0, why: "Unmatched rows on either side are dropped." },
    { q: "What does `ON` specify?", options: ["The match condition", "The sort order", "The row limit", "The column aliases"], answer: 0, why: "`ON` states which columns must be equal for a pair to join." },
    { q: "Omitting `ON` from a JOIN produces…", options: ["A cross join", "An error", "Zero rows", "A left join"], answer: 0, why: "Without a condition every left row pairs with every right row." },
  ],
  "left-join": [
    { q: "`LEFT JOIN` keeps…", options: ["Every row from the left table", "Only matches", "Every right row", "No NULLs"], answer: 0, why: "The left side is preserved even when nothing matches." },
    { q: "Unmatched right-hand columns come back as…", options: ["NULL", "Zero", "Empty strings", "Omitted rows"], answer: 0, why: "There is no right row to read, so those fields are NULL." },
    { q: "Which lists students even without a course?", options: ["`LEFT JOIN courses`", "`INNER JOIN courses`", "`CROSS JOIN courses`", "`UNION courses`"], answer: 0, why: "Only an outer join preserves the unmatched students." },
  ],
  "execution-order": [
    { q: "Which clause is evaluated first?", options: ["`FROM`", "`SELECT`", "`ORDER BY`", "`LIMIT`"], answer: 0, why: "The engine must know the source rows before anything else." },
    { q: "Why can't `WHERE` use a `SELECT` alias?", options: ["WHERE runs before SELECT", "Aliases are illegal", "It's a SQLite bug", "It needs HAVING"], answer: 0, why: "The alias doesn't exist yet when rows are being filtered." },
    { q: "Which of these runs last?", options: ["`LIMIT`", "`GROUP BY`", "`WHERE`", "`JOIN`"], answer: 0, why: "Rows are joined, filtered, grouped, sorted, then capped." },
  ],
  insert: [
    { q: "`INSERT` adds…", options: ["New rows", "New columns", "New tables", "Indexes"], answer: 0, why: "Insertion appends records to an existing table." },
    { q: "A column omitted from `INSERT` receives…", options: ["Its default, or NULL", "Zero", "An error", "The previous row's value"], answer: 0, why: "SQLite fills gaps from the column default, else NULL." },
    { q: "Can one `INSERT` add several rows?", options: ["Yes, comma-separated VALUES lists", "No", "Only inside a loop", "Only via UPDATE"], answer: 0, why: "`VALUES (…), (…), (…)` inserts them all in one statement." },
  ],
  update: [
    { q: "`UPDATE` without `WHERE` changes…", options: ["Every row", "Nothing", "One row", "The schema"], answer: 0, why: "With no filter the assignment applies table-wide." },
    { q: "What should you run first before an UPDATE?", options: ["A SELECT with the same WHERE", "A DELETE", "A DROP", "A LIMIT"], answer: 0, why: "Previewing the affected rows is the cheapest safety net." },
    { q: "`SET` is used to…", options: ["Assign new column values", "Filter rows", "Sort output", "Join tables"], answer: 0, why: "`SET column = value` is the assignment half of UPDATE." },
  ],
  delete: [
    { q: "`DELETE FROM students;` removes…", options: ["All rows, keeping the table", "The table too", "One row", "The columns"], answer: 0, why: "DELETE clears data; the structure survives." },
    { q: "Which removes only unenrolled students?", options: ["`DELETE FROM students WHERE course_id IS NULL`", "`DELETE FROM students LIMIT 1`", "`DROP TABLE students`", "`TRUNCATE students`"], answer: 0, why: "The WHERE clause scopes the deletion to the intended rows." },
    { q: "`ROLLBACK` after a DELETE inside a transaction…", options: ["Restores the rows", "Does nothing", "Drops the table", "Commits the change"], answer: 0, why: "Rollback discards everything since BEGIN." },
  ],
  "create-table": [
    { q: "`CREATE TABLE` defines…", options: ["Columns and their types", "Rows", "Only indexes", "A view"], answer: 0, why: "It creates structure; data comes later with INSERT." },
    { q: "Which is the canonical SQLite text type?", options: ["`TEXT`", "`STRING`", "`VARCHAR2`", "`CHARARRAY`"], answer: 0, why: "SQLite's storage classes are INTEGER, TEXT, REAL, BLOB and NULL." },
    { q: "`IF NOT EXISTS` prevents…", options: ["An error when the table already exists", "Duplicate rows", "NULL values", "Slow inserts"], answer: 0, why: "It makes the statement a no-op instead of a failure." },
  ],
  constraints: [
    { q: "`PRIMARY KEY` guarantees…", options: ["A unique, non-NULL identity", "Sorted storage", "Faster joins", "A default value"], answer: 0, why: "It identifies each row uniquely and rejects duplicates." },
    { q: "`NOT NULL` rejects…", options: ["Missing values", "Duplicate values", "Negative numbers", "Long text"], answer: 0, why: "It requires every row to supply that column." },
    { q: "`CHECK (age >= 0)` blocks…", options: ["Negative ages", "NULL ages", "Duplicate ages", "Text ages"], answer: 0, why: "A CHECK passes when its expression is true or NULL." },
  ],
  alter: [
    { q: "Which ALTER action does SQLite support?", options: ["`ADD COLUMN`", "Changing a column's type in place", "`ALTER COLUMN SET NOT NULL`", "`DROP CONSTRAINT`"], answer: 0, why: "SQLite's ALTER is deliberately limited to add, rename and drop column." },
    { q: "Renaming a table uses…", options: ["`ALTER TABLE x RENAME TO y`", "`RENAME x TO y`", "`UPDATE TABLE x`", "`MOVE x TO y`"], answer: 0, why: "Renames go through ALTER TABLE." },
    { q: "Adding a column sets existing rows to…", options: ["The default, or NULL", "Zero", "An error", "An empty string"], answer: 0, why: "Existing rows are backfilled from the column's default." },
  ],
  "drop-truncate": [
    { q: "`DROP TABLE` removes…", options: ["Structure and data", "Only data", "Only indexes", "Nothing"], answer: 0, why: "The table itself disappears." },
    { q: "SQLite's `TRUNCATE` is…", options: ["Unsupported — use DELETE", "A faster DELETE", "Identical to DROP", "A transaction"], answer: 0, why: "SQLite has no TRUNCATE statement." },
    { q: "Which empties a table but keeps it?", options: ["`DELETE FROM x;`", "`DROP TABLE x;`", "`ALTER TABLE x CLEAR;`", "`REMOVE x;`"], answer: 0, why: "DELETE without WHERE clears every row and leaves the schema." },
  ],
  security: [
    { q: "SQL injection happens when…", options: ["User input is concatenated into SQL", "Passwords are short", "Tables are large", "Indexes are missing"], answer: 0, why: "Untrusted text becomes executable code instead of data." },
    { q: "The strongest defence is…", options: ["Parameterised queries", "Hiding table names", "Uppercasing SQL", "Shortening input"], answer: 0, why: "Bound parameters keep input as data, never as syntax." },
    { q: "`GRANT` in this course is…", options: ["Conceptual — SQLite has no GRANT", "Fully supported", "A table", "A pragma"], answer: 0, why: "Server databases implement privileges; SQLite does not." },
  ],
};