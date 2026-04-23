import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import * as dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
  }
}