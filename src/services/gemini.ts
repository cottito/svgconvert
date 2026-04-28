import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  GeometricSystem, 
  VectorType, 
  Fidelity, 
  TypographyPreference, 
  ColorPreference, 
  GeometryPreference 
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class GeminiService {
  private static model = "gemini-3-flash-preview";

  static async analyzeImage(imageData: string): Promise<AnalysisResult> {
    const prompt = `Actúa como diseñador experto en sistemas gráficos, colorimetría y tipografía forense.
Analiza la imagen adjunta con precisión microscópica para su reconstrucción vectorial.

ENTREGA TÉCNICA (JSON):
1. compositionType: Clasificación experta.
2. structure: Retícula y ejes.
3. baseShapes: Primitivas geométricas.
4. proportions: Relaciones exactas.
5. typography: { "fontFamily": string, "fontWeight": string, "isCustom": boolean, "details": string }.
6. curves: Descripción técnica de curvas.
7. colors: Lista hex.
8. colorMapping: Array de { "element": string, "hex": string, "role": "background" | "foreground" | "accent" }.
9. hasGradients: boolean.`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compositionType: { type: Type.STRING },
            structure: { type: Type.STRING },
            baseShapes: { type: Type.STRING },
            proportions: { type: Type.STRING },
            typography: {
              type: Type.OBJECT,
              properties: {
                fontFamily: { type: Type.STRING },
                fontWeight: { type: Type.STRING },
                isCustom: { type: Type.BOOLEAN },
                details: { type: Type.STRING }
              },
              required: ["fontFamily", "fontWeight", "isCustom", "details"]
            },
            curves: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            colorMapping: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  role: { type: Type.STRING }
                },
                required: ["element", "hex", "role"]
              }
            },
            hasGradients: { type: Type.BOOLEAN }
          },
          required: ["compositionType", "structure", "baseShapes", "proportions", "typography", "curves", "colors", "colorMapping", "hasGradients"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const typeMap: Record<string, VectorType> = {
      'geométrica': VectorType.GEOMETRIC,
      'radial': VectorType.RADIAL,
      'orgánica': VectorType.ORGANIC,
      'tipográfica': VectorType.TYPOGRAPHIC,
      'mixta': VectorType.MIXED
    };

    return {
      ...result,
      compositionType: typeMap[result.compositionType] || VectorType.MIXED
    };
  }

  static async refineSVG(imageData: string, currentSVG: string, analysis: AnalysisResult): Promise<string> {
    const prompt = `Actúa como un Auditor de Calidad Visual.
Compara el SVG generado con la imagen original.
Detecta:
1. Desviaciones en el grosor de trazo.
2. Posiciones de nodos que no coinciden con el centro visual.
3. Desajustes en los stops del gradiente.
4. Kernign tipográfico incorrecto.

SVG ACTUAL:
${currentSVG}

INSTRUCCIONES:
Devuelve el código SVG CORREGIDO. 
- No cambies radicalmente la estructura si es correcta, solo ajusta parámetros.
- Si un color no es exacto, corrígelo según el análisis previo: ${JSON.stringify(analysis.colorMapping)}.
- Asegura que sea un SVG válido, completo y sin bloques de código markdown.`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
          ]
        }
      ]
    });

    return this.cleanSVG(response.text || '');
  }

  static async generateGeometricSystem(imageData: string, analysis: AnalysisResult): Promise<GeometricSystem> {
    const prompt = `Basado en el análisis previo, define un sistema de construcción geométrica de ALTA PRECISIÓN.

Análisis detallado: ${JSON.stringify(analysis)}

Instrucciones de fidelidad:
1. Identifica cada elemento tipográfico. Si el peso o estilo es único, descríbelo para su posterior conversión a paths.
2. Define las coordenadas exactas pensando en un sistema de diseño profesional (viewBox 0 0 1000 1000).
3. Para elementos radiales, define el centro exacto y los ángulos de rotación.

Entrega el resultado en JSON siguiendo este esquema:
{
  "system": {
    "coordinates": "viewBox 0 0 1000 1000",
    "center": "coordenadas del centro si existe",
    "axesOrGrid": "descripción de ejes o grid"
  },
  "distribution": {
    "elementCount": number,
    "separation": "separación angular o espacial exacta"
  },
  "shapes": [
    { "type": "rect" | "circle" | "path", "dimensions": "especificación matemática súper detallada (ej: r=250, cx=500, o coordenadas exactas de path)" }
  ],
  "transformations": "rotaciones exactas y posiciones relativas"
}

IMPORTANTE: No generes SVG, solo la lógica matemática de construcción.`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            system: {
              type: Type.OBJECT,
              properties: {
                coordinates: { type: Type.STRING },
                center: { type: Type.STRING },
                axesOrGrid: { type: Type.STRING }
              },
              required: ["coordinates", "axesOrGrid"]
            },
            distribution: {
              type: Type.OBJECT,
              properties: {
                elementCount: { type: Type.NUMBER },
                separation: { type: Type.STRING }
              },
              required: ["elementCount", "separation"]
            },
            shapes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  dimensions: { type: Type.STRING }
                },
                required: ["type", "dimensions"]
              }
            },
            transformations: { type: Type.STRING }
          },
          required: ["system", "distribution", "shapes", "transformations"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  static async generateSVGBase(imageData: string, system: GeometricSystem, settings: any): Promise<string> {
    const prompt = `Genera el código SVG (markup puro) basado EXACTAMENTE en la estructura definida con MÁXIMA FIDELIDAD VISUAL.

Estructura: ${JSON.stringify(system)}
Preferencia Tipográfica: ${settings.typography}

Reglas críticas de tipografía:
1. Si la preferencia es "Priorizar fidelidad (paths)", DEBES convertir cada letra en un elemento <path> que reproduzca exactamente la forma, peso y kernign observado en la imagen.
2. Si es <text>, usa fontFamily con fuentes genéricas coincidentes (Google Fonts) y ajusta fontWeight exacto.

Reglas de geometría:
- Mantener viewBox="0 0 1000 1000"
- Usar coordenadas absolutas.
- No suavizar curvas innecesariamente; mantén la intención original.
- Usar <rect> con rx para cápsulas geométricas.
- fill="none" stroke="black" (el color se aplicará después).

Salida: Solo el código SVG plano sin bloques de markdown. Sin explicaciones.`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
          ]
        }
      ]
    });

    return this.cleanSVG(response.text || '');
  }

  static async applyColor(imageData: string, svgBase: string, analysis: AnalysisResult): Promise<string> {
    const prompt = `Toma el SVG generado y aplica colores y gradientes con precisión quirúrgica.

SVG Base: ${svgBase}
Análisis de color: ${analysis.colors.join(', ')}

Instrucciones de Edición Pro:
1. Extrae los colores exactos. Usa nombres de ID semánticos para los gradientes (ej: id="grad_main_brand", id="grad_accent_glow").
2. Define los gradientes con <linearGradient> o <radialGradient> dentro de <defs>.
3. Asegura que los stops tengan el color y la opacidad (stop-opacity) detectados.
4. Si hay elementos tipográficos como <text>, asegúrate de que el fill sea el color exacto.
5. DEBES incluir xmlns="http://www.w3.org/2000/svg" en la etiqueta <svg>.
6. Mantén el código limpio para que un humano pueda editar los colores fácilmente en un editor de texto.

Salida: El código SVG final completo. No incluyas bloques de markdown.`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
          ]
        }
      ]
    });

    return this.cleanSVG(response.text || '');
  }

  private static cleanSVG(raw: string): string {
    // Remove markdown code blocks if present
    let cleaned = raw.replace(/```svg/gi, '').replace(/```/g, '').trim();
    
    // Find the first <svg and last </svg>
    const start = cleaned.indexOf('<svg');
    const end = cleaned.lastIndexOf('</svg>');
    
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 6);
    }

    // Ensure it has the xmlns attribute for compatibility
    if (cleaned.startsWith('<svg') && !cleaned.includes('xmlns=')) {
      cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return cleaned;
  }
}
