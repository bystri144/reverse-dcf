# Reverse DCF — Implied Revenue Growth Calculator

A client-side web application that performs a **reverse DCF** (Discounted Cash Flow) analysis. Given a company's current market valuation and operating assumptions, the app solves for the **implied revenue CAGR** (Compound Annual Growth Rate) over a 5-year explicit forecast period.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Running Tests

```bash
npm test
```

## How It Works

### Reverse DCF Concept

A traditional DCF projects future cash flows to determine intrinsic value. A **reverse DCF** inverts this: given the market price, it finds what growth rate the market is implying.

The app solves for `g` (revenue CAGR) such that:

```
DCF-implied value(g) = market value target
```

### Modeling Assumptions

- **Forecast horizon**: 5 years (fixed)
- **Discounting**: End-year convention
- **Terminal value**: Gordon Growth Model using an explicit Year 6 cash flow
- **Solver**: Brent's method with automatic bracket expansion (-80% to +200%)

### Cash Conversion Modes

1. **FCF Margin mode**: FCF = Revenue x FCF Margin (constant or ramping linearly from base to target over 5 years)

2. **EBIT-based mode**: Full operating model with EBIT margin, tax rate, D&A, Capex, and NWC (all as % of revenue). Terminal Capex is normalized to `DA * (1 + terminal_growth)`.

### Value Target Modes

- **Price mode**: Input market price per share + shares outstanding; solve for implied price
- **Market Cap mode**: Input total market capitalization; solve for implied market cap

### Numeric Scaling

The engine is unit-blind. The Units selector (Thousands / Millions / Billions) is purely a display label. All monetary inputs must use the same scale, including shares outstanding in price mode.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts
- Vitest

## Project Structure

```
src/
  types/index.ts          — TypeScript interfaces and enums
  engine/
    dcf.ts                — DCF calculation engine (pure functions)
    solver.ts             — Brent's method root-finding solver
    constants.ts          — Currency list, default values
    __tests__/            — Unit tests (22 tests)
  utils/format.ts         — Number and percentage formatting
  components/             — React UI components
  App.tsx                 — Main application with state management
```
