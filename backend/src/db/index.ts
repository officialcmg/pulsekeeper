import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Initialize database tables
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Create permissions table - stores user permissions with context
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_address VARCHAR(42) NOT NULL,
        token_address VARCHAR(42) NOT NULL,
        permissions_context TEXT NOT NULL,
        delegation_manager VARCHAR(42) NOT NULL,
        period_amount NUMERIC NOT NULL,
        period_duration_seconds BIGINT NOT NULL,
        granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_address, token_address)
      );
    `);

    // Create redemptions table - tracks each redemption for amount tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS redemptions (
        id SERIAL PRIMARY KEY,
        user_address VARCHAR(42) NOT NULL,
        token_address VARCHAR(42) NOT NULL,
        amount NUMERIC NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        redeemed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        period_start TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_permissions_user_address 
      ON permissions(user_address);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_permissions_active 
      ON permissions(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_redemptions_user_token 
      ON redemptions(user_address, token_address);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_redemptions_period 
      ON redemptions(user_address, token_address, period_start);
    `);

    console.log('✅ Database tables initialized');

  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
});
