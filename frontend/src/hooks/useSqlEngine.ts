import { useCallback, useEffect, useRef, useState } from 'react';
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export interface QueryResult {
  columns: string[];
  values: SqlValue[][];
}

export interface QueryResponse {
  results: QueryResult[];
  error: string | null;
  executionTimeMs: number;
}

export interface IsolatedRun {
  result: QueryResult | null;
  error: string | null;
}

export function useSqlEngine() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sqlModuleRef = useRef<SqlJsStatic | null>(null);
  const dbRef = useRef<Database | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const SQL = await initSqlJs({ locateFile: () => wasmUrl });
        if (cancelled) return;
        sqlModuleRef.current = SQL;
        dbRef.current = new SQL.Database();
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback((seedSql?: string) => {
    if (!sqlModuleRef.current) return;
    dbRef.current?.close();
    const fresh = new sqlModuleRef.current.Database();
    if (seedSql && seedSql.trim()) {
      try {
        fresh.run(seedSql);
      } catch (e) {
        console.error('Seed SQL failed:', e);
      }
    }
    dbRef.current = fresh;
  }, []);

  const execute = useCallback((sql: string): QueryResponse => {
    const start = performance.now();
    if (!dbRef.current) {
      return { results: [], error: 'Database not ready', executionTimeMs: 0 };
    }
    try {
      const results = dbRef.current.exec(sql);
      return {
        results,
        error: null,
        executionTimeMs: performance.now() - start,
      };
    } catch (e) {
      return {
        results: [],
        error: e instanceof Error ? e.message : String(e),
        executionTimeMs: performance.now() - start,
      };
    }
  }, []);

  /**
   * Run a query on a fresh isolated database seeded with `seedSql`,
   * then run `probeQuery` and return the probe's result.
   * The main working DB is untouched.
   */
  const runIsolated = useCallback(
    (seedSql: string, query: string, probeQuery: string): IsolatedRun => {
      if (!sqlModuleRef.current) {
        return { result: null, error: 'DB not ready' };
      }
      const db = new sqlModuleRef.current.Database();
      try {
        if (seedSql.trim()) db.run(seedSql);
        db.exec(query);
        const res = db.exec(probeQuery);
        return {
          result: res[0] ?? { columns: [], values: [] },
          error: null,
        };
      } catch (e) {
        return {
          result: null,
          error: e instanceof Error ? e.message : String(e),
        };
      } finally {
        db.close();
      }
    },
    []
  );

  return { ready, execute, reset, runIsolated, loadError };
}