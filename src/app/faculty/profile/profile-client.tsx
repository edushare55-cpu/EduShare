"use client";

import { User } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Briefcase, Calendar, Shield, Bell, Users, School, Camera } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateAvatarUrl, updateCoverUrl } from "@/lib/actions/profile";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth.store";

interface FacultyProfileClientProps {
  user: User;
  stats: {
    activeClasses: number;
    totalStudents: number;
  };
}

export default function FacultyProfileClient({ user, stats }: FacultyProfileClientProps) {
  const setUser = useAuthStore((state) => state.setUser);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();



  const handleAvatarUpload = async (url: string) => {
    const result = await updateAvatarUrl(url);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleCoverUpload = async (url: string) => {
    const result = await updateCoverUrl(url);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <ImageUpload 
        onUploadSuccess={handleCoverUpload} 
        className="block"
      >
        <div 
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-600 to-slate-800 h-48 md:h-64 shadow-lg bg-cover bg-center"
          style={user.coverUrl ? { backgroundImage: `url(${user.coverUrl})` } : {}}
        >
          {/* Decorative elements */}
          {!user.coverUrl && (
            <>
              <div className="absolute inset-0 bg-white/5" style={{ backdropFilter: "blur(20px)" }} />
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            </>
          )}
          <div className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </ImageUpload>

      <div className="relative px-6 sm:px-10 -mt-20 md:-mt-24 pointer-events-none">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-6 pointer-events-auto">
          
          <ImageUpload onUploadSuccess={handleAvatarUpload} className="rounded-full">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatarUrl || ""} alt={user.name} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </ImageUpload>
          
          <div className="flex-1 space-y-2 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{user.department || "No department listed"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(user.createdAt), "MMMM yyyy")}</span>
              </div>
              <Badge variant="secondary" className="ml-auto md:ml-0">{user.role}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none space-x-6 overflow-x-auto">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
          >
            Account Settings
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
          >
            Preferences
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{user.approvalStatus.toLowerCase()} Account</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Classes</CardTitle>
                      <School className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeClasses}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-2xl">
                <ProfileForm user={user} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is using a long, random password to stay secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-2xl">
                <PasswordForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Notifications & Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive updates and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Email Notifications
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when there are new announcements or grades.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
