import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit {
    constructor() {

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // Neon requiere SSL; la BD local de pruebas no (DB_SSL=false)
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        });

        pool.on('error', (err) => {
            console.error('Unexpected error on idle pg pool', err);
        });

        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log: process.env.PRISMA_LOG_QUERIES === 'true'
                ? ['query', 'info', 'warn', 'error']
                : ['warn', 'error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }
}