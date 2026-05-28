import React, { useState, useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Beaker,
  Atom,
  Thermometer,
  Scale,
  Droplet,
  Zap,
  Cloud,
  FlaskConical,
  AlertTriangle,
  Gauge,
  Hexagon,
  Waves,
  Shapes,
  Bookmark,
  Save,
  ArrowLeft,
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { predictProcess } from "@/lib/gemini";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type PropertyData = {
  title: string;
  value: string;
  icon: any;
};

type GcmGroup  = { name: string; count: number; delta: number };
type MethodData = { groups: GcmGroup[]; result: string };
type GcmRawData = { joback: MethodData; cg: MethodData; mg: MethodData };
type GcmCard    = { property: string; data: GcmRawData };

// ─── Constants ────────────────────────────────────────────────────────────────

const propertyIcons: Record<string, any> = {
  "Chemical Formula": Atom,
  "Molecular Weight": Scale,
  Density: Beaker,
  "Boiling Point": Thermometer,
  "Melting Point": Thermometer,
  Solubility: Droplet,
  "Molecular Structure": Shapes,
  Polarity: Zap,
  "Vapor Pressure": Cloud,
  Reactivity: FlaskConical,
  Toxicity: AlertTriangle,
  "Partial Pressure": Gauge,
  "Physical State": Hexagon,
  Stability: FlaskConical,
  "Critical Temperature": Thermometer,
  "Enthalpy of Formation": Zap,
  Viscosity: Waves,
  "Ionization Energy": Zap,
};

const GCM_CAPABLE_PROPERTIES = [
  "Boiling Point",
  "Melting Point",
  "Molecular Weight",
  "Density",
  "Vapor Pressure",
  "Critical Temperature",
  "Enthalpy of Formation",
  "Viscosity",
  "Ionization Energy",
];

// ─── Module-level cache ───────────────────────────────────────────────────────

let cachedSmiles = "";
let cachedProperties: PropertyData[] = [];
let cachedMainTitle = "";
let cachedGcmCache: Record<string, GcmCard> = {};
let cachedGcmLoadingMap: Record<string, boolean> = {};
let cachedGcmFailedMap: Record<string, boolean> = {};
let cachedOpenCalcKey: string | null = null;
let activeGcmAbortControllers: Record<string, AbortController> = {};

// ─── KaTeX helper ─────────────────────────────────────────────────────────────

function MathFormula({ latex, block = false }: { latex: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !latex) return;
    try { katex.render(latex, ref.current, { throwOnError: false, displayMode: block }); }
    catch { if (ref.current) ref.current.textContent = latex; }
  }, [latex, block]);
  return <span ref={ref} />;
}

// ─── Hardcoded formula definitions ────────────────────────────────────────────

type PropMethodDef = {
  label: string; accuracy: string;
  formula: string;        // KaTeX – general form
  deltaLabel: string;     // KaTeX – what each delta value represents
  buildSub: (g: GcmGroup[]) => string;  // KaTeX – substituted with numbers
  answerLabel: string;    // KaTeX – label before result value
};

const S = (g: GcmGroup[]) => g.length ? g.map(x => `(${x.count}{\\times}${x.delta})`).join('+') : '\\cdots';

