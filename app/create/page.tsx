"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, ArrowRight } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-4">Create a New Post</h1>
          <p className="text-muted-foreground text-lg">
            Choose the type of content you want to create
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Personal Experience</CardTitle>
                <CardDescription>
                  Share a story, lesson, or insight from your own experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Something that happened to you</li>
                  <li>• A lesson you learned</li>
                  <li>• A mistake and what you changed</li>
                  <li>• A success story with results</li>
                </ul>
                <Link href="/create/experience">
                  <Button className="w-full">
                    Start Experience Flow
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Pattern Recognition</CardTitle>
                <CardDescription>
                  Share a pattern you've observed across multiple situations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Something you've seen multiple times</li>
                  <li>• A trend or pattern in your industry</li>
                  <li>• What most people miss</li>
                  <li>• Data-backed observations</li>
                </ul>
                <Link href="/create/pattern">
                  <Button variant="secondary" className="w-full">
                    Start Pattern Flow
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
