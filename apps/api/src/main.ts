import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // CORS configuration
    app.enableCors({
        origin: process.env.WEB_URL || 'http://localhost:3000',
        credentials: true,
    });

    // Cookie parser for JWT in cookies
    app.use(cookieParser());

    // Global exception filter for standardized error responses
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 API running on http://localhost:${port}/api/v1`);
    console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();

