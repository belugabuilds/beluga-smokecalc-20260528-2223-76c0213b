'use client';

import { useEffect, useMemo, useState } from "react";

type HistoryItem = {
  expression: string;
  result: string;
  createdAt: string;
};

const lengthFactors: Record<string, number> = {
  meters: 1,
  kilometers: 1000,
  feet: 0.3048,
  miles: 1609.344,
};

const weightFactors: Record<string, number> = {
  grams: 1,
  kilograms: 1000,
  ounces: 28.3495,
  pounds: 453.592,
};

function convertTemperature(value: number, from: string, to: string) {
  const celsius =
    from === "fahrenheit" ? (value - 32) * (5 / 9) : from === "kelvin" ? value - 273.15 : value;
  if (to === "fahrenheit") return celsius * (9 / 5) + 32;
  if (to === "kelvin") return celsius + 273.15;
  return celsius;
}

function convertUnit(value: number, from: string, to: string) {
  if (from in lengthFactors && to in lengthFactors) return (value * lengthFactors[from]) / lengthFactors[to];
  if (from in weightFactors && to in weightFactors) return (value * weightFactors[from]) / weightFactors[to];
  return convertTemperature(value, from, to);
}

function safeCalculate(expression: string) {
  if (!/^[0-9+\-*/().\s%]+$/.test(expression)) {
    throw new Error("Use numbers and arithmetic operators only.");
  }
  const normalized = expression.replace(/%/g, "/100");
  const value = Function(`"use strict"; return (${normalized})`)();
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("That expression does not produce a finite number.");
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export default function Home() {
  const [expression, setExpression] = useState("12 * (4 + 6)");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [unitValue, setUnitValue] = useState("10");
  const [fromUnit, setFromUnit] = useState("meters");
  const [toUnit, setToUnit] = useState("feet");

  useEffect(() => {
    const saved = window.localStorage.getItem("smokecalc-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("smokecalc-history", JSON.stringify(history));
  }, [history]);

  const conversion = useMemo(() => {
    const value = Number(unitValue);
    if (!Number.isFinite(value)) return "Enter a valid number";
    return convertUnit(value, fromUnit, toUnit).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }, [fromUnit, toUnit, unitValue]);

  function calculate() {
    try {
      const nextResult = safeCalculate(expression);
      setResult(nextResult);
      setError("");
      setHistory((items) => [
        { expression, result: nextResult, createdAt: new Date().toLocaleString() },
        ...items,
      ].slice(0, 12));
    } catch (err) {
      setResult("");
      setError(err instanceof Error ? err.message : "Could not calculate that.");
    }
  }

  const unitOptions = [
    "meters",
    "kilometers",
    "feet",
    "miles",
    "grams",
    "kilograms",
    "ounces",
    "pounds",
    "celsius",
    "fahrenheit",
    "kelvin",
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">SmokeCalc</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Fast calculator with history and conversions</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300">
            Do quick arithmetic, keep a local calculation trail, and convert common length, weight, and temperature units.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Calculator</h2>
              <button
                onClick={() => {
                  setExpression("");
                  setResult("");
                  setError("");
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
            <input
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") calculate();
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 font-mono text-2xl outline-none ring-cyan-400/30 focus:ring-4"
              placeholder="Type 42 / 7 and press Enter"
            />
            <button
              onClick={calculate}
              className="mt-3 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
            >
              Calculate
            </button>
            {result && (
              <div className="mt-4 rounded-xl bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200">Result</p>
                <p className="mt-1 font-mono text-4xl font-bold text-emerald-100">{result}</p>
              </div>
            )}
            {error && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-lg font-semibold">Unit converter</h2>
            <input
              value={unitValue}
              onChange={(event) => setUnitValue(event.target.value)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 outline-none ring-cyan-400/30 focus:ring-4"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={fromUnit} onChange={(event) => setFromUnit(event.target.value)} className="rounded-lg bg-slate-900 px-3 py-3">
                {unitOptions.map((unit) => <option key={unit}>{unit}</option>)}
              </select>
              <select value={toUnit} onChange={(event) => setToUnit(event.target.value)} className="rounded-lg bg-slate-900 px-3 py-3">
                {unitOptions.map((unit) => <option key={unit}>{unit}</option>)}
              </select>
            </div>
            <div className="mt-4 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Converted value</p>
              <p className="mt-1 font-mono text-3xl font-bold">{conversion}</p>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">Calculations are saved locally in this browser.</p>
            ) : (
              history.map((item) => (
                <div key={item.createdAt + item.expression} className="rounded-lg bg-slate-900 p-3">
                  <p className="font-mono text-sm text-slate-300">{item.expression}</p>
                  <p className="font-mono text-xl font-semibold text-cyan-200">= {item.result}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
