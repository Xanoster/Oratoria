'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="font-serif text-2xl font-bold text-[#2d1b0e]">Oratoria</div>
        <div className="space-x-4">
          <Link href="/login" className="text-[#5c4a3a] font-medium hover:text-[#c17767] transition-colors">
            Log In
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 text-center md:text-left">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#2d1b0e] leading-tight">
            Speak German with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c17767] to-[#8b5e3c]">Confidence</span>
          </h1>
          <p className="text-xl text-[#5c4a3a] max-w-lg mx-auto md:mx-0">
            The AI language tutor that listens, corrects, and helps you master pronunciation through real conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link href="/signup">
              <Button size="lg" className="shadow-xl shadow-[#c17767]/20">Start Speaking Free</Button>
            </Link>
            <Link href="/lesson">
              <Button variant="secondary" size="lg">Try Demo Lesson</Button>
            </Link>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-6 pt-4 text-[#8b7355] text-sm font-medium">
            <span>✓ Instant Feedback</span>
            <span>✓ Native Pronunciation</span>
            <span>✓ SRS Retention</span>
          </div>
        </div>

        {/* Abstract Visual */}
        <div className="flex-1 relative">
          <div className="relative w-full aspect-square max-w-lg mx-auto">
            {/* Decorative circles */}
            <div className="absolute inset-0 bg-[#c17767] rounded-full opacity-10 blur-3xl animate-pulse"></div>
            <div className="absolute top-10 right-10 w-2/3 h-2/3 bg-[#8b5e3c] rounded-full opacity-10 blur-2xl"></div>

            {/* Main Image Container */}
            <div className="relative z-10 bg-white rounded-[2.5rem] p-8 shadow-2xl border border-[#c17767]/10 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#faf5f0] flex items-center justify-center">🇩🇪</div>
                  <div className="h-2 w-24 bg-[#faf5f0] rounded-full"></div>
                </div>
                {/* Chat Bubble 1 */}
                <div className="bg-[#faf5f0] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl p-4 w-4/5">
                  <div className="h-2 w-3/4 bg-[#e2e8f0] rounded-full mb-2"></div>
                  <div className="h-2 w-1/2 bg-[#e2e8f0] rounded-full"></div>
                </div>
                {/* Chat Bubble 2 (User) */}
                <div className="bg-gradient-to-br from-[#c17767] to-[#8b5e3c] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl p-4 w-4/5 ml-auto text-white">
                  <p className="font-medium text-sm">Ich möchte einen Kaffee, bitte.</p>
                </div>
                {/* Feedback Toast */}
                <div className="bg-white border-l-4 border-[#6b8e23] p-3 shadow-lg rounded-lg transform translate-y-4 scale-105">
                  <div className="flex items-center gap-2 text-[#6b8e23] font-bold text-sm">
                    <span>✓</span> Excellent Pronunciation!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
