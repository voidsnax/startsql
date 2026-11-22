/**
 * The single SQLite vocabulary for the app: editor highlighting, lesson-block
 * highlighting and autocomplete all read from here.
 */
export const SQL_KEYWORDS =
  "abort action add after all alter always analyze and as asc attach " +
  "autoincrement before begin between by cascade case cast check collate " +
  "column commit conflict constraint create cross current current_date " +
  "current_time current_timestamp database default deferrable deferred delete " +
  "desc detach distinct do drop each else end escape except exclude exclusive " +
  "exists explain fail filter first following for foreign from full generated " +
  "glob group groups having if ignore immediate in index indexed initially " +
  "inner insert instead intersect into is isnull join key last left like limit " +
  "match materialized natural no not nothing notnull null nulls of offset on " +
  "or order others outer over partition plan pragma preceding primary query " +
  "raise range recursive references regexp reindex release rename replace " +
  "restrict returning right rollback row rows savepoint select set table temp " +
  "temporary then ties to transaction trigger unbounded union unique update " +
  "using vacuum values view virtual when where window with without";

export const SQL_TYPES =
  "integer int tinyint smallint mediumint bigint real double float numeric " +
  "decimal boolean text blob varchar character char nchar nvarchar clob " +
  "date datetime timestamp";

export const SQL_FUNCTIONS =
  "count sum avg total min max group_concat coalesce ifnull nullif round abs " +
  "length lower upper substr substring trim ltrim rtrim replace instr random " +
  "randomblob hex quote typeof last_insert_rowid changes strftime julianday " +
  "date time datetime printf format";