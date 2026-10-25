"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClass, useClassMembers } from "@/hooks/use-class";

export default function StudentClassMembersPage() {
  const params  = useParams();
  const router  = useRouter();
  const classId = params.classId as string;

  const [searchQuery, setSearchQuery] = useState("");

  const { data: classData, isLoading: isClassLoading } = useClass(classId);
  const { data: members = [], isLoading: isMembersLoading } = useClassMembers(classId);

  const isLoading = isClassLoading || isMembersLoading;

  // instructor is always derived from the class detail (never from mock data)
  const instructor = classData?.faculty ?? null;

  // peers = all enrolled students derived from live membership data
  const filteredPeers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.student.name.toLowerCase().includes(query) ||
        m.student.email.toLowerCase().includes(query) ||
        (m.student.department ?? "").toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Student Information Sheet</h1>
        <p className="text-on-surface-variant text-lg">Browse your instructor and enrolled classmates for this section.</p>
        {isLoading ? (
          <Skeleton className="h-6 w-56 mt-1" />
        ) : (
          <p className="text-on-surface-variant text-lg">
            {classData?.name ?? "—"} · {classData?.subject ?? "—"}
          </p>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-surface-container-lowest/60 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
        <div className="relative w-full sm:w-96 flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <Input
            type="text"
            placeholder="Search classmates by name, email, or major..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container pl-12 pr-4 py-3 h-12 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-lg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {/* Section 1: Instructor */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            Instructor
          </h2>

          {isLoading ? (
            <Card className="border-outline-variant/30 shadow-sm bg-surface-container-lowest w-full md:w-1/2 lg:w-1/3">
              <CardContent className="p-5 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-20 mt-1" />
                </div>
              </CardContent>
            </Card>
          ) : instructor ? (
            <Card 
              className="border-outline-variant/30 shadow-sm bg-surface-container-lowest hover:shadow-md transition-all duration-300 w-full md:w-1/2 lg:w-1/3 cursor-pointer"
              onClick={() => router.push(`/student/users/${instructor.id}`)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <UserAvatar name={instructor.name} avatarUrl={instructor.avatarUrl} size="lg" />
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-on-surface truncate">{instructor.name}</h3>
                  <p className="text-sm text-on-surface-variant truncate">{instructor.email}</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-primary-container text-on-primary-container font-medium hover:bg-primary-container">
                      Instructor
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-on-surface-variant text-sm">No instructor assigned.</p>
          )}
        </section>

        {/* Section 2: Peers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
            Enrolled Students
            </h2>
            {!isLoading && (
              <Badge variant="outline" className="text-on-surface-variant border-outline-variant/50">
                {members.length} Student{members.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-outline-variant/30 shadow-sm bg-surface-container-lowest">
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex flex-col w-full gap-2">
                      <Skeleton className="h-4 w-28 mx-auto" />
                      <Skeleton className="h-3 w-36 mx-auto" />
                    </div>
                    <Skeleton className="h-5 w-24 mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPeers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPeers.map((membership) => (
                <Card
                  key={membership.id}
                  className="border-outline-variant/30 shadow-sm bg-surface-container-lowest hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/student/users/${membership.student.id}`)}
                >
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <UserAvatar name={membership.student.name} avatarUrl={membership.student.avatarUrl} size="lg" />
                    <div className="flex flex-col w-full min-w-0">
                      <h3 className="font-bold text-base text-on-surface truncate">{membership.student.name}</h3>
                      <p className="text-sm text-on-surface-variant truncate">{membership.student.email}</p>
                    </div>
                    <Badge variant="outline" className="mt-1 font-normal bg-surface-container text-on-surface-variant border-outline-variant/30">
                      {membership.student.department ?? "No major listed"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            // Search returned no results
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest/30 rounded-2xl border border-outline-variant/20 border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-50">
                person_search
              </span>
              <h3 className="text-xl font-bold text-on-surface mb-2">No classmates found</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                No students matched your search criteria &quot;{searchQuery}&quot;.
              </p>
            </div>
          ) : (
            // No students enrolled at all
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest/30 rounded-2xl border border-outline-variant/20 border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-50">
                group_off
              </span>
              <h3 className="text-xl font-bold text-on-surface mb-2">No other students enrolled yet</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                You are currently the only student in this class. Invite your peers using the class code!
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