const GCM_DEFS: Record<string, [PropMethodDef, PropMethodDef, PropMethodDef]> = {
  "Boiling Point": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"T_b=198.2+\\textstyle\\sum_i n_i\\Delta T_{b,i}", deltaLabel:"\\Delta T_{b,i}\\,(\\text{K})",         buildSub: g=>`T_b=198.2+${S(g)}`,              answerLabel:"T_b=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"\\ln T_b=\\textstyle\\sum_k N_kC_k^{(1)}",        deltaLabel:"C_k^{(1)}",                             buildSub: g=>`\\ln T_b=${S(g)}`,               answerLabel:"T_b=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"T_b=\\textstyle\\sum_j M_jG_j^{(1)}",             deltaLabel:"G_j^{(1)}\\,(\\text{K})",               buildSub: g=>`T_b=${S(g)}`,                    answerLabel:"T_b=" },
  ],
  "Melting Point": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"T_m=122.5+\\textstyle\\sum_i n_i\\Delta T_{m,i}", deltaLabel:"\\Delta T_{m,i}\\,(\\text{K})",         buildSub: g=>`T_m=122.5+${S(g)}`,              answerLabel:"T_m=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"\\ln T_m=\\textstyle\\sum_k N_kC_k^{(1)}",        deltaLabel:"C_k^{(1)}",                             buildSub: g=>`\\ln T_m=${S(g)}`,               answerLabel:"T_m=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"T_m=\\textstyle\\sum_j M_jG_j^{(1)}",             deltaLabel:"G_j^{(1)}\\,(\\text{K})",               buildSub: g=>`T_m=${S(g)}`,                    answerLabel:"T_m=" },
  ],
  "Molecular Weight": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"M_w=\\textstyle\\sum_i n_iM_i",                  deltaLabel:"M_i\\,(\\text{g/mol})",                 buildSub: g=>`M_w=${S(g)}`,                    answerLabel:"M_w=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"M_w=\\textstyle\\sum_k N_kM_k",                  deltaLabel:"M_k\\,(\\text{g/mol})",                 buildSub: g=>`M_w=${S(g)}`,                    answerLabel:"M_w=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"M_w=\\textstyle\\sum_j n_jA_j",                  deltaLabel:"A_j\\,(\\text{g/mol})",                 buildSub: g=>`M_w=${S(g)}`,                    answerLabel:"M_w=" },
  ],
  "Density": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"\\rho=\\dfrac{M_w}{V_b},\\quad V_b=\\textstyle\\sum_i n_i V_i", deltaLabel:"V_i\\,(\\text{cm}^3\\text{/mol})",   buildSub: g=>`V_b=${S(g)},\\quad \\rho=\\dfrac{M_w}{V_b}`, answerLabel:"\\rho=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"V_c=\\textstyle\\sum_k N_k C_k^{V}+17.5",                      deltaLabel:"C_k^{V}\\,(\\text{cm}^3\\text{/mol})", buildSub: g=>`V_c=${S(g)}+17.5`,                           answerLabel:"\\rho=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"\\rho=\\dfrac{M_w}{\\textstyle\\sum_j M_j G_j^{V}}",            deltaLabel:"G_j^{V}\\,(\\text{cm}^3\\text{/mol})", buildSub: g=>`\\rho=\\dfrac{M_w}{${S(g)}}`,                answerLabel:"\\rho=" },
  ],
  "Vapor Pressure": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"\\ln P^{sat}=A-B/T,\\;A=\\textstyle\\sum n_ia_i", deltaLabel:"a_i",                                   buildSub: g=>`A=${S(g)}`,                      answerLabel:"P^{sat}=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"\\ln P^{sat}=\\textstyle\\sum_k N_kC_k^P",        deltaLabel:"C_k^P",                                 buildSub: g=>`\\ln P^{sat}=${S(g)}`,           answerLabel:"P^{sat}=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"\\ln P^{sat}=\\textstyle\\sum_j M_jG_j^P",        deltaLabel:"G_j^P",                                 buildSub: g=>`\\ln P^{sat}=${S(g)}`,           answerLabel:"P^{sat}=" },
  ],
  "Critical Temperature": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"T_c=T_b[0.584+0.965\\Sigma-(\\Sigma)^2]^{-1},\\;\\Sigma=\\textstyle\\sum n_i\\Delta_{c,i}", deltaLabel:"\\Delta_{c,i}", buildSub: g=>`\\Sigma=${S(g)},\\;T_c=T_b[0.584+0.965\\Sigma-(\\Sigma)^2]^{-1}`, answerLabel:"T_c=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"T_c=181.128\\ln(\\textstyle\\sum_k N_kC_k^c)",    deltaLabel:"C_k^c",                                 buildSub: g=>`T_c=181.128\\ln(${S(g)})`,       answerLabel:"T_c=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"T_c=\\textstyle\\sum_j M_jG_j^c",                 deltaLabel:"G_j^c\\,(\\text{K})",                   buildSub: g=>`T_c=${S(g)}`,                    answerLabel:"T_c=" },
  ],
  "Enthalpy of Formation": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"\\Delta H_f^\\circ=68.29+\\textstyle\\sum_i n_i\\Delta H_{f,i}", deltaLabel:"\\Delta H_{f,i}\\,(\\text{kJ/mol})", buildSub: g=>`\\Delta H_f^\\circ=68.29+${S(g)}`, answerLabel:"\\Delta H_f^\\circ=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"\\Delta H_f^\\circ=\\textstyle\\sum_k N_kH_k^{(1)}", deltaLabel:"H_k^{(1)}\\,(\\text{kJ/mol})",       buildSub: g=>`\\Delta H_f^\\circ=${S(g)}`,     answerLabel:"\\Delta H_f^\\circ=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"\\Delta H_f^\\circ=\\textstyle\\sum_j M_jG_j^H",   deltaLabel:"G_j^H\\,(\\text{kJ/mol})",             buildSub: g=>`\\Delta H_f^\\circ=${S(g)}`,     answerLabel:"\\Delta H_f^\\circ=" },
  ],
  "Viscosity": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"\\ln\\eta=(\\textstyle\\sum_i n_ia_i-14.534)^2-6.432", deltaLabel:"a_i",                              buildSub: g=>`\\ln\\eta=(${S(g)}-14.534)^2-6.432`, answerLabel:"\\eta=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"\\ln\\eta=A+B/T,\\;A=\\textstyle\\sum N_kC_k^a",    deltaLabel:"C_k^a",                               buildSub: g=>`A=${S(g)}`,                      answerLabel:"\\eta=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"\\eta=f(\\textstyle\\sum_j M_jG_j^\\eta)",           deltaLabel:"G_j^\\eta",                           buildSub: g=>`\\eta=f(${S(g)})`,               answerLabel:"\\eta=" },
  ],
  "Ionization Energy": [
    { label:"GCM \u2014 Joback",            accuracy:"Estimated",     formula:"IE=IE_0+\\textstyle\\sum_i n_i\\Delta IE_i",       deltaLabel:"\\Delta IE_i\\,(\\text{eV})",            buildSub: g=>`IE=IE_0+${S(g)}`,                answerLabel:"IE=" },
    { label:"GCM \u2014 Constantinou-Gani", accuracy:"Improved",      formula:"IE=\\textstyle\\sum_k N_kC_k^{IE}",               deltaLabel:"C_k^{IE}\\,(\\text{eV})",               buildSub: g=>`IE=${S(g)}`,                     answerLabel:"IE=" },
    { label:"GCM \u2014 Marrero-Gani",      accuracy:"High accuracy", formula:"IE=\\textstyle\\sum_j M_jG_j^{IE}",               deltaLabel:"G_j^{IE}\\,(\\text{eV})",               buildSub: g=>`IE=${S(g)}`,                     answerLabel:"IE=" },
  ],
};

