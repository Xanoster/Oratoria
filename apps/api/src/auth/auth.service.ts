import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignUpDto, LoginDto, MagicLinkDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private notificationsService: NotificationsService,
    ) { }

    async signUp(dto: SignUpDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                id: uuidv4(),
                email: dto.email,
                passwordHash: hashedPassword,
                name: dto.name,
                prefs: {
                    correctionDepth: 'standard',
                    timeCommitment: 15,
                },
            },
        });

        const tokens = await this.generateTokens(user.id, user.email);

        return {
            userId: user.id,
            email: user.email,
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const tokens = await this.generateTokens(user.id, user.email);

        return {
            userId: user.id,
            email: user.email,
            ...tokens,
        };
    }

    async sendMagicLink(dto: MagicLinkDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a magic link has been sent' };
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await this.prisma.session.create({
            data: {
                id: uuidv4(),
                userId: user.id,
                jwtRefresh: token,
                expiresAt,
            },
        });

        const magicLinkUrl = `${this.configService.get('WEB_URL')}/auth/verify?token=${token}`;

        await this.notificationsService.sendEmail({
            to: dto.email,
            subject: 'Your Oratoria Login Link',
            html: `
        <h1>Login to Oratoria</h1>
        <p>Click the link below to log in:</p>
        <a href="${magicLinkUrl}">Log in to Oratoria</a>
        <p>This link expires in 15 minutes.</p>
      `,
        });

        return { message: 'If the email exists, a magic link has been sent' };
    }

    async verifyMagicLink(token: string) {
        const session = await this.prisma.session.findFirst({
            where: {
                jwtRefresh: token,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!session) {
            throw new BadRequestException('Invalid or expired token');
        }

        // Delete the used token
        await this.prisma.session.delete({
            where: { id: session.id },
        });

        await this.prisma.user.update({
            where: { id: session.userId },
            data: { lastLogin: new Date() },
        });

        const tokens = await this.generateTokens(session.userId, session.user.email);

        return {
            userId: session.userId,
            email: session.user.email,
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || user.isDeleted) {
                throw new UnauthorizedException('Invalid token');
            }

            return this.generateTokens(user.id, user.email);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.isDeleted) {
            return null;
        }

        return user;
    }

    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return { accessToken, refreshToken };
    }
}
