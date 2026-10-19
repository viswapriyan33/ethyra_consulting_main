/**
 * ETHYRA CONSULTING SERVICES - Hero Mechanical Gear & Optical Lens Engine
 * Grounded, precision in-place mechanical animations:
 * - In-place gear / screw rotations
 * - Active data graph waves and rising bars inside the magnifying lens ("search")
 * - Subtle friction sparks along the belt track
 * - Fully grounded layout (no floating or flying elements)
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveSparkEmitter();
  initMetricPulseEffect();
});

/* Continuous subtle golden friction glints along drive belt contact points */
function initLiveSparkEmitter() {
  const sparkCluster = document.querySelector('.belt-spark-cluster');
  if (!sparkCluster) return;

  const contactPoints = [
    { x: 360, y: 122 },
    { x: 480, y: 130 },
    { x: 580, y: 210 },
    { x: 420, y: 518 },
    { x: 260, y: 505 },
    { x: 175, y: 380 },
    { x: 220, y: 140 }
  ];

  setInterval(() => {
    // Generate a tiny golden spark
    const pt = contactPoints[Math.floor(Math.random() * contactPoints.length)];
    const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const radius = 1.2 + Math.random() * 2.2;
    const offsetX = (Math.random() - 0.5) * 16;
    const offsetY = (Math.random() - 0.5) * 16;

    spark.setAttribute('cx', pt.x + offsetX);
    spark.setAttribute('cy', pt.y + offsetY);
    spark.setAttribute('r', radius);
    spark.setAttribute('fill', Math.random() > 0.3 ? '#fbbf24' : '#f59e0b');
    spark.setAttribute('opacity', '0.9');
    spark.style.transition = 'all 0.6s ease-out';

    sparkCluster.appendChild(spark);

    setTimeout(() => {
      spark.setAttribute('opacity', '0');
      spark.setAttribute('transform', `translate(${(Math.random() - 0.5) * 14}, ${-8 - Math.random() * 12})`);
      setTimeout(() => spark.remove(), 600);
    }, 40);
  }, 280);
}

/* Subtle data heartbeat animation inside the lens cards */
function initMetricPulseEffect() {
  const cards = document.querySelectorAll('.lens-metric-card');
  if (!cards.length) return;

  // Staggered interactive hover response on the cards
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.filter = 'drop-shadow(0 4px 8px rgba(0, 154, 224, 0.15))';
    });
    card.addEventListener('mouseleave', () => {
      card.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.03))';
    });
  });
}
