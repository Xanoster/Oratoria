import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum EvaluationMode {
    PLACEMENT = 'placement',
    LESSON = 'lesson',
}

export enum EvaluationStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    NEEDS_REVIEW = 'needs_review',
}

export enum UserLevel {
    A0 = 'A0',
    A1 = 'A1',
    A2 = 'A2',
    B1 = 'B1',
    B2 = 'B2',
}

export class DetectedErrorDto {
    @IsString()
    type!: 'pronunciation' | 'grammar' | 'fluency';

    @IsString()
    token!: string;

    @IsString()
    expected!: string;

    @IsString()
    explanation!: string;

    @IsNumber()
    position!: number;
}

export class CreateEvaluationDto {
    @IsString()
    userId!: string;

    @IsString()
    transcript!: string;

    @IsString()
    @IsOptional()
    expectedText?: string;

    @IsEnum(UserLevel)
    userLevel!: UserLevel;

    @IsEnum(EvaluationMode)
    mode!: EvaluationMode;

    @IsString()
    @IsOptional()
    recordingId?: string;
}

export class EvaluationResponseDto {
    id!: string;
    userId!: string;
    transcript!: string;
    expectedText?: string | null;
    userLevel!: string;
    mode!: string;
    overallScore!: number;
    pronunciationScore!: number;
    grammarScore!: number;
    fluencyScore!: number;
    detectedErrors!: DetectedErrorDto[];
    confidence!: number;
    status!: string;
    createdAt!: Date;
}

export class EvaluationScoresDto {
    @IsNumber()
    @Min(0)
    @Max(100)
    overallScore!: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    pronunciationScore!: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    grammarScore!: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    fluencyScore!: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    confidence!: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetectedErrorDto)
    detectedErrors!: DetectedErrorDto[];

    @IsEnum(EvaluationStatus)
    status!: EvaluationStatus;
}
