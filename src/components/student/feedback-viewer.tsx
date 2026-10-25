"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";

interface FeedbackViewerProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Using the normalized item from the feed
}

export function FeedbackViewer({ isOpen, onClose, item }: FeedbackViewerProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-surface-container-lowest border-outline-variant/30 p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-4 border-b border-outline-variant/30 bg-surface-container/30">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              item.type === 'ASSIGNMENT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {item.type === 'ASSIGNMENT' ? <FileText className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl text-on-surface">{item.title}</DialogTitle>
              <DialogDescription className="text-on-surface-variant flex items-center gap-2 mt-1">
                <span className="font-semibold text-primary">{item.type}</span>
                {item.score !== null && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-on-surface">Score: {item.score}%</span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            
            {item.type === "ASSIGNMENT" && item.feedback ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Instructor Feedback
                </h4>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{item.feedback}</p>
              </div>
            ) : null}

            {/* Assessment Detailed Answers */}
            {item.type === 'ASSESSMENT' && item.details?.answers && (
              <div className="space-y-4 mt-8">
                <h3 className="font-bold text-on-surface border-b border-outline-variant/30 pb-2">Question Breakdown</h3>
                {item.details.answers.map((answer: any, idx: number) => (
                  <div key={answer.id} className="bg-surface-container p-4 rounded-xl border border-outline-variant/30">
                    <p className="font-medium text-on-surface text-sm mb-3">
                      <span className="text-primary mr-2 font-bold">{idx + 1}.</span>
                      {answer.question.questionText}
                    </p>
                    
                    <div className="pl-6 space-y-3">
                      <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 relative">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase absolute -top-2 left-2 bg-surface-container-lowest px-1">
                          Your Answer
                        </span>
                        <p className="text-sm text-on-surface mt-1">
                          {answer.textAnswer || (answer.selectedChoiceIds.length > 0 ? "Multiple choice selection" : <span className="italic text-on-surface-variant/50">No answer</span>)}
                        </p>
                      </div>

                      {answer.question.explanation && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 relative">
                           <span className="text-[10px] font-bold text-green-700 uppercase absolute -top-2 left-2 bg-green-50 px-1">
                            Expected Answer / Rubric
                          </span>
                          <p className="text-sm text-green-800 mt-1">{answer.question.explanation}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          answer.isCorrect === true ? 'bg-green-100 text-green-700' : 
                          answer.isCorrect === false ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Incorrect' : 'Pending Review'}
                          {' '}({answer.pointsEarned} / {answer.question.points} pts)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assignment Attached File */}
            {item.type === 'ASSIGNMENT' && item.details?.fileUrl && (
              <div className="mt-6">
                 <h3 className="font-bold text-on-surface border-b border-outline-variant/30 pb-2 mb-4">Your Submission</h3>
                 <a 
                   href={item.details.fileUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/50 hover:bg-surface-container-high transition-colors bg-surface-container-lowest"
                 >
                   <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                     <FileText className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-medium text-sm text-on-surface truncate">{item.details.fileName || "View Attachment"}</p>
                     <p className="text-xs text-on-surface-variant">Click to view file</p>
                   </div>
                 </a>
              </div>
            )}
            
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