// What each "delta" means per property — used in the Gemini prompt so it returns correct numbers
const GCM_DELTA_HINTS: Record<string, { joback: string; cg: string; mg: string }> = {
  "Boiling Point":        { joback: "Joback ΔTb contribution (K) per functional group",                    cg: "CG first-order C_k^(1) boiling point coefficient",               mg: "MG first-order G_j^(1) value (K)" },
  "Melting Point":        { joback: "Joback ΔTm contribution (K) per functional group",                    cg: "CG first-order C_k^(1) melting point coefficient",               mg: "MG first-order G_j^(1) value (K)" },
  "Molecular Weight":     { joback: "atomic/group molar mass (g/mol), e.g. CH3=15.035",                    cg: "atomic/group molar mass (g/mol)",                                mg: "atomic/group molar mass (g/mol)" },
  "Density":              { joback: "Le Bas molar volume Vi (cm³/mol) per group, e.g. CH3=16.5",           cg: "CG volume contribution C_k^V (cm³/mol) per group",               mg: "MG volume contribution G_j^V (cm³/mol)" },
  "Vapor Pressure":       { joback: "Joback vapor pressure coefficient a_i per group (dimensionless)",     cg: "CG vapor pressure coefficient C_k^P per group",                  mg: "MG vapor pressure coefficient G_j^P" },
  "Critical Temperature": { joback: "Joback Δ_c,i critical temperature contribution (dimensionless)",      cg: "CG critical temperature coefficient C_k^c",                      mg: "MG critical temperature coefficient G_j^c (K)" },
  "Enthalpy of Formation":{ joback: "Joback ΔHf,i enthalpy contribution (kJ/mol) per group",              cg: "CG enthalpy coefficient H_k^(1) (kJ/mol) per group",             mg: "MG enthalpy coefficient G_j^H (kJ/mol)" },
  "Viscosity":            { joback: "Joback viscosity a_i coefficient per group (e.g. CH3≈2.76)",          cg: "CG viscosity coefficient C_k^a per group (e.g. CH3≈0.1)",        mg: "MG viscosity coefficient G_j^eta per group" },
  "Ionization Energy":    { joback: "Joback ionization energy contribution ΔIEi (eV) per group",           cg: "CG ionization energy coefficient C_k^IE (eV) per group",         mg: "MG ionization energy coefficient G_j^IE (eV)" },
};

const BADGE_CLS: Record<string, string> = {
  "Estimated":    "bg-blue-500/10 text-blue-600",
  "Improved":     "bg-violet-500/10 text-violet-600",
  "High accuracy":"bg-emerald-500/10 text-emerald-600",
};

// ─── GCM Calculation Panel ────────────────────────────────────────────────────

