import type { ReactNode } from "react";

export type Subject = "物理" | "化学" | "生物";

export type ControlConfig =
  | {
      type: "slider";
      key: string;
      label: string;
      unit?: string;
      min: number;
      max: number;
      step: number;
    }
  | {
      type: "number";
      key: string;
      label: string;
      unit?: string;
      min: number;
      max: number;
      step: number;
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: Array<{ label: string; value: string }>;
    }
  | {
      type: "toggle";
      key: string;
      label: string;
    };

export type ExperimentParams = Record<string, number | string | boolean>;

export interface SimulationResult {
  readings: Array<{ label: string; value: string; tone?: "good" | "warn" | "info" }>;
  chart?: Array<{ x: number; y: number }>;
  status: string;
}

export interface VisualProps {
  params: ExperimentParams;
  result: SimulationResult;
  time: number;
}

export interface ExperimentModule {
  id: string;
  title: string;
  subject: Subject;
  summary: string;
  controls: ControlConfig[];
  defaults: ExperimentParams;
  simulate: (params: ExperimentParams, time: number) => SimulationResult;
  render: (props: VisualProps) => ReactNode;
}
