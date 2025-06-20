"use client";
import { AvatarLayout } from "@/components/AvatarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import {
  UsersIcon,
  UserCheckIcon,
  BuildingIcon,
  TrendingUpIcon,
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Leads",
      value: "1,234",
      change: "+12%",
      icon: UsersIcon,
      color: "bg-blue-500",
    },
    {
      title: "Active Candidates",
      value: "567",
      change: "+8%",
      icon: UserCheckIcon,
      color: "bg-green-500",
    },
    {
      title: "Partner Vendors",
      value: "89",
      change: "+5%",
      icon: BuildingIcon,
      color: "bg-purple-500",
    },
  ];

  return (
    <AvatarLayout>
      <div className="space-y-6 text-gray-900 dark:text-gray-100">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 rounded-3xl p-12 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              Welcome to Avatar
            </h1>
            <p className="text-2xl text-white/90 max-w-2xl mx-auto">
              Your comprehensive admin panel for managing leads, candidates, and
              vendor relationships
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600">
                        {stat.change} from last month
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AvatarLayout>
  );
}
