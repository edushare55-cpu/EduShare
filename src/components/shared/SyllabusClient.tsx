"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Download,
  FileText,
  Paperclip,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useFileUpload } from "@/hooks/use-file-upload";
import { LoadingButton } from "@/components/shared/LoadingButton";

type CourseMaterial = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

type SyllabusData = {
  id: string;
  name: string;
  subject: string;
  syllabusOverview: string | null;
  learningOutcomes: string | null;
  gradingPolicy: string | null;
  weeklySchedule: string | null;
  materials: CourseMaterial[];
};

type SyllabusFields = Pick<
  SyllabusData,
  "syllabusOverview" | "learningOutcomes" | "gradingPolicy" | "weeklySchedule"
>;

const emptyFields: SyllabusFields = {
  syllabusOverview: "",
  learningOutcomes: "",
  gradingPolicy: "",
  weeklySchedule: "",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SyllabusClient({
  classId,
  role,
}: {
  classId: string;
  role: "FACULTY" | "STUDENT";
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<SyllabusFields>(emptyFields);
  const isFaculty = role === "FACULTY";
  const { upload, isUploading } = useFileUpload({
    bucket: "post-files",
    folder: `${classId}/materials`,
    maxSizeMB: 50,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["classes", classId, "syllabus"],
    queryFn: () =>
      apiClient.get<SyllabusData>(`/api/classes/${classId}/syllabus`),
  });

  useEffect(() => {
    if (!data) return;
    setFields({
      syllabusOverview: data.syllabusOverview ?? "",
      learningOutcomes: data.learningOutcomes ?? "",
      gradingPolicy: data.gradingPolicy ?? "",
      weeklySchedule: data.weeklySchedule ?? "",
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (values: SyllabusFields) =>
      apiClient.patch<SyllabusData>(`/api/classes/${classId}/syllabus`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId, "syllabus"],
      });
      toast.success("Syllabus saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addMaterialMutation = useMutation({
    mutationFn: (material: {
      title: string;
      fileName: string;
      fileUrl: string;
      fileKey: string;
      fileType: string;
      fileSize: number;
    }) =>
      apiClient.post<CourseMaterial>(
        `/api/classes/${classId}/materials`,
        material,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId, "syllabus"],
      });
      toast.success("File attached to course materials.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      const result = await upload(file);
      if (!result) {
        toast.error(`Could not upload ${file.name}.`);
        continue;
      }
      const title =
        file.name.replace(/\.[^.]+$/, "").slice(0, 120) ||
        file.name.slice(0, 120);
      await addMaterialMutation.mutateAsync({
        title,
        fileName: file.name,
        fileUrl: result.url,
        fileKey: result.path,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
    }
    event.target.value = "";
  };

  const updateField = (key: keyof SyllabusFields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  if (isLoading)
    return (
      <div className="mx-auto max-w-5xl p-8 text-on-surface-variant">
        Loading syllabus…
      </div>
    );
  if (isError || !data)
    return (
      <div className="mx-auto max-w-5xl p-8 text-error">
        Could not load this course syllabus.
      </div>
    );

  const sections: {
    key: keyof SyllabusFields;
    title: string;
    hint: string;
    rows: number;
  }[] = [
    {
      key: "syllabusOverview",
      title: "Course overview",
      hint: "Course description, scope, and what students will learn.",
      rows: 5,
    },
    {
      key: "learningOutcomes",
      title: "Learning outcomes",
      hint: "List the skills or outcomes students should achieve.",
      rows: 4,
    },
    {
      key: "gradingPolicy",
      title: "Grading and policies",
      hint: "Explain grading weights, late work, and class expectations.",
      rows: 4,
    },
    {
      key: "weeklySchedule",
      title: "Course schedule",
      hint: "Add weekly topics, activities, readings, or important dates.",
      rows: 6,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Course guide
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">
            Syllabus
          </h2>
          <p className="mt-1 text-on-surface-variant">
            {data.name} · {data.subject}
          </p>
        </div>
        {isFaculty && (
          <LoadingButton
            variant="primary"
            isLoading={saveMutation.isPending}
            loadingText="Saving…"
            disabled={isUploading || addMaterialMutation.isPending}
            onClick={() => saveMutation.mutate(fields)}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Save syllabus
          </LoadingButton>
        )}
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.key}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm"
          >
            <label
              htmlFor={section.key}
              className="block text-lg font-semibold text-on-surface"
            >
              {section.title}
            </label>
            <p className="mb-3 mt-1 text-sm text-on-surface-variant">
              {section.hint}
            </p>
            {isFaculty ? (
              <textarea
                id={section.key}
                rows={section.rows}
                value={fields[section.key] ?? ""}
                onChange={(event) =>
                  updateField(section.key, event.target.value)
                }
                className="w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={`Add ${section.title.toLowerCase()}…`}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-7 text-on-surface">
                {data[section.key]?.trim() || (
                  <span className="italic text-on-surface-variant">
                    Your instructor has not added this section yet.
                  </span>
                )}
              </p>
            )}
          </section>
        ))}

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                <Paperclip className="h-5 w-5 text-primary" /> Syllabus and
                course files
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Attach the official syllabus, readings, or other class
                resources.
              </p>
            </div>
            {isFaculty && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                  aria-label="Upload syllabus or course files"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || addMaterialMutation.isPending}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container px-4 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading || addMaterialMutation.isPending
                    ? "Uploading…"
                    : "Attach file"}
                </button>
              </>
            )}
          </div>
          {data.materials.length ? (
            <ul className="mt-5 divide-y divide-outline-variant/30">
              {data.materials.map((material) => (
                <li
                  key={material.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface">
                        {material.title}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {material.fileName} · {formatSize(material.fileSize)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> Open file
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
              No syllabus or course files have been attached yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
