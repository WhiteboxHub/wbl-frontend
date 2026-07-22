import { ComponentType } from "react";
import { ResumeData } from "@/types/resume";
import { ClassicTemplate } from "./ClassicTemplate";
import { AcademicTemplate } from "./AcademicTemplate";
import { JsonClassyTemplate } from "./JsonClassyTemplate";
import { JsonElegantTemplate } from "./JsonElegantTemplate";
import { JsonEvenTemplate } from "./JsonEvenTemplate";
import { JsonFlatTemplate } from "./JsonFlatTemplate";
import { JsonProfessionalTemplate } from "./JsonProfessionalTemplate";
import { JsonStackOverflowTemplate } from "./JsonStackOverflowTemplate";
import { JsonStraightforwardTemplate } from "./JsonStraightforwardTemplate";
import { JsonWaterfallTemplate } from "./JsonWaterfallTemplate";
import { AtsTemplate } from "./AtsTemplate";

const templateMap: Record<string, ComponentType<{ data: ResumeData }>> = {
  academic: AcademicTemplate,
  classy: JsonClassyTemplate,
  elegant: JsonElegantTemplate,
  even: JsonEvenTemplate,
  flat: JsonFlatTemplate,
  lowmess: JsonFlatTemplate,
  macchiato: JsonElegantTemplate,
  "onepage-plus": JsonProfessionalTemplate,
  professional: JsonProfessionalTemplate,
  "ats-friendly": AtsTemplate,
  stackoverflow: JsonStackOverflowTemplate,
  stackoverflowed: JsonStackOverflowTemplate,
  straightforward: JsonStraightforwardTemplate,
  waterfall: JsonWaterfallTemplate,
};

interface ResumeRendererProps {
  templateId: string;
  data: ResumeData | null;
  className?: string;
}

export function ResumeRenderer({ templateId, data, className = "" }: ResumeRendererProps) {
  if (!data) return null;
  const Template = templateMap[templateId] ?? ClassicTemplate;
  return (
    <div className={`resume-page shadow-lg relative bg-white ${className}`}>
      <Template data={data} />
    </div>
  );
}

export { templateMap };
