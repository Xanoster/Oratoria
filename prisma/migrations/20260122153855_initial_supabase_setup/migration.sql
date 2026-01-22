-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "cefrLevel" TEXT NOT NULL DEFAULT 'A1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "germanText" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "clozeTargets" TEXT NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3),
    "cefrLevel" TEXT NOT NULL DEFAULT 'A1',
    "grammarFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audio" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'native',
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarTag" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "tagType" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "GrammarTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SRSState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SRSState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHistory" (
    "id" TEXT NOT NULL,
    "srsStateId" TEXT NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "outputType" TEXT NOT NULL,
    "intervalAfter" INTEGER NOT NULL,
    "easeFactorAfter" DOUBLE PRECISION NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "errors" TEXT NOT NULL DEFAULT '[]',
    "outcome" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "audioPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "narrativeNodeId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "cefrLevel" TEXT NOT NULL DEFAULT 'A1',
    "targetDurationMin" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSentence" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeNode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "setting" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "obstacle" TEXT NOT NULL,
    "linguisticObjective" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "unlockCriteria" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleplayScenario" (
    "id" TEXT NOT NULL,
    "narrativeNodeId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "personaPrompt" TEXT NOT NULL,
    "cefrLevel" TEXT NOT NULL DEFAULT 'A1',
    "setting" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "maxTurns" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleplayScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentNarrativeNode" INTEGER NOT NULL DEFAULT 0,
    "currentLesson" INTEGER NOT NULL DEFAULT 0,
    "totalSpeakingMs" INTEGER NOT NULL DEFAULT 0,
    "recentSpeakingMs" INTEGER NOT NULL DEFAULT 0,
    "errorRecoveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "srsRetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speechSecondsToday" INTEGER NOT NULL DEFAULT 0,
    "roleplayTurnCount" INTEGER NOT NULL DEFAULT 0,
    "outputFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Sentence_cefrLevel_idx" ON "Sentence"("cefrLevel");

-- CreateIndex
CREATE INDEX "Sentence_publishedAt_idx" ON "Sentence"("publishedAt");

-- CreateIndex
CREATE INDEX "Audio_sentenceId_idx" ON "Audio"("sentenceId");

-- CreateIndex
CREATE INDEX "GrammarTag_sentenceId_idx" ON "GrammarTag"("sentenceId");

-- CreateIndex
CREATE INDEX "GrammarTag_tagType_idx" ON "GrammarTag"("tagType");

-- CreateIndex
CREATE INDEX "SRSState_userId_nextReview_idx" ON "SRSState"("userId", "nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "SRSState_userId_sentenceId_key" ON "SRSState"("userId", "sentenceId");

-- CreateIndex
CREATE INDEX "ReviewHistory_srsStateId_idx" ON "ReviewHistory"("srsStateId");

-- CreateIndex
CREATE INDEX "ReviewHistory_reviewedAt_idx" ON "ReviewHistory"("reviewedAt");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_userId_idx" ON "SpeakingAttempt"("userId");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_sentenceId_idx" ON "SpeakingAttempt"("sentenceId");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_createdAt_idx" ON "SpeakingAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "Lesson_orderIndex_idx" ON "Lesson"("orderIndex");

-- CreateIndex
CREATE INDEX "Lesson_narrativeNodeId_idx" ON "Lesson"("narrativeNodeId");

-- CreateIndex
CREATE INDEX "LessonSentence_lessonId_orderIndex_idx" ON "LessonSentence"("lessonId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LessonSentence_lessonId_sentenceId_key" ON "LessonSentence"("lessonId", "sentenceId");

-- CreateIndex
CREATE INDEX "NarrativeNode_orderIndex_idx" ON "NarrativeNode"("orderIndex");

-- CreateIndex
CREATE INDEX "RoleplayScenario_narrativeNodeId_idx" ON "RoleplayScenario"("narrativeNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressState_userId_key" ON "ProgressState"("userId");

-- CreateIndex
CREATE INDEX "ProgressState_userId_idx" ON "ProgressState"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarTag" ADD CONSTRAINT "GrammarTag_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SRSState" ADD CONSTRAINT "SRSState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SRSState" ADD CONSTRAINT "SRSState_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHistory" ADD CONSTRAINT "ReviewHistory_srsStateId_fkey" FOREIGN KEY ("srsStateId") REFERENCES "SRSState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_narrativeNodeId_fkey" FOREIGN KEY ("narrativeNodeId") REFERENCES "NarrativeNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSentence" ADD CONSTRAINT "LessonSentence_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSentence" ADD CONSTRAINT "LessonSentence_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayScenario" ADD CONSTRAINT "RoleplayScenario_narrativeNodeId_fkey" FOREIGN KEY ("narrativeNodeId") REFERENCES "NarrativeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressState" ADD CONSTRAINT "ProgressState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
