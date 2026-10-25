"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminCreateSectionModal from "./AdminCreateSectionModal";

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

interface Section {
  id: string;
  name: string;
  subject: string;
  classCode: string;
  createdAt: string;
  faculty: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    posts: number;
  };
}

interface AdminSectionsManagerProps {
  initialSections: Section[];
  facultyList: Faculty[];
}

export default function AdminSectionsManager({ initialSections, facultyList }: AdminSectionsManagerProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = sections.filter(
    (sec) =>
      sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionCreated = (newSection: Section) => {
    setSections([newSection, ...sections]);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search sections, subjects, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest pl-12 pr-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary text-on-primary hover:bg-primary/90 h-12 px-6 rounded-xl shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Assign New Section
        </Button>
      </div>

      <Card className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant/30 text-on-surface-variant font-label-md">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Section Name</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Subject</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Assigned Faculty</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">Students</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Code</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.length > 0 ? (
                filteredSections.map((sec) => (
                  <tr key={sec.id} className="border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">{sec.name}</div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        Created: {new Date(sec.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-on-surface">{sec.subject}</td>
                    <td className="p-4">
                      <div className="font-medium text-primary">{sec.faculty.name}</div>
                      <div className="text-xs text-on-surface-variant">{sec.faculty.email}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-secondary-container text-on-secondary-container font-medium rounded-full h-8 px-3">
                        {sec._count.members}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-surface-variant/50 text-on-surface-variant px-2 py-1 rounded border border-outline-variant/20 text-sm">
                        {sec.classCode}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                    <p>No sections found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AdminCreateSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facultyList={facultyList}
        onCreated={handleSectionCreated}
      />
    </div>
  );
}
