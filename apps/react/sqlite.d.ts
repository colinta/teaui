declare module 'node:sqlite' {
  export interface DatabaseSyncOptions {
    readOnly?: boolean
  }

  export interface StatementSync {
    all(...params: any[]): any[]
    get(...params: any[]): any
    run(...params: any[]): {changes: number; lastInsertRowid: number}
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions)
    prepare(sql: string): StatementSync
    close(): void
  }
}
