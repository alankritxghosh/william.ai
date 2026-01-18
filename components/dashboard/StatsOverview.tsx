"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Star, Calendar, Clock } from "lucide-react";

interface StatsOverviewProps {
  totalPosts: number;
  avgScore: number;
  thisMonth: number;
  timeSaved: number;
}

export function StatsOverview({
  totalPosts,
  avgScore,
  thisMonth,
  timeSaved,
}: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Posts",
      value: totalPosts,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
      subtext: "generated",
    },
    {
      label: "Avg Quality",
      value: avgScore,
      icon: Star,
      color: "bg-amber-100 text-amber-600",
      subtext: "/ 100",
    },
    {
      label: "This Month",
      value: thisMonth,
      icon: Calendar,
      color: "bg-green-100 text-green-600",
      subtext: "posts",
    },
    {
      label: "Time Saved",
      value: timeSaved,
      icon: Clock,
      color: "bg-purple-100 text-purple-600",
      subtext: "hours",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">
                      {stat.subtext}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
