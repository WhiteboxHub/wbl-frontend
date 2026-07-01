import { ComponentType } from "react";
import { ResumeData } from "@/types/resume";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ProfessionalTemplate } from "./ProfessionalTemplate";
import { CreativeTemplate } from "./CreativeTemplate";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { TechnicalTemplate } from "./TechnicalTemplate";
import { ElegantTemplate } from "./ElegantTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { SidebarTemplate } from "./SidebarTemplate";
import { BoldTemplate } from "./BoldTemplate";
import { AcademicTemplate } from "./AcademicTemplate";
import { StartupTemplate } from "./StartupTemplate";
import { TimelineTemplate } from "./TimelineTemplate";
import { AtsTemplate } from "./AtsTemplate";
// JSON Resume theme-inspired templates
import { JsonElegantTemplate } from "./JsonElegantTemplate";
import { JsonModernTemplate } from "./JsonModernTemplate";
import { JsonCoraTemplate } from "./JsonCoraTemplate";
import { JsonClassyTemplate } from "./JsonClassyTemplate";
import { JsonMinymaTemplate } from "./JsonMinymaTemplate";
import { JsonStraightforwardTemplate } from "./JsonStraightforwardTemplate";
import { JsonWaterfallTemplate } from "./JsonWaterfallTemplate";
import { JsonSceptileTemplate } from "./JsonSceptileTemplate";
import { JsonModernExtendedTemplate } from "./JsonModernExtendedTemplate";
import { JsonElephantTemplate } from "./JsonElephantTemplate";
import { JsonEliteTemplate } from "./JsonEliteTemplate";
import { JsonJupeTemplate } from "./JsonJupeTemplate";
import { JsonMsResumeTemplate } from "./JsonMsResumeTemplate";
import { JsonStackOverflowTemplate } from "./JsonStackOverflowTemplate";
import { JsonTanResponsiveTemplate } from "./JsonTanResponsiveTemplate";
import { JsonKendallTemplate } from "./JsonKendallTemplate";
import { JsonFlatTemplate } from "./JsonFlatTemplate";
import { JsonEvenTemplate } from "./JsonEvenTemplate";
import { JsonProfessionalTemplate } from "./JsonProfessionalTemplate";
import { JsonReactTemplate } from "./JsonReactTemplate";

const templateMap: Record<string, ComponentType<{ data: ResumeData }>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  executive: ExecutiveTemplate,
  technical: TechnicalTemplate,
  elegant: ElegantTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
  bold: BoldTemplate,
  academic: AcademicTemplate,
  startup: StartupTemplate,
  timeline: TimelineTemplate,
  ats: AtsTemplate,
  // JSON Resume theme-inspired templates
  "json-elegant": JsonElegantTemplate,
  "json-modern": JsonModernTemplate,
  "json-cora": JsonCoraTemplate,
  "json-classy": JsonClassyTemplate,
  "json-minyma": JsonMinymaTemplate,
  "json-straightforward": JsonStraightforwardTemplate,
  "json-waterfall": JsonWaterfallTemplate,
  "json-sceptile": JsonSceptileTemplate,
  "json-modern-extended": JsonModernExtendedTemplate,
  "json-elephant": JsonElephantTemplate,
  "json-elite": JsonEliteTemplate,
  "json-jupe": JsonJupeTemplate,
  "json-msresume": JsonMsResumeTemplate,
  "json-stackoverflow": JsonStackOverflowTemplate,
  "json-tan-responsive": JsonTanResponsiveTemplate,
  "json-kendall": JsonKendallTemplate,
  "json-flat": JsonFlatTemplate,
  "json-even": JsonEvenTemplate,
  "json-professional": JsonProfessionalTemplate,
  "json-react": JsonReactTemplate,
};

interface ResumeRendererProps {
  templateId: string;
  data: ResumeData;
  className?: string;
}

export function ResumeRenderer({ templateId, data, className = "" }: ResumeRendererProps) {
  const Template = templateMap[templateId] ?? ClassicTemplate;
  return (
    <div className={`resume-page shadow-lg relative bg-white ${className}`}>
      <Template data={data} />
    </div>
  );
}

export { templateMap };
