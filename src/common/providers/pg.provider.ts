import { Client } from "pg";

export const pgProvider = {
    provide: 'POSTGRES_CONNECTION',
    useFactory: async () => {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        });

        client.on('error', (err) => {
            console.error('Unexpected error on idle pg client', err);
        });

        await client.connect();
        return client;
    }
}