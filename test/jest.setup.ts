import { Client } from 'pg';

// Increase timeout for all tests
jest.setTimeout(30000);

// Helper to check if database exists
async function databaseExists(dbName: string): Promise<boolean> {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    await client.end();
  }
}

// Helper to drop database if it exists
async function dropDatabaseIfExists(dbName: string): Promise<void> {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const exists = await databaseExists(dbName);
    if (exists) {
      // Terminate all connections to the database
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${dbName}'
        AND pid <> pg_backend_pid();
      `);
      // Drop the database
      await client.query(`DROP DATABASE ${dbName}`);
    }
  } finally {
    await client.end();
  }
}

// Clean up any test databases before running tests
beforeAll(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const result = await client.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE datname LIKE 'test_%'",
    );
    const testDbs = result.rows.map(row => row.datname);
    await Promise.all(
      testDbs.map((dbName: string) => dropDatabaseIfExists(dbName)),
    );
  } finally {
    await client.end();
  }
});
