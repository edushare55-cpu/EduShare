"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, CheckSquare, Square, AlignLeft, Shuffle, X } from "lucide-react";
import type { Question, AssessmentType } from "@/types";
import { useCreateQuestion, useDeleteQuestion } from "@/hooks/use-assessments";
import { Button } from "@/components/ui/button";
import QuestionEditor from "./QuestionEditor";
import { cn } from "@/lib/utils";

interface AssessmentBuilderProps {
  assessmentId: string;
  questions:    Question[];
  onDone?:      () => void;
}

const TYPE_OPTIONS: { type: AssessmentType; label: string; icon: string; description: string }[] = [
  { type: "MULTIPLE_CHOICE",  label: "Multiple Choice", icon: "radio_button_checked",  description: "One correct answer" },
  { type: "MULTIPLE_SELECT",  label: "Multiple Select", icon: "check_box",             description: "One or more correct answers" },
  { type: "TRUE_OR_FALSE",    label: "True or False",   icon: "toggle_on",             description: "Binary question" },
  { type: "MATCHING",         label: "Matching",        icon: "compare_arrows",         description: "Match left items to right" },
  { type: "SHORT_ANSWER",     label: "Short Answer",    icon: "short_text",            description: "Written response (manual grading)" },
];

export default function AssessmentBuilder({ assessmentId, questions, onDone }: AssessmentBuilderProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editingType, setEditingType]       = useState<AssessmentType | null>(null);

  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion(assessmentId);
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion(assessmentId);

  const handleSelectType = (type: AssessmentType) => {
    setEditingType(type);
    setShowTypePicker(false);
  };

  const handleSaveQuestion = (data: Record<string, unknown>) => {
    createQuestion(
      { ...data, assessmentId, order: questions.length },
      { onSuccess: () => setEditingType(null) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Question list */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30
                         bg-surface-container-lowest group"
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold
                                 flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {TYPE_OPTIONS.find((t) => t.type === q.type)?.label}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface font-medium line-clamp-2">{q.questionText}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{q.points} pt{q.points !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => deleteQuestion(q.id)}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 text-on-surface-variant
                           hover:text-error transition-all p-1 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add question */}
      {editingType ? (
        <div className="border border-outline-variant/30 rounded-xl p-4 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-on-surface text-sm">
              {TYPE_OPTIONS.find((t) => t.type === editingType)?.label}
            </h4>
            <button onClick={() => setEditingType(null)} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-4 h-4" />
            </button>
          </div>
          <QuestionEditor
            type={editingType}
            onSave={handleSaveQuestion}
            onCancel={() => setEditingType(null)}
            isSaving={isCreating}
          />
        </div>
      ) : showTypePicker ? (
        <div className="border border-outline-variant/30 rounded-xl p-4 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-on-surface">Choose question type</p>
            <button onClick={() => setShowTypePicker(false)}>
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(({ type, label, icon, description }) => (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/30
                           hover:border-primary hover:bg-primary/5 text-left transition-all group"
              >
                <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-on-surface-variant">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed border-outline-variant/50 text-on-surface-variant
                     hover:border-primary hover:text-primary"
          onClick={() => setShowTypePicker(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      )}

      {onDone && (
        <div className="flex justify-end pt-2">
          <Button onClick={onDone} className="bg-primary text-on-primary hover:opacity-90">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
