interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div
      aria-label={`Running score: ${score} / 150`}
      className="text-center text-2xl font-bold text-neutral-700"
    >
      {score} / 150
    </div>
  );
}
