"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle,
  AlertCircle, Send, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAttemptSession, useSaveAnswer, useSubmitAttempt } from "@/hooks/use-assessments";
import { useLesson } from "@/hooks/use-lessons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AttemptQuestion, StudentAnswer } from "@/types";

// ─── Timer Hook ───────────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number | null) {
  const [secs, setSecs] = useState(initialSeconds);

  useEffect(() => {
    if (!initialSeconds) return;
    setSecs(initialSeconds);
    const id = setInterval(() => setSecs((s) => (s !== null && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [initialSeconds]);

  return secs;
}

// ─── Question Renderer ────────────────────────────────────────────────────────

function QuestionRenderer({
  question,
  assessmentId,
  attemptId,
  savedAnswer,
  onAnswer,
}: {
  question:    AttemptQuestion;
  assessmentId: string;
  attemptId:   string;
  savedAnswer: StudentAnswer | null;
  onAnswer:    (questionId: string, data: Partial<StudentAnswer>) => void;
}) {
  const { mutate: saveAnswer } = useSaveAnswer(assessmentId, attemptId);

  const save = (data: { selectedChoiceIds?: string[]; matchAnswers?: any; textAnswer?: string }) => {
    saveAnswer({ questionId: question.id, ...data });
    onAnswer(question.id, data as Partial<StudentAnswer>);
  };

  if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_OR_FALSE") {
    const selected = savedAnswer?.selectedChoiceIds?.[0];
    return (
      <div className="space-y-3">
        {question.choices?.map((c) => (
          <button
            key={c.id}
            onClick={() => save({ selectedChoiceIds: [c.id] })}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium",
              selected === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low text-on-surface"
            )}
          >
            <span className={cn(
              "w-5 h-5 inline-flex items-center justify-center rounded-full border mr-3 shrink-0",
              selected === c.id ? "border-primary bg-primary" : "border-outline-variant"
            )}>
              {selected === c.id && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>
            {c.choiceText}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "MULTIPLE_SELECT") {
    const selected = new Set(savedAnswer?.selectedChoiceIds ?? []);
    return (
      <div className="space-y-3">
        <p className="text-xs text-on-surface-variant">Select all that apply</p>
        {question.choices?.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              const next = new Set(selected);
              next.has(c.id) ? next.delete(c.id) : next.add(c.id);
              save({ selectedChoiceIds: Array.from(next) });
            }}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium",
              selected.has(c.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 text-on-surface"
            )}
          >
            <span className={cn(
              "w-5 h-5 inline-flex items-center justify-center rounded mr-3 border shrink-0",
              selected.has(c.id) ? "border-primary bg-primary text-white" : "border-outline-variant"
            )}>
              {selected.has(c.id) && <CheckCircle className="w-3.5 h-3.5" />}
            </span>
            {c.choiceText}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "MATCHING") {
    const matchAnswers = (savedAnswer?.matchAnswers as any[]) ?? [];
    const getSelected = (leftItem: string) =>
      matchAnswers.find((a: any) => a.leftItem === leftItem)?.selectedRightItem ?? "";

    const updateMatch = (leftItem: string, selectedRightItem: string) => {
      const next = question.matchPairs?.map((p) => ({
        leftItem: p.leftItem,
        selectedRightItem: p.leftItem === leftItem ? selectedRightItem : getSelected(p.leftItem),
      })) ?? [];
      save({ matchAnswers: next });
    };

    return (
      <div className="space-y-3">
        {question.matchPairs?.map((pair) => (
          <div key={pair.id} className="grid grid-cols-2 gap-3 items-center">
            <div className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-sm font-medium text-on-surface">
              {pair.leftItem}
            </div>
            <select
              value={getSelected(pair.leftItem)}
              onChange={(e) => updateMatch(pair.leftItem, e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-outline-variant/40 text-sm bg-surface-container-lowest
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-on-surface"
            >
              <option value="">— Select —</option>
              {question.shuffledRightItems?.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "SHORT_ANSWER") {
    return (
      <textarea
        defaultValue={savedAnswer?.textAnswer ?? ""}
        onBlur={(e) => save({ textAnswer: e.target.value })}
        placeholder="Type your answer here..."
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 text-sm
                   bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30
                   focus:border-primary resize-none text-on-surface"
      />
    );
  }

  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentSessionPage() {
  const params        = useParams();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const classId       = params.classId  as string;
  const lessonId      = params.lessonId as string;
  const assessmentId  = params.assessmentId as string ?? "";
  const attemptId     = searchParams.get("attemptId") ?? "";

  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const derivedAssessmentId = searchParams.get("aId") ?? lesson?.assessment?.id ?? "";

  // Derive assessmentId from URL or Lesson
  const { data: session, isLoading } = useAttemptSession(
    derivedAssessmentId,
    attemptId
  );
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(
    session?.assessment?.id ?? ""
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const timeRemaining = useCountdown(session?.timeRemaining ?? null);

  // Auto-submit on time-up
  useEffect(() => {
    if (timeRemaining === 0 && session) {
      handleSubmit();
    }
  }, [timeRemaining]);

  const handleAnswer = useCallback((questionId: string, data: Partial<StudentAnswer>) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: data }));
  }, []);

  const handleSubmit = () => {
    if (!session) return;
    submitAttempt(attemptId, {
      onSuccess: (result) => {
        router.push(
          `/student/classes/${classId}/lessons/${lessonId}/results?attemptId=${attemptId}`
        );
      },
    });
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading || !session) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const question     = session.questions[currentIndex];
  const totalQ       = session.questions.length;
  const answeredCount = Object.keys(localAnswers).length +
    session.questions.filter((q) => q.currentAnswer).length;
  const isLast = currentIndex === totalQ - 1;

  const isAnswered = (q: AttemptQuestion) =>
    !!localAnswers[q.id] || !!q.currentAnswer;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/student/classes/${classId}/lessons/${lessonId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Exit
              </Button>
            </Link>
            <div>
              <p className="text-xs text-on-surface-variant">{session.assessment.title}</p>
              <p className="text-sm font-semibold text-on-surface">
                Question {currentIndex + 1} of {totalQ}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold",
                timeRemaining < 60
                  ? "bg-error/10 text-error animate-pulse"
                  : "bg-surface-container text-on-surface"
              )}>
                <Clock className="w-4 h-4" />
                {fmt(timeRemaining)}
              </div>
            )}
            <span className="text-xs text-on-surface-variant">
              {answeredCount}/{totalQ} answered
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-surface-container">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Navigator */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Questions
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {session.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                    i === currentIndex
                      ? "bg-primary text-on-primary"
                      : isAnswered(q)
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Question Panel */}
        <main className="col-span-1 lg:col-span-9">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            {/* Question header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold
                               flex items-center justify-center shrink-0">
                {currentIndex + 1}
              </span>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {question.type.replace("_", " ")} · {question.points} pt{question.points !== 1 ? "s" : ""}
              </span>
            </div>

            <p className="text-on-surface font-medium mb-6 leading-relaxed">
              {question.questionText}
            </p>

            <QuestionRenderer
              question={question}
              assessmentId={session.assessment.id}
              attemptId={attemptId}
              savedAnswer={
                (localAnswers[question.id] as StudentAnswer) ||
                question.currentAnswer ||
                null
              }
              onAnswer={handleAnswer}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            {isLast ? (
              confirmSubmit ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-on-surface-variant">Submit assessment?</p>
                  <Button variant="ghost" onClick={() => setConfirmSubmit(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-primary text-on-primary hover:opacity-90 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Confirm Submit"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmSubmit(true)}
                  className="bg-primary text-on-primary hover:opacity-90 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Assessment
                </Button>
              )
            ) : (
              <Button
                onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
