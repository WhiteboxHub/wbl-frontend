'use client';

/**
 * TechnicalRadar Component
 * Specification: [Vishnu] Phase 6: Competency Radar Chart
 * 
 * Renders the candidate's engineering competency radar chart and dimension
 * breakdown using Recharts.
 */

import React, { useMemo } from 'react';
import { AssessmentDetails, ScoresBreakdown } from '@/types/aiprep';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Brain, Sparkles } from 'lucide-react';

export interface TechnicalRadarProps {
  assessment: AssessmentDetails;
  scoresBreakdown?: ScoresBreakdown;
}

export const TechnicalRadar: React.FC<TechnicalRadarProps> = ({
  assessment,
  scoresBreakdown: propScoresBreakdown,
}) => {
  const report = assessment?.report;
  const transcriptEval = report?.transcript_evaluation;
  const techAnalysis = transcriptEval?.technical_analysis;
  const scoresBreakdown: ScoresBreakdown =
    propScoresBreakdown || transcriptEval?.scores_breakdown || {};

  // Radar chart data for technical dimensions (excluding business acumen)
  const radarData = useMemo(() => {
    const items: { axis: string; score: number }[] = [];
    const labelMap: Record<string, string> = {
      ai_engineering: 'AI Engineering',
      core_engineering: 'Core Engineering',
      non_technical: 'Non Technical',
      llm: 'LLM & Prompting',
      rag: 'RAG & Retrieval',
      ml: 'Machine Learning',
      system_design: 'System Design',
      software_engineering: 'Software Engineering',
      code_quality: 'Code Quality',
      data: 'Data Engineering',
      devops: 'DevOps',
      ethics: 'AI Ethics',
    };

    Object.entries(scoresBreakdown).forEach(([key, val]) => {
      const lower = key.toLowerCase();
      if (lower.includes('business') || lower.includes('acumen') || lower.includes('biz')) return;
      if (val && typeof val.score === 'number' && val.score > 0) {
        items.push({
          axis: labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          score: Math.round(val.score),
        });
      }
    });

    return items;
  }, [scoresBreakdown]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Technical Radar & Dimension Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive mapping of engineering depth across evaluated competency dimensions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-4">
          {/* Chart */}
          <div className="lg:col-span-7 flex justify-center">
            {radarData.length >= 3 ? (
              <div className="w-full max-w-md h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Radar
                      name="Candidate Score"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Multiple technical dimensions required to plot radar chart.
              </div>
            )}
          </div>

          {/* Technical Summary */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                Engineering Depth Summary
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {techAnalysis?.summary ||
                  'Technical explanations reviewed for correctness, reasoning, and depth.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Technical Competencies Scored
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {radarData.map((d, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-semibold border border-purple-200/60 dark:border-purple-800/60"
                  >
                    {d.axis}: {d.score}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalRadar;
