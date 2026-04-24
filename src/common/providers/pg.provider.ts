import { Client } from "pg";

export const pgProvider = {
    provide: 'POSTGRES_CONNECTION',
    useFactory: async () => {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        return client;
    }
}