function GcmCalculationPanel({ data, loading, failed, onRetry, propTitle, allProperties }: {
  data: GcmCard | null; loading: boolean; failed: boolean; onRetry: () => void; propTitle: string; allProperties: PropertyData[];
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!loading) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    let loadingText = "organizing calculated steps....";
    if (seconds >= 14) {
      loadingText = "almost there...";
    } else if (seconds >= 7) {
      loadingText = "presenting steps....";
    }

    return (
      <div className="flex flex-col gap-2.5 py-5 px-1">
        <div className="flex items-center gap-3 text-primary text-xs font-semibold tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <motion.span
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {loadingText}
          </motion.span>
        </div>
        <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
          <motion.div 
            className="bg-primary h-full rounded-full"
            initial={{ width: "5%" }}
            animate={{ 
              width: seconds >= 14 ? "90%" : seconds >= 7 ? "60%" : "30%" 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const defs = GCM_DEFS[propTitle] ?? GCM_DEFS["Boiling Point"];
  const methods: [PropMethodDef, MethodData][] = [
    [defs[0], data.data.joback],
    [defs[1], data.data.cg],
    [defs[2], data.data.mg],
  ];

  // Derive substituted LaTeX for all GCM properties from their known result values
  const derivedSub = (() => {
    const find = (title: string) => allProperties.find(p => p.title === title)?.value ?? "";
    const parseNum = (v: string): number | null => {
      const m = v.match(/-?\d+\.?\d*/);
      return m ? parseFloat(m[0]) : null;
    };
    // Convert value string to Kelvin (handles "°C" and bare "K" values)
    const toK = (v: string): number | null => {
      const n = parseNum(v);
      if (n === null) return null;
      return v.includes("°C") ? n + 273.15 : n;
    };

    switch (propTitle) {
      case "Density": {
        const mw = parseNum(find("Molecular Weight"));
        const rho = parseNum(find("Density"));
        if (!mw || !rho) return null;
        const vb = (mw / rho).toFixed(2);
        return [
          `V_b=\\dfrac{${mw}}{${rho}},\\quad\\rho=\\dfrac{${mw}}{${vb}}`,
          `V_c=${vb}+17.5`,
          `\\rho=\\dfrac{${mw}}{${vb}}`,
        ] as [string, string, string];
      }
      case "Boiling Point": {
        const tbK = toK(find("Boiling Point"));
        if (!tbK) return null;
        const sigma = (tbK - 198.2).toFixed(2);
        const lnTb = Math.log(tbK).toFixed(3);
        return [
          `T_b=198.2+${sigma}`,
          `\\ln T_b=${lnTb}`,
          `T_b=${tbK.toFixed(1)}\\,\\text{K}`,
        ] as [string, string, string];
      }
      case "Melting Point": {
        const tmK = toK(find("Melting Point"));
        if (!tmK) return null;
        const sigma = (tmK - 122.5).toFixed(2);
        const lnTm = Math.log(tmK).toFixed(3);
        return [
          `T_m=122.5+${sigma}`,
          `\\ln T_m=${lnTm}`,
          `T_m=${tmK.toFixed(1)}\\,\\text{K}`,
        ] as [string, string, string];
      }
      case "Vapor Pressure": {
        const pv = parseNum(find("Vapor Pressure"));
        if (!pv) return null;
        const lnP = Math.log(pv).toFixed(3);
        return [
          `A=${lnP},\\;\\ln P^{sat}=A-B/T`,
          `\\ln P^{sat}=${lnP}`,
          `\\ln P^{sat}=${lnP}`,
        ] as [string, string, string];
      }
      case "Critical Temperature": {
        const tcK = toK(find("Critical Temperature"));
        const tbK = toK(find("Boiling Point"));
        if (!tcK) return null;
        const cgArg = Math.exp(tcK / 181.128).toFixed(4);
        const jobackStr = tbK
          ? `T_c=${tbK.toFixed(1)}[0.584+0.965\\Sigma-\\Sigma^2]^{-1}=${tcK.toFixed(1)}\\,\\text{K}`
          : `T_c=${tcK.toFixed(1)}\\,\\text{K}`;
        return [
          jobackStr,
          `T_c=181.128\\ln(${cgArg})=${tcK.toFixed(1)}\\,\\text{K}`,
          `T_c=${tcK.toFixed(1)}\\,\\text{K}`,
        ] as [string, string, string];
      }
      case "Enthalpy of Formation": {
        const hf = parseNum(find("Enthalpy of Formation"));
        if (hf === null) return null;
        const sigma = (hf - 68.29).toFixed(2);
        return [
          `\\Delta H_f^\\circ=68.29+(${sigma})`,
          `\\Delta H_f^\\circ=${hf}\\,\\text{kJ/mol}`,
          `\\Delta H_f^\\circ=${hf}\\,\\text{kJ/mol}`,
        ] as [string, string, string];
      }
      case "Viscosity": {
        const eta = parseNum(find("Viscosity"));
        if (!eta) return null;
        const lnEta = Math.log(eta).toFixed(3);
        return [
          `\\ln\\eta=${lnEta},\\;\\eta=${eta}\\,\\text{cP}`,
          `A=${lnEta},\\;\\ln\\eta=A+B/T`,
          `\\eta=f(${eta}\\,\\text{cP})`,
        ] as [string, string, string];
      }
      case "Ionization Energy": {
        const ie = parseNum(find("Ionization Energy"));
        if (!ie) return null;
        return [
          `IE=IE_0+(${ie})`,
          `IE=${ie}\\,\\text{eV}`,
          `IE=${ie}\\,\\text{eV}`,
        ] as [string, string, string];
      }
      default:
        return null;
    }
  })();

  const isFallback = methods.every(([, md]) => md.groups.length === 0);

  return (
    <div className="space-y-5 pt-3">
      {isFallback && (
        <div className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold uppercase tracking-wide">Fallback output — </span>
            group data could not be retrieved from AI. Values below are estimated from known property values.
            Please <span className="font-semibold">retry after some time</span> to get the correct output with groups.
          </span>
        </div>
      )}
      {methods.map(([def, md], i) => {
        // Always compute a substituted latex:
        // — when groups returned by AI: build from actual group data
        // — when no groups (fallback): use the hardcoded derivedSub from property values
        const subLatex = md.groups.length > 0
          ? def.buildSub(md.groups)
          : (derivedSub ? derivedSub[i] : null);

        return (
        <div key={i} className="space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">{def.label}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_CLS[def.accuracy] ?? "bg-primary/10 text-primary"}`}>{def.accuracy}</span>
          </div>

          {/* Given groups table — or hardcoded substituted values when groups unavailable */}
          {md.groups.length > 0 ? (
            <div className="bg-primary/5 rounded-lg p-2 text-[11px]">
              <p className="font-semibold text-foreground/60 mb-1 uppercase tracking-wide text-[9px]">Given</p>
              <table className="w-full">
                <thead><tr className="text-foreground/50">
                  <th className="text-left font-medium pb-0.5">Group</th>
                  <th className="text-center font-medium pb-0.5">n</th>
                  <th className="text-right font-medium pb-0.5"><MathFormula latex={def.deltaLabel} /></th>
                </tr></thead>
                <tbody>{md.groups.map((g, gi) => (
                  <tr key={gi} className="text-foreground/80">
                    <td className="text-left font-mono">{g.name}</td>
                    <td className="text-center">{g.count}</td>
                    <td className="text-right">{g.delta}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : derivedSub ? (
            <div className="bg-primary/5 rounded-lg p-2 text-[11px]">
              <p className="font-semibold text-foreground/60 mb-1 uppercase tracking-wide text-[9px]">Values</p>
              <div className="overflow-x-auto text-sm text-foreground/80 py-0.5">
                <MathFormula latex={derivedSub[i]} />
              </div>
            </div>
          ) : null}

          {/* General formula — always shown */}
          <div className="overflow-x-auto text-sm leading-relaxed py-0.5"><MathFormula latex={def.formula} /></div>

          {/* Substituted values line — always shown (built from groups or derivedSub) */}
          {subLatex && (
            <div className="overflow-x-auto pl-3 border-l-2 border-primary/20 text-sm text-foreground/75 py-0.5">
              <MathFormula latex={subLatex} />
            </div>
          )}

          {/* Final answer */}
          <div className="flex items-center gap-2 pl-3 border-l-2 border-primary/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary">
              <MathFormula latex={def.answerLabel} />&nbsp;{md.result}
            </span>
          </div>

          {i < 2 && <div className="border-b border-primary/10 pt-1" />}
        </div>
        );
      })}
    </div>
  );
}


// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({
  prop,
  index,
  isOpen,
  onToggle,
  gcmData,
  gcmLoading,
  gcmFailed,
  onRetry,
  onCancel,
  allProperties,
}: {
  prop: PropertyData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  gcmData: GcmCard | null;
  gcmLoading: boolean;
  gcmFailed: boolean;
  onRetry: () => void;
  onCancel: () => void;
  allProperties: PropertyData[];
}) {
  const isGcm = GCM_CAPABLE_PROPERTIES.includes(prop.title);

  return (
    <motion.div
      key={prop.title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut", delay: index * 0.04 } }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10 shrink-0">
              <prop.icon className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <motion.h3
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                {prop.title}
              </motion.h3>
              <p className="text-xl font-semibold text-foreground">{prop.value}</p>

              {isGcm && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs font-semibold text-primary/80 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 group"
                      onClick={onToggle}
                    >
                      <Calculator className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform" />
                      {isOpen ? "Hide Calculation" : "Show Calculation"}
                      {isOpen ? (
                        <ChevronUp className="w-3 h-3 ml-2" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-2" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title={gcmLoading ? "Cancel calculation" : "Recalculate calculations for this card"}
                      className={`shrink-0 text-xs font-semibold border-primary/20 transition-all duration-300 ${
                        gcmLoading 
                          ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" 
                          : "text-primary/80 hover:bg-primary/5 hover:text-primary"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (gcmLoading) {
                          onCancel();
                        } else {
                          if (!isOpen) onToggle();
                          onRetry();
                        }
                      }}
                    >
                      {gcmLoading ? (
                        <div className="flex items-center gap-1.5 px-0.5">
                          <span className="h-2 w-2 bg-destructive rounded-sm"></span>
                          <span className="text-[10px] uppercase font-bold tracking-wider">Stop</span>
                        </div>
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <GcmCalculationPanel
                          data={gcmData}
                          loading={gcmLoading}
                          failed={gcmFailed}
                          onRetry={onRetry}
                          propTitle={prop.title}
                          allProperties={allProperties}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyEstimation() {
  const [smiles, setSmiles] = useState(cachedSmiles);
  const [properties, setProperties] = useState<PropertyData[]>(cachedProperties);
  const [mainTitle, setMainTitle] = useState<string>(cachedMainTitle);
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  // GCM state — lifted up so data persists across hide/show
  const [gcmCache, setGcmCache] = useState<Record<string, GcmCard>>(cachedGcmCache);
  const [gcmLoadingMap, setGcmLoadingMap] = useState<Record<string, boolean>>(cachedGcmLoadingMap);
  const [gcmFailedMap, setGcmFailedMap] = useState<Record<string, boolean>>(cachedGcmFailedMap);
  // Accordion: only one open at a time
  const [openCalcKey, setOpenCalcKey] = useState<string | null>(cachedOpenCalcKey);
  const [gcmAbortControllers, setGcmAbortControllers] = useState<Record<string, AbortController>>({});

  const { toast } = useToast();

  useEffect(() => { cachedSmiles = smiles; }, [smiles]);
  useEffect(() => { cachedProperties = properties; }, [properties]);
  useEffect(() => { cachedMainTitle = mainTitle; }, [mainTitle]);
  useEffect(() => { cachedGcmCache = gcmCache; }, [gcmCache]);
  useEffect(() => { cachedGcmLoadingMap = gcmLoadingMap; }, [gcmLoadingMap]);
  useEffect(() => { cachedGcmFailedMap = gcmFailedMap; }, [gcmFailedMap]);
  useEffect(() => { cachedOpenCalcKey = openCalcKey; }, [openCalcKey]);

  useEffect(() => {
    return () => {
      Object.values(activeGcmAbortControllers).forEach((ctrl) => ctrl.abort());
      activeGcmAbortControllers = {};
    };
  }, []);

  // ── numeric-JSON GCM parser ──────────────────────────────────────────

  const parseGcmData = (raw: string, propTitle: string): GcmCard => {
    let clean = raw.trim();
    if (clean.includes("```")) {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        clean = clean.slice(start, end + 1);
      }
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(clean.slice(start, end + 1));
      } else {
        throw e;
      }
    }

    const normalizeMethod = (m: any): MethodData => {
      if (!m) return { groups: [], result: "" };
      // Accept any common key name the AI might use for the groups array
      const rawGroups = Array.isArray(m.groups)
        ? m.groups
        : Array.isArray(m.methods)
          ? m.methods
          : Array.isArray(m.volumes)
            ? m.volumes
            : Array.isArray(m.contributions)
              ? m.contributions
              : Array.isArray(m.fragments)
                ? m.fragments
                : Array.isArray(m.groups_data)
                  ? m.groups_data
                  : [];
      const groups = rawGroups.map((g: any) => {
        const count = typeof g.count === "number" ? g.count : parseInt(g.count) || 1;
        // Accept "value", "volume", "contribution" as alternate delta keys
        let delta = 0;
        const rawDelta = g.delta ?? g.value ?? g.volume ?? g.contribution ?? 0;
        if (typeof rawDelta === "number") {
          delta = rawDelta;
        } else if (typeof rawDelta === "string") {
          delta = parseFloat(rawDelta.replace(/[^\d.-]/g, "")) || 0;
        }
        return {
          name: String(g.name || g.group || g.fragment || "Group"),
          count,
          delta,
        };
      });
      return {
        groups,
        result: String(m.result || m.answer || m.val || m.value || ""),
      };
    };

    const joback = normalizeMethod(parsed.joback || parsed.Joback || parsed.joback_method);
    const cg = normalizeMethod(parsed.cg || parsed.CG || parsed.cg_method || parsed["constantinou-gani"] || parsed["Constantinou-Gani"]);
    const mg = normalizeMethod(parsed.mg || parsed.MG || parsed.mg_method || parsed["marrero-gani"] || parsed["Marrero-Gani"]);

    return {
      property: propTitle,
      data: { joback, cg, mg }
    };
  };

  const buildFallbackCard = (propTitle: string, propValue: string): GcmCard => ({
    property: propTitle,
    data: {
      joback: { groups: [], result: propValue },
      cg:     { groups: [], result: propValue },
      mg:     { groups: [], result: propValue },
    },
  });

  // ── fetcher ───────────────────────────────────────────────────────────────────

  const fetchGcmForProp = async (propTitle: string, currentSmiles: string, force = false, currentProperties?: PropertyData[]) => {
    if (!force && (gcmCache[propTitle] || gcmLoadingMap[propTitle])) return;
    const controller = new AbortController();
    activeGcmAbortControllers[propTitle] = controller;
    setGcmAbortControllers({ ...activeGcmAbortControllers });
    setGcmLoadingMap(prev => ({ ...prev, [propTitle]: true }));
    // Use passed-in properties to avoid stale closure issues
    const propsToSearch = currentProperties ?? properties;
    const propValue = propsToSearch.find(p => p.title === propTitle)?.value ?? "";

    // Prompt tells Gemini exactly what numbers to provide per property — prevents empty groups
    // NOTE: Do NOT pre-fill "result" — let the AI compute it from the groups so it actually returns real group data
    const hints = GCM_DELTA_HINTS[propTitle] ?? GCM_DELTA_HINTS["Boiling Point"];
    const prompt = `For SMILES "${currentSmiles}", calculate ${propTitle} using Group Contribution Methods. The expected value is approximately ${propValue || "unknown"}.
Return ONLY this JSON (max 4 groups each, all delta values must be real numbers):
{"joback":{"groups":[{"name":"GROUP","count":N,"delta":NUMBER}],"result":"COMPUTED_VALUE_WITH_UNIT"},"cg":{"groups":[{"name":"GROUP","count":N,"delta":NUMBER}],"result":"COMPUTED_VALUE_WITH_UNIT"},"mg":{"groups":[{"name":"GROUP","count":N,"delta":NUMBER}],"result":"COMPUTED_VALUE_WITH_UNIT"}}
Delta meanings: joback delta = ${hints.joback}; cg delta = ${hints.cg}; mg delta = ${hints.mg}.
IMPORTANT: Identify the actual functional groups in the molecule, provide their real numeric delta contributions, and compute the result from those groups. Use real group names (CH3, OH, C=O, CH2 etc).`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = await predictProcess(prompt, controller.signal, true);
        const card = parseGcmData(raw, propTitle);
        setGcmCache(prev => ({ ...prev, [propTitle]: card }));
        setGcmLoadingMap(prev => ({ ...prev, [propTitle]: false }));
        delete activeGcmAbortControllers[propTitle];
        setGcmAbortControllers({ ...activeGcmAbortControllers });
        return;
      } catch (err: any) {
        if (err.name === "AbortError" || err.message?.includes("abort")) {
          setGcmLoadingMap(prev => ({ ...prev, [propTitle]: false }));
          delete activeGcmAbortControllers[propTitle];
          setGcmAbortControllers({ ...activeGcmAbortControllers });
          return;
        }
        if (attempt < 2) await new Promise(r => setTimeout(r, 500));
      }
    }
    // fallback — shows formula with empty group table and known result value
    const fallback = buildFallbackCard(propTitle, propValue);
    setGcmCache(prev => ({ ...prev, [propTitle]: fallback }));
    setGcmLoadingMap(prev => ({ ...prev, [propTitle]: false }));
    delete activeGcmAbortControllers[propTitle];
    setGcmAbortControllers({ ...activeGcmAbortControllers });
  };




  const handleToggleCalc = (propTitle: string) => {
    if (openCalcKey === propTitle) {
      // Clicking the open one closes it
      setOpenCalcKey(null);
    } else {
      // Open new one (closes old one automatically)
      setOpenCalcKey(propTitle);
      // Pass current properties explicitly to avoid stale closure
      fetchGcmForProp(propTitle, smiles, false, properties);
    }
  };

  const handleRetry = (propTitle: string) => {
    setGcmCache(prev => { const next = { ...prev }; delete next[propTitle]; return next; });
    setGcmFailedMap(prev => ({ ...prev, [propTitle]: false }));
    fetchGcmForProp(propTitle, smiles, true, properties);
  };

  const handleCancelGcm = (propTitle: string) => {
    const controller = activeGcmAbortControllers[propTitle];
    if (controller) {
      controller.abort();
    }
  };


  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!mainTitle || properties.length === 0) throw new Error("No properties to save");
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smiles",
          query: smiles,
          result: JSON.stringify({ title: mainTitle, properties }),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Saved", description: "SMILES properties saved to history." }),
    onError: () => toast({ title: "Failed to save", description: "An error occurred.", variant: "destructive" }),
  });

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    setProperties([]);
    setMainTitle("");
    // Reset all GCM state for a fresh estimate
    setGcmCache({});
    setGcmLoadingMap({});
    setGcmFailedMap({});
    setOpenCalcKey(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const query = `Analyze this SMILES structure and provide ONLY these properties in this EXACT format. Do NOT use markdown formatting like bold text. Include numerical values where applicable and keep descriptions very short (1-3 words):

Common Name: [Common name of the compound]
Chemical Formula: [chemical formula]
Molecular Weight: [X.XX g/mol]
Density: [X.XX g/cm³]
Boiling Point: [XXX°C]
Melting Point: [XXX°C]
Solubility: [brief phrase]
Molecular Structure: [brief phrase]
Polarity: [polar/nonpolar/etc]
Vapor Pressure: [X.XX mmHg at 25°C]
Reactivity: [low/medium/high]
Toxicity: [brief hazard level]
Partial Pressure: [X.XX mmHg]
Physical State: [solid/liquid/gas]
Stability: [stable/unstable]
Critical Temperature: [XXX K]
Enthalpy of Formation: [X.XX kJ/mol]
Viscosity: [X.XX cP at 25°C]
Ionization Energy: [X.XX eV]

SMILES: ${smiles}`;

      const result = await predictProcess(query, controller.signal, true);
      const lines = result.split("\n").filter((line) => line.trim());

      if (lines.length > 0) {
        let name = "Unknown Compound";
        const extractedProperties: PropertyData[] = [];

        lines.forEach((line) => {
          const cleanLine = line.replace(/[*_`]/g, "").trim();
          if (!cleanLine) return;

          if (!cleanLine.includes(":")) {
            if (extractedProperties.length === 0 && name === "Unknown Compound") {
              name = cleanLine;
            }
            return;
          }

          const [key, ...valueParts] = cleanLine.split(":");
          const cleanKey = key.trim();
          const value = valueParts.join(":").trim();

          if (cleanKey.toLowerCase() === "common name" || cleanKey.toLowerCase() === "name") {
            name = value;
            return;
          }

          const iconKey = Object.keys(propertyIcons).find(
            (k) => k.toLowerCase() === cleanKey.toLowerCase()
          );

          if (iconKey && value) {
            extractedProperties.push({
              title: iconKey,
              value,
              icon: propertyIcons[iconKey],
            });
          }
        });

        if (name === "Unknown Compound" && lines.length > 0) {
          const firstLine = lines[0].replace(/[*_`]/g, "").trim();
          name = firstLine.includes(":")
            ? firstLine.split(":")[1]?.trim() || firstLine
            : firstLine;
        }

        setMainTitle(name);

        const sorted = [...extractedProperties].sort((a, b) => {
          const aGcm = GCM_CAPABLE_PROPERTIES.includes(a.title);
          const bGcm = GCM_CAPABLE_PROPERTIES.includes(b.title);
          if (aGcm && !bGcm) return -1;
          if (!aGcm && bGcm) return 1;
          return 0;
        });

        setProperties(sorted);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("abort")) {
        console.log("Estimation cancelled");
      } else {
        console.error("Error:", err);
        setError("Failed to estimate properties");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const gcmProps = properties.filter((p) => GCM_CAPABLE_PROPERTIES.includes(p.title));
  const otherProps = properties.filter((p) => !GCM_CAPABLE_PROPERTIES.includes(p.title));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-4"
      >
        <Card className="p-3 sm:p-4 border-2 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="h-9 w-9 shrink-0 rounded-full border-2 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/home">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Atom className="w-6 h-6 text-primary shrink-0" />
                Physical Property Estimator
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full sm:w-auto border-2 hover:bg-primary/5 transition-colors"
            >
              <Link href="/recent?type=smiles">
                <Bookmark className="w-4 h-4 mr-2" />
                <span>Saved SMILES</span>
              </Link>
            </Button>
          </div>
        </Card>
        <p className="text-muted-foreground px-2 text-center sm:text-left">
          Enter a SMILES notation to discover chemical properties using Group Contribution Method
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-4">
          <Input
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            placeholder="Enter SMILES notation (e.g., CCO for ethanol)"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !loading && smiles && handleEstimate()}
          />
          <Button onClick={handleEstimate} disabled={loading || !smiles} className="min-w-[120px]">
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Analyzing...
              </>
            ) : (
              "Estimate"
            )}
          </Button>
          {loading && (
            <Button
              onClick={() => abortController?.abort()}
              variant="destructive"
              className="min-w-[120px]"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Try these examples:
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Ethanol", smiles: "CCO" },
              { name: "Acetone", smiles: "CC(C)=O" },
              { name: "Toluene", smiles: "Cc1ccccc1" },
              { name: "Acetic Acid", smiles: "CC(=O)O" },
            ].map((ex) => (
              <Button
                key={ex.name}
                variant="outline"
                size="sm"
                onClick={() => setSmiles(ex.smiles)}
                className="text-xs"
              >
                {ex.name}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {mainTitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <Card className="bg-primary/5 border-primary/20 shadow-sm mt-4">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-bold text-primary break-words text-center sm:text-left flex-1">
                    {mainTitle}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="shrink-0 bg-background/50 hover:bg-background"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span>Save</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12 mt-8"
          >
            {gcmProps.length > 0 && (
              <section>
                <div className="mb-6 border-b border-primary/20 pb-3">
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Calculator className="w-6 h-6 text-primary" />
                    Calculated Properties
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 ml-9">
                    (Using Group Contribution Method — click "Show Calculation" for multi-method breakdown)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gcmProps.map((prop, i) => (
                    <PropertyCard
                      key={prop.title}
                      prop={prop}
                      index={i}
                      isOpen={openCalcKey === prop.title}
                      onToggle={() => handleToggleCalc(prop.title)}
                      gcmData={gcmCache[prop.title] ?? null}
                      gcmLoading={!!gcmLoadingMap[prop.title]}
                      gcmFailed={!!gcmFailedMap[prop.title]}
                      onRetry={() => handleRetry(prop.title)}
                      onCancel={() => handleCancelGcm(prop.title)}
                      allProperties={properties}
                    />
                  ))}
                </div>
              </section>
            )}

            {otherProps.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 border-b border-primary/20 pb-3">
                  <FlaskConical className="w-6 h-6 text-primary" />
                  Other Important Properties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherProps.map((prop, i) => (
                    <PropertyCard
                      key={prop.title}
                      prop={prop}
                      index={i + gcmProps.length}
                      isOpen={false}
                      onToggle={() => {}}
                      gcmData={null}
                      gcmLoading={false}
                      gcmFailed={false}
                      onRetry={() => {}}
                      onCancel={() => {}}
                      allProperties={[]}
                    />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive/50 bg-destructive/5 mt-4">
              <CardContent className="p-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}