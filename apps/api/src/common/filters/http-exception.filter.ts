import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    details?: unknown;
    timestamp: string;
    path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string;
        let error: string;
        let details: unknown = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = HttpStatus[status] || 'Error';
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp.message as string) || exception.message;
                error = (resp.error as string) || HttpStatus[status] || 'Error';
                details = resp.details || resp.errors;

                // Handle class-validator errors
                if (Array.isArray(resp.message)) {
                    details = resp.message;
                    message = 'Validation failed';
                }
            } else {
                message = exception.message;
                error = HttpStatus[status] || 'Error';
            }
        } else if (exception instanceof Error) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';

            // Log the full error for debugging
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred';
            error = 'Internal Server Error';
        }

        const errorResponse: ErrorResponse = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        if (details) {
            errorResponse.details = details;
        }

        response.status(status).json(errorResponse);
    }
}
