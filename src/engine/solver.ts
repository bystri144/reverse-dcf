import type { DcfInputs, SolverResult } from '../types';
import { runDcf, getTarget, validateInputs, checkFcf5 } from './dcf';

export function brentSolver(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number = 1e-10,
  maxIter: number = 200,
): number | null {
  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) return null;

  if (Math.abs(fa) < Math.abs(fb)) {
    [a, b] = [b, a];
    [fa, fb] = [fb, fa];
  }

  let c = a;
  let fc = fa;
  let d = b - a;
  let mflag = true;

  for (let i = 0; i < maxIter; i++) {
    if (Math.abs(fb) < tol) return b;
    if (Math.abs(b - a) < tol) return b;

    let s: number;

    if (fa !== fc && fb !== fc) {
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb));
    } else {
      s = b - fb * ((b - a) / (fb - fa));
    }

    const cond1 = !(s > (3 * a + b) / 4 && s < b) && !(s < (3 * a + b) / 4 && s > b);
    const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
    const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
    const cond4 = mflag && Math.abs(b - c) < tol;
    const cond5 = !mflag && Math.abs(c - d) < tol;

    if (cond1 || cond2 || cond3 || cond4 || cond5) {
      s = (a + b) / 2;
      mflag = true;
    } else {
      mflag = false;
    }

    const fs = f(s);
    d = c;
    c = b;
    fc = fb;

    if (fa * fs < 0) {
      b = s;
      fb = fs;
    } else {
      a = s;
      fa = fs;
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }
  }

  return b;
}

export function solveImpliedCAGR(inputs: DcfInputs): SolverResult {
  const validationError = validateInputs(inputs);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const target = getTarget(inputs);

  const f = (g: number): number => {
    const result = runDcf(g, inputs);
    return result.impliedValue - target;
  };

  let low = -0.50;
  let high = 1.00;

  const expansionSteps = [
    { low: -0.60, high: 1.20 },
    { low: -0.70, high: 1.50 },
    { low: -0.80, high: 2.00 },
  ];

  let fLow: number, fHigh: number;

  const tryBracket = (lo: number, hi: number): number | null => {
    fLow = f(lo);
    fHigh = f(hi);

    if (!isFinite(fLow) || !isFinite(fHigh)) return null;
    if (fLow * fHigh > 0) return null;

    return brentSolver(f, lo, hi);
  };

  let solution = tryBracket(low, high);

  if (solution === null) {
    for (const step of expansionSteps) {
      solution = tryBracket(step.low, step.high);
      if (solution !== null) break;
      low = step.low;
      high = step.high;
    }
  }

  if (solution === null) {
    const impliedAtLow = runDcf(low, inputs).impliedValue;
    const impliedAtHigh = runDcf(high, inputs).impliedValue;
    return {
      success: false,
      error: {
        type: 'no_solution',
        message:
          'No solution found in reasonable bounds (-80% to +200%). ' +
          'Check your margin, reinvestment, and WACC assumptions — they drive whether a feasible growth rate exists.',
        details: {
          impliedAtLow,
          impliedAtHigh,
          target,
        },
      },
    };
  }

  const fcf5Error = checkFcf5(solution, inputs);
  if (fcf5Error) {
    return { success: false, error: fcf5Error };
  }

  const result = runDcf(solution, inputs);
  return { success: true, result: { ...result, impliedCAGR: solution } };
}
