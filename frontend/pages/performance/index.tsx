import Link from "next/link";

export default function PerformanceHome() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Performance Management</h1>

      <ul>
        <li>
          <Link href="/performance/templates">Templates</Link>
        </li>
        <li>
          <Link href="/performance/cycles">Cycles</Link>
        </li>
        <li>
          <Link href="/performance/appraisals">Appraisals</Link>
        </li>
        <li>
          <Link href="/performance/disputes">Disputes</Link>
        </li>
      </ul>
    </div>
  );
}
