/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum VectorType {
  GEOMETRIC = 'Geométrico',
  RADIAL = 'Radial',
  ORGANIC = 'Orgánico',
  TYPOGRAPHIC = 'Tipográfico',
  MIXED = 'Mixto',
}

export enum Fidelity {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  SIMPLE = 'Simplificada',
}

export enum TypographyPreference {
  FIDELITY = 'Priorizar fidelidad (paths)',
  EDITABILITY = 'Priorizar editabilidad (text)',
}

export enum ColorPreference {
  KEEP_GRADIENTS = 'Mantener gradientes',
  SIMPLIFY = 'Simplificar colores',
}

export enum GeometryPreference {
  FORCE_MATHEMATICAL = 'Forzar estructura matemática',
  ALLOW_ORGANIC = 'Permitir formas orgánicas',
}

export interface AnalysisResult {
  compositionType: VectorType;
  structure: string;
  baseShapes: string;
  proportions: string;
  typography: {
    fontFamily: string;
    fontWeight: string;
    isCustom: boolean;
    details: string;
  };
  curves: string;
  colors: string[];
  colorMapping: Array<{ element: string; hex: string; role: 'background' | 'foreground' | 'accent' }>;
  hasGradients: boolean;
}

export interface GeometricSystem {
  system: {
    coordinates: string;
    center?: string;
    axesOrGrid: string;
  };
  distribution: {
    elementCount: number;
    spacing: string;
  };
  shapes: Array<{
    type: 'rect' | 'circle' | 'path';
    dimensions: string;
  }>;
  transformations: string;
}

export interface VectorizationState {
  image: string | null;
  step: number;
  analysis: AnalysisResult | null;
  geometricSystem: GeometricSystem | null;
  svgBase: string | null;
  svgFinal: string | null;
  svgRefined: string | null;
  settings: {
    fidelity: Fidelity;
    typography: TypographyPreference;
    color: ColorPreference;
    geometry: GeometryPreference;
    precisionMode: boolean;
  };
  progress: {
    analysis: 'idle' | 'loading' | 'done' | 'error';
    structure: 'idle' | 'loading' | 'done' | 'error';
    svgBase: 'idle' | 'loading' | 'done' | 'error';
    color: 'idle' | 'loading' | 'done' | 'error';
    refinement: 'idle' | 'loading' | 'done' | 'error';
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
