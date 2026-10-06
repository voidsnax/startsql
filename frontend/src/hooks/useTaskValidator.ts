import type { QueryResponse, QueryResult, IsolatedRun } from './useSqlEngine';

function canonicalize(res: QueryResult, orderMatters: boolean): string {
  const header = res.columns.map((c) => c.trim().toLowerCase()).join('|');
  const rows = res.values.map((row) =>
    row.map((cell) => (cell === null ? '\u0000NULL' : String(cell))).join('|')
  );
  if (!orderMatters) rows.sort();
  return header + '\n' + rows.join('\n');
}

export interface ValidationResult {
  passed: boolean;
  reason?: string;
}

/** Standard validation: compare two SELECT result sets. */
export function validateTask(
  studentRes: QueryResponse,
  solutionRes: QueryResponse,
  orderMatters: boolean
): ValidationResult {
  if (studentRes.error) {
    return { passed: false, reason: 'Your query has an error — fix that first.' };
  }
  if (solutionRes.error) {
    return { passed: false, reason: 'Internal validation error.' };
  }
  if (studentRes.results.length !== solutionRes.results.length) {
    return { passed: false, reason: 'Not quite. Check your columns and rows.' };
  }
  for (let i = 0; i < studentRes.results.length; i++) {
    const a = canonicalize(studentRes.results[i], orderMatters);
    const b = canonicalize(solutionRes.results[i], orderMatters);
    if (a !== b) {
      if (studentRes.results[i].values.length === 0) {
        return { passed: false, reason: 'Your query returned no rows.' };
      }
      return { passed: false, reason: 'Not quite. Check your columns and rows.' };
    }
  }
  return { passed: true };
}

/**
 * Mutation validation: run student query and solution query on isolated
 * copies of the DB, then compare the probe query's result.
 */
export function validateMutation(
  seedSql: string,
  studentQuery: string,
  solutionQuery: string,
  probeQuery: string,
  runner: (seed: string, query: string, probe: string) => IsolatedRun
): ValidationResult {
  const expected = runner(seedSql, solutionQuery, probeQuery);
  if (expected.error) {
    return { passed: false, reason: 'Internal validation error.' };
  }
  const actual = runner(seedSql, studentQuery, probeQuery);
  if (actual.error) {
    return {
      passed: false,
      reason: 'Your query has an error — fix it and try again.',
    };
  }
  if (!expected.result || !actual.result) {
    return { passed: false, reason: 'Validation could not compare results.' };
  }

  const a = canonicalize(actual.result, true);
  const b = canonicalize(expected.result, true);
  if (a !== b) {
    return {
      passed: false,
      reason: 'Not quite. The table state doesn\'t match the expected result.',
    };
  }
  return { passed: true };
}