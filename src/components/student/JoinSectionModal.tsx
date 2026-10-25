"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinClass } from "@/hooks/use-class";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface JoinSectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinSectionModal({ open, onOpenChange }: JoinSectionModalProps) {
  const [classCode, setClassCode] = useState("");
  const { mutate: joinClass, isPending } = useJoinClass();
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error("Please enter a section code.");
      return;
    }
    joinClass(classCode.toUpperCase(), {
      onSuccess: (joinedClass) => {
        onOpenChange(false);
        setClassCode("");
        router.push(`/student/classes/${joinedClass.id}/feed`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleJoin}>
          <DialogHeader>
            <DialogTitle>Join a Section</DialogTitle>
            <DialogDescription>
              Enter the section code provided by your instructor to join the class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="classCode">Section Code</Label>
              <Input
                id="classCode"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="e.g. AB12CD"
                className="uppercase"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Joining..." : "Join Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
