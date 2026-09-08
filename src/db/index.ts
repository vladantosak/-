import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
  var _inMemoryTables: Record<string, any[]> | undefined;
}

// Function to create or retrieve the connection pool using Object Method
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

function toCamelCase(str: string) {
  return str.replace(/_([a-z0-9])/g, (_, l) => l.toUpperCase());
}

function toSnakeCase(str: string) {
  return str.replace(/[A-Z]/g, (l) => '_' + l.toLowerCase());
}

function normalizeRow(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const row: any = {};
  for (const [k, v] of Object.entries(obj)) {
    row[k] = v;
    row[toCamelCase(k)] = v;
    row[toSnakeCase(k)] = v;
  }
  return row;
}

function getTableName(table: any): string {
  if (!table) return 'unknown';
  if (table[Symbol.for('drizzle:Name')]) return table[Symbol.for('drizzle:Name')];
  if (table[Symbol.for('drizzle:OriginalName')]) return table[Symbol.for('drizzle:OriginalName')];
  if (table._?.name) return table._.name;
  return String(table);
}

function evalCondition(row: any, cond: any): boolean {
  if (!cond) return true;
  const chunks = cond.queryChunks;
  if (!chunks || !Array.isArray(chunks)) return true;

  const subSqls = chunks.filter((c: any) => c && c.constructor && c.constructor.name === 'SQL');
  if (subSqls.length > 0) {
    return subSqls.every((sub: any) => evalCondition(row, sub));
  }

  let colName: string | null = null;
  let op = '=';
  let paramVal: any = undefined;

  for (const chunk of chunks) {
    if (!chunk) continue;
    if (chunk.name && chunk.table) {
      colName = chunk.name;
    } else if (chunk.constructor && chunk.constructor.name === 'StringChunk') {
      const s = Array.isArray(chunk.value) ? chunk.value.join('') : String(chunk.value);
      if (s.includes(' = ')) op = '=';
      else if (s.includes(' <> ') || s.includes(' != ')) op = '!=';
      else if (s.includes(' >= ')) op = '>=';
      else if (s.includes(' <= ')) op = '<=';
      else if (s.includes(' > ')) op = '>';
      else if (s.includes(' < ')) op = '<';
    } else if (chunk.constructor && chunk.constructor.name === 'Param') {
      paramVal = chunk.value;
    }
  }

  if (!colName) return true;
  const val = row[colName] !== undefined ? row[colName] : row[toCamelCase(colName)];
  if (op === '=') return val === paramVal;
  if (op === '!=') return val !== paramVal;
  if (op === '>=') return val >= paramVal;
  if (op === '<=') return val <= paramVal;
  if (op === '>') return val > paramVal;
  if (op === '<') return val < paramVal;
  return true;
}

function extractOrder(orderArg: any): { field: string; isDesc: boolean } | null {
  if (!orderArg) return null;
  if (orderArg.name) {
    return { field: orderArg.name, isDesc: false };
  }
  if (orderArg.queryChunks && Array.isArray(orderArg.queryChunks)) {
    let field = '';
    let isDesc = false;
    for (const chunk of orderArg.queryChunks) {
      if (chunk?.name) field = chunk.name;
      if (chunk?.value && Array.isArray(chunk.value)) {
        if (chunk.value.join('').includes('desc')) isDesc = true;
      }
    }
    if (field) return { field, isDesc };
  }
  return null;
}

