/**
 * ORATORIA Home Page
 * 
 * Entry point to the application.
 * No dashboards (per constitution) - direct path to learning.
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-container">
      <h1>ORATORIA</h1>
      <p className="tagline">Speak German. No shortcuts.</p>

      <div className="principles">
        <div className="principle">
          <span>🎤</span>
          <span>Speaking-first learning</span>
        </div>
        <div className="principle">
          <span>🧠</span>
          <span>Sentence-based SRS</span>
        </div>
        <div className="principle">
          <span>📈</span>
          <span>Ability-gated progression</span>
        </div>
        <div className="principle">
          <span>🎯</span>
          <span>Real-world German</span>
        </div>
      </div>

      <Link href="/lesson" className="btn-primary btn-large">
        Start Learning →
      </Link>
    </div>
  );
}
