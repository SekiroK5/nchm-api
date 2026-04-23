import { Client } from "pg";

export const pgProvider = {
    provide: 'POSTGRES_CONNECTION',
    useFactory: async () => {
        const client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'linux123',
            database: 'GIDS0681'
        });

        await client.connect();
        console.log("Conectado a la BD")
        return client;
    }
}