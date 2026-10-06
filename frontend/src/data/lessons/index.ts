import type { Lesson } from './types';

import intro from './01-intro';
import select from './02-select';
import where from './03-where';
import andOr from './04-and-or';
import likeNull from './05-like-null';
import orderLimit from './06-order-limit';
import aliases from './07-aliases';
import aggregates from './08-aggregates';
import groupBy from './09-group-by';
import having from './10-having';
import multiTable from './11-multi-table';
import innerJoin from './12-inner-join';
import leftJoin from './13-left-join';
import completeQueries from './14-complete-queries';
import insert from './15-insert';
import update from './16-update';
import del from './17-delete';
import createTable from './18-create-table';
import constraints from './19-constraints';
import alter from './20-alter';
import drop from './21-drop';
import grant from './22-grant';

export type { Lesson, Task } from './types';

export const lessons: Lesson[] = [
  intro,
  select,
  where,
  andOr,
  likeNull,
  orderLimit,
  aliases,
  aggregates,
  groupBy,
  having,
  multiTable,
  innerJoin,
  leftJoin,
  completeQueries,
  insert,
  update,
  del,
  createTable,
  constraints,
  alter,
  drop,
  grant,
];

export function lessonLabel(l: Lesson) {
  return `${l.number}. ${l.title}`;
}