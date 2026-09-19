# WorldOrder

WorldOrder is a small daily geography game. Each puzzle asks you to place five countries in order on a line for three different statistics. The puzzle changes each day, and your score is based on the accuracy of your placements and the number of attempts.

The game is built with Next.js, React, and TypeScript. Country and statistic data lives in `data/`, while browser storage is used for local game progress and statistics.

## Why This Exists

This project is primarily a playground for experimenting with spec-driven development and agentic software-development workflows. The features have been designed and implemented through written specifications, plans, and tasks, with AI agents involved throughout the development process. Much of the code is AI-generated.

It is also a game made for myself and a few friends, not a product intended for the general population. It is deliberately small, opinionated, and allowed to evolve as an experiment.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run ESLint
npm test          # Run unit tests with coverage
npm run test:e2e  # Run Playwright end-to-end tests
```

## Data

The game uses country statistics collected from public sources, primarily Wikipedia. Data coverage, definitions, and accuracy can vary by statistic. The dataset is intended for a casual game rather than research or decision-making.

## Important Limitations

This is not a security-hardened or production-ready application. It has no authentication, authorization, account system, server-side protection for scores, or other security features that a public product would require. Game state and statistics are stored locally in the browser, and the client should not be treated as a trusted source of truth.
