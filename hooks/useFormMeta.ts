import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Batch } from "@/lib/formConfig";

export interface UseFormMetaParams {
  isOpen?: boolean;
  preferMlBatches?: boolean;
  propBatches?: Batch[];
}

export function useFormMeta({ isOpen, preferMlBatches = true, propBatches }: UseFormMetaParams) {
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string; status?: number }[]>([]);
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiFetch("/courses");
        const data = res?.data ?? res;
        const sortedCourses = [...data].sort((a: any, b: any) => b.id - a.id);
        setCourses(sortedCourses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };

    const fetchSubjects = async () => {
      try {
        const res = await apiFetch("/subjects");
        const data = res?.data ?? res;
        const sortedSubjects = [...data].sort((a: any, b: any) => b.id - a.id);
        setSubjects(sortedSubjects);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await apiFetch("/employees");
        const data = res?.data ?? res;
        const active = data.filter((emp: any) => emp.status === 1);
        setEmployees(active);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    fetchCourses();
    fetchSubjects();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchMlBatches = async () => {
      try {
        const res = await apiFetch("/batch");
        const data = res?.data ?? res;
        const sortedAllBatches = [...data].sort((a: Batch, b: Batch) => b.batchid - a.batchid);

        let mlOnly = sortedAllBatches;
        if (preferMlBatches) {
          mlOnly = sortedAllBatches.filter((batch) => {
            const subject = batch.subject?.toLowerCase();
            return (
              subject === "ml" ||
              subject === "machine learning" ||
              subject === "machinelearning" ||
              subject?.includes("ml")
            );
          });
          if (mlOnly.length === 0) mlOnly = sortedAllBatches.filter((b) => b.courseid === 3);
          if (mlOnly.length === 0) mlOnly = sortedAllBatches;
        }

        setMlBatches(mlOnly);
      } catch (error) {
        console.error("Failed to load batches:", error);
      }
    };

    if (isOpen && (!propBatches || propBatches.length === 0)) {
      fetchMlBatches();
    } else if (propBatches && propBatches.length > 0) {
      let mlOnly = propBatches;
      if (preferMlBatches) {
        mlOnly = propBatches.filter((batch) => {
          const subject = batch.subject?.toLowerCase();
          return (
            subject === "ml" ||
            subject === "machine learning" ||
            subject === "machinelearning" ||
            subject?.includes("ml")
          );
        });
        if (mlOnly.length === 0) mlOnly = propBatches.filter((b) => b.courseid === 3);
        if (mlOnly.length === 0) mlOnly = propBatches;
      }
      setMlBatches(mlOnly);
    }
  }, [isOpen, propBatches, preferMlBatches]);

  return { courses, subjects, employees, mlBatches };
}


