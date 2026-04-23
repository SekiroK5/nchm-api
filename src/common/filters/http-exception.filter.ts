import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { PrismaService } from '../services/prisma.service';


@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    constructor(private readonly prisma: PrismaService) { }

    async catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException
            ? exception.getResponse()
            : 'Internal Server Error';

        const errorText = typeof message === 'string'
            ? message
            : (message as any).message || JSON.stringify(message);

        const sessionUser = (request as any)['user'];

        this.prisma.logs.create({
            data: {
                statusCode: status,
                timestamp: new Date(),
                path: request.url,
                error: Array.isArray(errorText) ? errorText.join(', ') : String(errorText),
                errorCode: (exception as any).code || 'UNKNOWN_ERROR',
                session_id: sessionUser?.id ?? null,
            },
        }).catch(() => { });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: Array.isArray(errorText) ? errorText : errorText,
            errorCode: (exception as any).code || 'UNKNOWN_ERROR',
        });
    }
}