// In-Memory Database Fallback for development without external Postgres
function createInMemoryDb() {
  if (!global._inMemoryTables) {
    global._inMemoryTables = {
      users: [],
      orders: [],
      receipts: [],
      verifications: [],
      messages: [],
      transactions: [],
      audit_logs: [],
      notifications: [],
      reviews: [],
    };
  }
  const store = global._inMemoryTables;

  function getTableList(table: any): any[] {
    const name = getTableName(table);
    if (!store[name]) {
      store[name] = [];
    }
    return store[name];
  }

  const inMemDb: any = {
    select: (fields?: any) => {
      let targetTable: any = null;
      let condition: any = null;
      let orderClause: any = null;
      let limitCount: number | null = null;

      const queryObj: any = {
        from: (table: any) => {
          targetTable = table;
          return queryObj;
        },
        where: (cond: any) => {
          condition = cond;
          return queryObj;
        },
        orderBy: (order: any) => {
          orderClause = order;
          return queryObj;
        },
        limit: (limit: number) => {
          limitCount = limit;
          return queryObj;
        },
        for: (_mode: string) => {
          return queryObj;
        },
        then: (resolve: any, reject: any) => {
          try {
            const list = getTableList(targetTable);
            let filtered = list.filter((r) => evalCondition(r, condition));

            if (orderClause) {
              const orderInfo = extractOrder(orderClause);
              if (orderInfo) {
                filtered.sort((a, b) => {
                  const valA = a[orderInfo.field] ?? a[toCamelCase(orderInfo.field)];
                  const valB = b[orderInfo.field] ?? b[toCamelCase(orderInfo.field)];
                  const compA = valA instanceof Date ? valA.getTime() : valA;
                  const compB = valB instanceof Date ? valB.getTime() : valB;
                  if (compA < compB) return orderInfo.isDesc ? 1 : -1;
                  if (compA > compB) return orderInfo.isDesc ? -1 : 1;
                  return 0;
                });
              }
            }

            if (limitCount !== null) {
              filtered = filtered.slice(0, limitCount);
            }

            if (fields && typeof fields === 'object' && 'value' in fields) {
              resolve([{ value: filtered.length }]);
              return;
            }

            resolve(filtered.map((r) => ({ ...r })));
          } catch (err) {
            if (reject) reject(err);
            else throw err;
          }
        },
      };

      return queryObj;
    },

    insert: (table: any) => {
      let itemsToInsert: any[] = [];
      const insertObj: any = {
        values: (data: any) => {
          const items = Array.isArray(data) ? data : [data];
          itemsToInsert = items.map((item) => normalizeRow(item));
          return insertObj;
        },
        returning: () => insertObj,
        then: (resolve: any, reject: any) => {
          try {
            const list = getTableList(table);
            for (const item of itemsToInsert) {
              const idx = list.findIndex((r) => r.id && r.id === item.id);
              if (idx >= 0) {
                list[idx] = { ...list[idx], ...item };
              } else {
                list.push(item);
              }
            }
            resolve(itemsToInsert.map((r) => ({ ...r })));
          } catch (err) {
            if (reject) reject(err);
            else throw err;
          }
        },
      };
      return insertObj;
    },

    update: (table: any) => {
      let updateValues: any = {};
      let condition: any = null;
      const updateObj: any = {
        set: (vals: any) => {
          updateValues = normalizeRow(vals);
          return updateObj;
        },
        where: (cond: any) => {
          condition = cond;
          return updateObj;
        },
        returning: () => updateObj,
        then: (resolve: any, reject: any) => {
          try {
            const list = getTableList(table);
            const updatedRows: any[] = [];
            for (let i = 0; i < list.length; i++) {
              if (evalCondition(list[i], condition)) {
                list[i] = normalizeRow({ ...list[i], ...updateValues });
                updatedRows.push({ ...list[i] });
              }
            }
            resolve(updatedRows);
          } catch (err) {
            if (reject) reject(err);
            else throw err;
          }
        },
      };
      return updateObj;
    },

    delete: (table: any) => {
      let condition: any = null;
      const deleteObj: any = {
        where: (cond: any) => {
          condition = cond;
          return deleteObj;
        },
        then: (resolve: any, reject: any) => {
          try {
            const list = getTableList(table);
            const remaining = list.filter((r) => !evalCondition(r, condition));
            store[getTableName(table)] = remaining;
            resolve([]);
          } catch (err) {
            if (reject) reject(err);
            else throw err;
          }
        },
      };
      return deleteObj;
    },

    transaction: async (cb: (tx: any) => Promise<any>) => {
      return await cb(inMemDb);
    },
  };

  return inMemDb;
}

let dbInstance: any;
if (process.env.SQL_HOST) {
  try {
    const pool = createPool();
    dbInstance = drizzle(pool, { schema });
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL connection initialization failed, using in-memory mock:', err);
    dbInstance = createInMemoryDb();
  }
} else {
  console.log('[AI Studio] SQL_HOST not set — using in-memory database mock for instant preview');
  dbInstance = createInMemoryDb();
}

export const db = dbInstance;
