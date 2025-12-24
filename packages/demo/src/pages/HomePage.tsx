/**
 * Home Page
 *
 * Entry point with links to the two demo apps
 */

import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="home-page">
      <h1>A2UI S-Expression Demo</h1>
      <p className="description">
        This demo showcases how A2UI can use S-expressions for client-side logic,
        enabling interactive applications without server roundtrips while maintaining
        security (no arbitrary code execution).
      </p>

      <div className="app-cards">
        <Link to="/showcase" className="app-card featured">
          <div className="app-icon">🎨</div>
          <h2>Component Showcase</h2>
          <p>
            A comprehensive demo of all A2UI components with data binding,
            templates, and S-expression logic.
          </p>
          <ul className="features">
            <li>All standard components</li>
            <li>Dynamic lists (template)</li>
            <li>Form with inputBinding</li>
            <li>Todo app example</li>
          </ul>
        </Link>

        <Link to="/calculator" className="app-card">
          <div className="app-icon">🧮</div>
          <h2>Calculator</h2>
          <p>
            A simple calculator demonstrating immediate UI feedback.
            Digit input, operators, and calculations all handled locally via S-expressions.
          </p>
          <ul className="features">
            <li>Local state updates</li>
            <li>No server roundtrip</li>
            <li>Arithmetic expressions</li>
          </ul>
        </Link>

        <Link to="/vocabulary" className="app-card">
          <div className="app-icon">📚</div>
          <h2>Vocabulary Flashcards</h2>
          <p>
            A spaced repetition vocabulary app implementing the SM-2 algorithm.
            Study words, track progress, manage your word library.
          </p>
          <ul className="features">
            <li>SM-2 spaced repetition</li>
            <li>Progress tracking</li>
            <li>CRUD operations</li>
            <li>Tab navigation</li>
          </ul>
        </Link>
      </div>

      <div className="tech-info">
        <h3>How it works</h3>
        <p>
          Both apps use A2UI's component model for the UI, but instead of sending
          actions to a server, they evaluate S-expression logic locally:
        </p>
        <pre className="code-example">
{`; Calculator: Input digit
(if waitingForOperand
    (list (list "display" new-digit)
          (list "waitingForOperand" false))
    (list (list "display" (concat display new-digit))))

; Vocabulary: SM-2 algorithm
(let ((new-ef (clamp (+ old-ef delta) 1.3 2.5))
      (new-interval (if (= quality 0) 1
                       (round (* old-interval new-ef)))))
  (list (list "easeFactor" new-ef)
        (list "interval" new-interval)
        (list "nextReview" (add-days (now) new-interval))))`}
        </pre>
      </div>
    </div>
  );
}
