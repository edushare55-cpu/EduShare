"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import type { AssessmentType } from "@/types";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { cn } from "@/lib/utils";

interface QuestionEditorProps {
  type:      AssessmentType;
  onSave:    (data: Record<string, unknown>) => void;
  onCancel:  () => void;
  isSaving?: boolean;
}

export default function QuestionEditor({ type, onSave, onCancel, isSaving }: QuestionEditorProps) {
  const [questionText, setQuestionText]   = useState("");
  const [points, setPoints]               = useState(1);
  const [explanation, setExplanation]     = useState("");

  // For MC / MS / TF choices
  const [choices, setChoices] = useState<{ choiceText: string; isCorrect: boolean }[]>(
    type === "TRUE_OR_FALSE"
      ? [{ choiceText: "True", isCorrect: true }, { choiceText: "False", isCorrect: false }]
      : [{ choiceText: "", isCorrect: false }, { choiceText: "", isCorrect: false }]
  );

  // For MATCHING
  const [pairs, setPairs] = useState<{ leftItem: string; rightItem: string }[]>([
    { leftItem: "", rightItem: "" },
    { leftItem: "", rightItem: "" },
  ]);

  // For SHORT_ANSWER — no extra fields needed

  const handleSave = () => {
    if (!questionText.trim()) return;

    const base = {
      type,
      questionText: questionText.trim(),
      points,
      explanation:  explanation.trim() || undefined,
    };

    if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT" || type === "TRUE_OR_FALSE") {
      onSave({
        ...base,
        choices: choices.map((c, i) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect, order: i })),
      });
    } else if (type === "MATCHING") {
      onSave({
        ...base,
        matchPairs: pairs.map((p, i) => ({ leftItem: p.leftItem, rightItem: p.rightItem, order: i })),
      });
    } else {
      onSave(base); // SHORT_ANSWER
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Question *</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                     bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30
                     focus:border-primary resize-none"
        />
      </div>

      {/* Points */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-on-surface-variant">Points</label>
        <input
          type="number"
          min={1} max={100}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/50 text-sm
                     bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30
                     focus:border-primary text-center"
        />
      </div>

      {/* Type-specific editors */}
      {(type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT") && (
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-2 block">
            Answer Choices
            {type === "MULTIPLE_CHOICE" && " — select one correct"}
            {type === "MULTIPLE_SELECT" && " — select all correct"}
          </label>
          <div className="space-y-2">
            {choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = choices.map((ch, idx) => ({
                      ...ch,
                      isCorrect: type === "MULTIPLE_CHOICE" ? idx === i : idx === i ? !ch.isCorrect : ch.isCorrect,
                    }));
                    setChoices(next);
                  }}
                  className={cn(
                    "shrink-0 w-4 h-4 rounded transition-colors",
                    c.isCorrect ? "text-green-600" : "text-on-surface-variant/40"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: c.isCorrect ? "'FILL' 1" : "'FILL' 0" }}>
                    {type === "MULTIPLE_CHOICE" ? "radio_button_checked" : "check_box"}
                  </span>
                </button>
                <input
                  value={c.choiceText}
                  onChange={(e) => setChoices(choices.map((ch, idx) => idx === i ? { ...ch, choiceText: e.target.value } : ch))}
                  placeholder={`Choice ${i + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-sm
                             bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {choices.length > 2 && (
                  <button onClick={() => setChoices(choices.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4 text-on-surface-variant hover:text-error transition-colors" />
                  </button>
                )}
              </div>
            ))}
            {choices.length < 6 && (
              <button
                type="button"
                onClick={() => setChoices([...choices, { choiceText: "", isCorrect: false }])}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <Plus className="w-3 h-3" /> Add choice
              </button>
            )}
          </div>
        </div>
      )}

      {type === "TRUE_OR_FALSE" && (
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Correct Answer</label>
          <div className="flex gap-3">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChoices(choices.map((ch, idx) => ({ ...ch, isCorrect: idx === i })))}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                  c.isCorrect
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                )}
              >
                {c.choiceText}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "MATCHING" && (
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Match Pairs</label>
          <div className="space-y-2">
            {pairs.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 items-center">
                <input
                  value={p.leftItem}
                  onChange={(e) => setPairs(pairs.map((pr, idx) => idx === i ? { ...pr, leftItem: e.target.value } : pr))}
                  placeholder="Left item"
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/50 text-sm
                             bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={p.rightItem}
                    onChange={(e) => setPairs(pairs.map((pr, idx) => idx === i ? { ...pr, rightItem: e.target.value } : pr))}
                    placeholder="Right item"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-sm
                               bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {pairs.length > 2 && (
                    <button onClick={() => setPairs(pairs.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4 text-on-surface-variant hover:text-error transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pairs.length < 10 && (
              <button
                type="button"
                onClick={() => setPairs([...pairs, { leftItem: "", rightItem: "" }])}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add pair
              </button>
            )}
          </div>
        </div>
      )}

      {type === "SHORT_ANSWER" && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
          Short answer questions require manual grading by the faculty.
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="text-xs font-semibold text-on-surface-variant mb-1 block">
          Explanation <span className="font-normal text-on-surface-variant/60">(shown after submission)</span>
        </label>
        <input
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Why is this the correct answer?"
          className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm
                     bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSave}
          disabled={!questionText.trim()}
          isLoading={isSaving ?? false}
          loadingText="Saving..."
          variant="primary"
        >
          Save Question
        </LoadingButton>
      </div>
    </div>
  );
}
