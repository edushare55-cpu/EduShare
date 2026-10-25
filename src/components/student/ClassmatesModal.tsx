"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { getClassmates } from "@/lib/actions/student";
import { Loader2 } from "lucide-react";

interface ClassmatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

type Classmate = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export default function ClassmatesModal({ isOpen, onClose, classId, className }: ClassmatesModalProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchClassmates = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getClassmates(classId);
        if (result.success && result.classmates) {
          setClassmates(result.classmates);
        } else {
          setError(result.error || "Failed to load classmates.");
        }
        setIsLoading(false);
      };
      fetchClassmates();
    } else {
      setClassmates([]);
      setError(null);
    }
  }, [isOpen, classId]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-level-3 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-outline-variant/30">
          <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-lowest">
            <div>
              <Dialog.Title className="text-xl font-headline-md text-on-surface">
                Class Roster
              </Dialog.Title>
              <Dialog.Description className="text-sm font-body-sm text-on-surface-variant mt-1">
                {className}
              </Dialog.Description>
            </div>
            <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </Dialog.Close>
          </div>

          <div className="p-0 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p className="font-label-md">Loading classmates...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-error font-body-md bg-error/5 m-4 rounded-xl border border-error/20">
                {error}
              </div>
            ) : classmates.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-body-md">
                No other students found in this section.
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {classmates.map((student) => (
                  <li key={student.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-lowest/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        student.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-label-md text-on-surface truncate">{student.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{student.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
