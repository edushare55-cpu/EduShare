"use client";

import { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Briefcase, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";

interface PublicProfileClientProps {
  user: User;
}

export default function PublicProfileClient({ user }: PublicProfileClientProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();



  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
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
      </div>

      <div className="relative px-6 sm:px-10 -mt-20 md:-mt-24 pointer-events-none">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-6 pointer-events-auto">
          
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatarUrl || ""} alt={user.name} className="object-cover" />
            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          
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
              <Badge variant={user.role === "FACULTY" ? "default" : "secondary"} className="ml-auto md:ml-0">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="mt-8">
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
            <Card className="h-full bg-surface-container-low border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground space-y-2">
                <Shield className="w-12 h-12 opacity-20" />
                <p>This is a public profile overview.</p>
                <p className="text-sm">Additional information is private.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
