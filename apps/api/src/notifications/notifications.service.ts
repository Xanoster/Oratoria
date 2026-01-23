import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class NotificationsService {
    private transporter: nodemailer.Transporter | null = null;

    constructor(private configService: ConfigService) {
        const smtpHost = this.configService.get<string>('SMTP_HOST');

        if (smtpHost) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
                secure: false,
                auth: {
                    user: this.configService.get<string>('SMTP_USER'),
                    pass: this.configService.get<string>('SMTP_PASS'),
                },
            });
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.transporter) {
            console.log('Email would be sent (SMTP not configured):', options);
            return true; // Pretend success in dev mode
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM') || 'noreply@oratoria.app',
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
}
