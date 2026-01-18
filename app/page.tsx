"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Target, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Eliminate AI Slop.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Forever.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI ghostwriting that sounds like you, not a robot. 
            Multi-stage quality control ensures every post passes the Turing test.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/voice-profile/new">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8"
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Voice Matching</CardTitle>
              <CardDescription>
                Your unique writing style, captured and replicated with 90%+ accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 20+ voice rules per profile</li>
                <li>• Reference post analysis</li>
                <li>• Signature phrase injection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>6-Stage Pipeline</CardTitle>
              <CardDescription>
                Multi-layer generation prevents slop at every step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Generate 5 versions</li>
                <li>• Select & refine best</li>
                <li>• Hook optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Quality Gates</CardTitle>
              <CardDescription>
                100+ forbidden phrases blocked, 85+ quality score required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Zero AI slop tolerance</li>
                <li>• Specificity validation</li>
                <li>• Auto-regeneration</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-blue-100">Hours Saved/Month</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">85+</div>
              <div className="text-blue-100">Quality Score</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">&lt;2min</div>
              <div className="text-blue-100">Edit Time/Post</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Slop-Free</div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
