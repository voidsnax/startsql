export interface ColumnDef {
  name: string;
  type: string;
  note?: string;
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
  sampleRows: (string | number | null)[][];
}

export interface DatabaseDef {
  id: string;
  name: string;
  seedSql: string;
  tables: TableDef[];
}

const SEED_SQL = `
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  city TEXT,
  phone TEXT,
  course_id INTEGER
);

INSERT INTO students (id, name, age, city, phone, course_id) VALUES
  (1, 'Anu',     20, 'Kochi',     '9876543210', 1),
  (2, 'Rahul',   22, 'Kozhikode', '9876543211', 2),
  (3, 'Meera',   19, 'Kochi',     NULL,         1),
  (4, 'Arjun',   21, 'Kannur',    '9876543212', 3),
  (5, 'Divya',   23, 'Kozhikode', '9876543213', 2),
  (6, 'Karthik', 20, 'Kochi',     '9876543214', NULL),
  (7, 'Sneha',   18, 'Thrissur',  NULL,         1),
  (8, 'Vishnu',  24, 'Kozhikode', '9876543215', 3);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  teacher TEXT,
  active INTEGER DEFAULT 1
);

INSERT INTO courses (id, name, teacher, active) VALUES
  (1, 'Python Basics',   'Mr. Nair',     1),
  (2, 'Web Development', 'Ms. Iyer',     1),
  (3, 'Data Science',    'Dr. Menon',    0),
  (4, 'Mobile Apps',     'Mr. Krishnan', 1);

CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  director TEXT,
  year INTEGER,
  rating REAL,
  genre TEXT,
  language TEXT
);

INSERT INTO movies (id, title, director, year, rating, genre, language) VALUES
  (1, 'Sholay',            'Ramesh Sippy',        1975, 8.9, 'Action',   'Hindi'),
  (2, '3 Idiots',          'Rajkumar Hirani',     2009, 8.4, 'Comedy',   'Hindi'),
  (3, 'Dangal',            'Nitesh Tiwari',       2016, 8.3, 'Drama',    'Hindi'),
  (4, 'Baahubali',         'SS Rajamouli',        2015, 8.2, 'Action',   'Telugu'),
  (5, 'Drishyam',          'Jeethu Joseph',       2013, 8.3, 'Thriller', 'Malayalam'),
  (6, 'Kumbalangi Nights', 'Madhu C. Narayanan',  2019, 8.5, 'Drama',    'Malayalam'),
  (7, 'Gully Boy',         'Zoya Akhtar',         2019, 8.0, 'Drama',    'Hindi'),
  (8, 'Nayakan',           'Mani Ratnam',         1987, 8.6, 'Crime',    'Tamil');
`;

export const DATABASE: DatabaseDef = {
  id: 'main',
  name: 'SQL Tutor',
  seedSql: SEED_SQL,
  tables: [
    {
      name: 'students',
      columns: [
        { name: 'id', type: 'INTEGER', note: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', note: 'NOT NULL' },
        { name: 'age', type: 'INTEGER' },
        { name: 'city', type: 'TEXT' },
        { name: 'phone', type: 'TEXT' },
        { name: 'course_id', type: 'INTEGER', note: '→ courses.id' },
      ],
      sampleRows: [
        [1, 'Anu', 20, 'Kochi', '9876543210', 1],
        [2, 'Rahul', 22, 'Kozhikode', '9876543211', 2],
      ],
    },
    {
      name: 'courses',
      columns: [
        { name: 'id', type: 'INTEGER', note: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', note: 'NOT NULL' },
        { name: 'teacher', type: 'TEXT' },
        { name: 'active', type: 'INTEGER', note: 'DEFAULT 1' },
      ],
      sampleRows: [
        [1, 'Python Basics', 'Mr. Nair', 1],
        [2, 'Web Development', 'Ms. Iyer', 1],
      ],
    },
    {
      name: 'movies',
      columns: [
        { name: 'id', type: 'INTEGER', note: 'PRIMARY KEY' },
        { name: 'title', type: 'TEXT', note: 'NOT NULL' },
        { name: 'director', type: 'TEXT' },
        { name: 'year', type: 'INTEGER' },
        { name: 'rating', type: 'REAL' },
        { name: 'genre', type: 'TEXT' },
        { name: 'language', type: 'TEXT' },
      ],
      sampleRows: [
        [1, 'Sholay', 'Ramesh Sippy', 1975, 8.9, 'Action', 'Hindi'],
        [2, '3 Idiots', 'Rajkumar Hirani', 2009, 8.4, 'Comedy', 'Hindi'],
      ],
    },
  ],
};