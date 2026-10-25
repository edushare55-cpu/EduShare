"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SpeedGraderLayout } from "@/components/faculty/grading/speed-grader-layout";
import { Button } from "@/components/ui/button";
import { useNeedsGrading, useReviewSubmission } from "@/hooks/use-submissions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export default function GradingPage() {
  const params = useParams();
  const classId = params.classId as string;
  const type = params.type as string; // 'assignment' or 'assessment'
  const id = params.id as string; // Submission ID or AssessmentAttempt ID
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useNeedsGrading(classId);
  const { mutate: reviewSubmission, isPending: isReviewing } = useReviewSubmission();

  const [manualScore, setManualScore] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [answerScores, setAnswerScores] = useState<Record<string, string>>({});
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [isFileDownloading, setIsFileDownloading] = useState(false);

  const handleFileDownload = async (fileUrl: string, fileName: string) => {
    if (isFileDownloading) return;
    setIsFileDownloading(true);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = fileName || "submission";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download file.");
    } finally {
      setIsFileDownloading(false);
    }
  };

  const currentIndex = queue.findIndex(item => item.id === id && item.type.toLowerCase() === type);
  const currentItem = queue[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    if (type === "assignment") {
      setManualScore(currentItem.details.score === null || currentItem.details.score === undefined
        ? ""
        : String(currentItem.details.score));
      setFeedback(currentItem.details.feedback ?? "");
    } else {
      setAnswerScores(Object.fromEntries(
        (currentItem.details.answers ?? []).map((answer: any) => [answer.id, ""])
      ));
    }
  }, [currentItem, type]);

  const hasNext = currentIndex < queue.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      const next = queue[currentIndex + 1];
      router.push(`/faculty/classes/${classId}/grading/${next.type.toLowerCase()}/${next.id}`);
      setManualScore("");
      setFeedback("");
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      const prev = queue[currentIndex - 1];
      router.push(`/faculty/classes/${classId}/grading/${prev.type.toLowerCase()}/${prev.id}`);
      setManualScore("");
      setFeedback("");
    }
  };

  const handleSubmitGrade = async () => {
    if (type === "assignment") {
      const score = Number(manualScore);
      if (manualScore.trim() === "" || !Number.isFinite(score) || score < 0 || score > 100) {
        toast.error("Enter a score from 0 to 100 before saving.");
        return;
      }
      reviewSubmission({ submissionId: id, postId: currentItem.entityId, score, feedback: feedback.trim() }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["needs-grading", classId] });
          if (hasNext) handleNext();
          else router.push(`/faculty/classes/${classId}/submissions`);
        }
      });
    } else {
      const answers = currentItem.details.answers ?? [];
      const grades = answers.map((answer: any) => ({
        answer,
        scoreText: answerScores[answer.id] ?? "",
      }));
      const incomplete = grades.find(({ scoreText }) => scoreText.trim() === "");
      if (incomplete) {
        toast.error("Enter a score for every short-answer question.");
        return;
      }
      for (const { answer, scoreText } of grades) {
        const pointsEarned = Number(scoreText);
        if (!Number.isFinite(pointsEarned) || pointsEarned < 0 || pointsEarned > answer.question.points) {
          toast.error(`Scores must be between 0 and ${answer.question.points} for each question.`);
          return;
        }
      }
      setIsSavingAssessment(true);
      try {
        for (const { answer, scoreText } of grades) {
          const pointsEarned = Number(scoreText);
          await apiClient.patch(`/api/assessments/${currentItem.entityId}/grade`, {
            studentAnswerId: answer.id,
            isCorrect: pointsEarned >= answer.question.points,
            pointsEarned,
          });
        }
        await queryClient.invalidateQueries({ queryKey: ["needs-grading", classId] });
        toast.success("Assessment scores saved.");
        if (hasNext) handleNext();
        else router.push(`/faculty/classes/${classId}/submissions`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save assessment scores.");
      } finally {
        setIsSavingAssessment(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-surface-container-lowest">
        <div className="space-y-4 w-96 text-center">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-surface-container-lowest">
        <AlertCircle className="w-12 h-12 text-outline-variant mb-4" />
        <h2 className="text-xl font-semibold text-on-surface">Submission not found</h2>
        <p className="text-on-surface-variant text-sm mt-1">This item may have already been graded or does not exist.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push(`/faculty/classes/${classId}/submissions`)}>
          Return to Queue
        </Button>
      </div>
    );
  }

  const renderLeftPane = () => {
    if (type === "assignment") {
      const fileUrl = currentItem.details.fileUrl;
      if (!fileUrl) {
        return (
          <div className="h-full flex items-center justify-center text-on-surface-variant bg-surface-container-lowest">
            No file was attached to this submission.
          </div>
        );
      }
      return (
        <div className="flex flex-col h-full w-full bg-surface-container-lowest">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">description</span>
              <span className="font-label-md text-on-surface truncate max-w-[300px]">
                {currentItem.details.fileName || "Student Submission"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleFileDownload(fileUrl, currentItem.details.fileName || "submission")}
              disabled={isFileDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
            >
              <span className={`material-symbols-outlined text-[18px] ${isFileDownloading ? "animate-spin" : ""}`}>
                {isFileDownloading ? "autorenew" : "download"}
              </span>
              {isFileDownloading ? "Downloading..." : "Download File"}
            </button>
          </div>
          {/* Only render iframe for previewable files (PDF, images) to prevent auto-download of .docx files */}
          {currentItem.details.fileName && ["pdf", "jpg", "jpeg", "png", "gif"].includes(currentItem.details.fileName.split('.').pop()?.toLowerCase() || "") ? (
            <iframe 
              src={fileUrl} 
              className="w-full flex-1 border-none bg-white"
              title="Student Submission"
            />
          ) : (
            <div className="w-full flex-1 flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface-variant p-8 text-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">draft</span>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Preview Not Available</h3>
              <p className="max-w-md">
                This file format cannot be previewed directly in the browser. Please use the Download button above to view the student's submission natively on your device.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (type === "assessment") {
      return (
        <div className="p-8 max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-on-surface border-b border-outline-variant/30 pb-4">
            Pending Short Answers
          </h2>
          {currentItem.details.answers.map((answer: any, idx: number) => (
            <div key={answer.id} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-4 w-full">
                  <div>
                    <h4 className="font-medium text-on-surface">{answer.question.questionText}</h4>
                    <span className="text-xs text-on-surface-variant">{answer.question.points} Points Possible</span>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 relative">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider absolute -top-2.5 left-3 bg-surface-container-lowest px-1">
                      Student's Answer
                    </span>
                    <p className="text-on-surface text-sm mt-1 whitespace-pre-wrap">{answer.textAnswer || <span className="text-on-surface-variant/50 italic">No answer provided</span>}</p>
                  </div>
                  {answer.question.explanation && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h5 className="text-xs font-bold text-green-800 mb-1">Expected Answer / Rubric</h5>
                      <p className="text-sm text-green-700">{answer.question.explanation}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <label htmlFor={`answer-score-${answer.id}`} className="text-sm font-semibold text-on-surface">
                      Points earned
                    </label>
                    <input
                      id={`answer-score-${answer.id}`}
                      type="number"
                      min="0"
                      max={answer.question.points}
                      step="0.1"
                      value={answerScores[answer.id] ?? ""}
                      onChange={(event) => setAnswerScores((current) => ({
                        ...current,
                        [answer.id]: event.target.value,
                      }))}
                      placeholder={`0–${answer.question.points}`}
                      className="w-28 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-sm text-on-surface-variant">/ {answer.question.points}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderRightPane = () => {
    return (
      <div className="h-full flex flex-col bg-surface-container-lowest">
        <div className="p-6 border-b border-outline-variant/30">
          <h3 className="text-lg font-bold text-on-surface">Evaluation</h3>
          <p className="text-sm text-on-surface-variant">Provide feedback and score.</p>
        </div>
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {type === "assignment" ? (
            <>
              <div className="space-y-3">
                <label htmlFor="assignment-score" className="text-sm font-semibold text-on-surface">Assignment score</label>
                <div className="flex items-center gap-3">
                  <input
                    id="assignment-score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={manualScore}
                    onChange={(event) => setManualScore(event.target.value)}
                    placeholder="0–100"
                    className="w-28 rounded-xl border border-outline-variant/50 bg-surface-container p-3 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface-variant">/ 100 points</span>
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="assignment-feedback" className="text-sm font-semibold text-on-surface">Feedback for student</label>
                <textarea
                  id="assignment-feedback"
                  rows={6}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  maxLength={1000}
                  placeholder="Add feedback to help the student improve."
                  className="w-full resize-none rounded-xl border border-outline-variant/50 bg-surface-container p-4 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-on-surface-variant">
              Score each short-answer response in the work area. Partial credit is allowed up to the points shown for each question.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/30 bg-surface-container-low">
          <Button 
            className="w-full h-12 text-base gap-2 shadow-md"
            onClick={handleSubmitGrade}
            disabled={isReviewing || isSavingAssessment}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isReviewing || isSavingAssessment ? "Saving..." : (hasNext ? "Submit & Next" : "Submit & Finish")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <SpeedGraderLayout
      classId={classId}
      studentName={currentItem.student.name}
      entityTitle={currentItem.title}
      leftPaneContent={renderLeftPane()}
      rightPaneContent={renderRightPane()}
      onNext={handleNext}
      onPrev={handlePrev}
      hasNext={hasNext}
      hasPrev={hasPrev}
    />
  );
}
