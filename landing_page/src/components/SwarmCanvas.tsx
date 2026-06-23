/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface SwarmCanvasProps {
  interactive?: boolean;
  agentCount?: number;
  cohesion?: number;
  exploration?: number;
  algorithm?: 'PSO' | 'ACO' | 'ABC' | 'FLOCK';
  heightClass?: string;
  className?: string;
}

interface Agent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bestX?: number; // PSO local best
  bestY?: number;
  color: string;
  size: number;
}

export default function SwarmCanvas({
  interactive = true,
  agentCount = 120,
  cohesion = 0.5,
  exploration = 0.3,
  algorithm = 'PSO',
  heightClass = 'h-full',
  className = '',
}: SwarmCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const requestRef = useRef<number | null>(null);

  // Define colors based on algorithm
  const getAlgoColors = (algo: string) => {
    switch (algo) {
      case 'PSO':
        return {
          primary: '#10b981', // emerald-500
          secondary: '#6366f1', // indigo-500
          accent: 'rgba(16, 185, 129, 0.15)',
        };
      case 'ACO':
        return {
          primary: '#f97316', // orange-500
          secondary: '#ef4444', // red-500
          accent: 'rgba(249, 115, 22, 0.15)',
        };
      case 'ABC':
        return {
          primary: '#eab308', // yellow-500
          secondary: '#a855f7', // purple-500
          accent: 'rgba(234, 179, 8, 0.15)',
        };
      case 'FLOCK':
      default:
        return {
          primary: '#06b6d4', // cyan-500
          secondary: '#14b8a6', // teal-500
          accent: 'rgba(6, 180, 212, 0.15)',
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        canvas.width = entryWidth;
        canvas.height = entryHeight;
        width = entryWidth;
        height = entryHeight;
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initialize Agents
    const agents: Agent[] = [];
    const colors = getAlgoColors(algorithm);

    for (let i = 0; i < agentCount; i++) {
      const rx = Math.random() * (width || 400);
      const ry = Math.random() * (height || 400);
      agents.push({
        x: rx,
        y: ry,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        bestX: rx,
        bestY: ry,
        color: Math.random() > 0.4 ? colors.primary : colors.secondary,
        size: Math.random() * 1.5 + 1.5,
      });
    }

    // Mouse listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Keep pheromones for ACO
    const pheromoneGrid: { x: number; y: number; intensity: number }[] = [];

    const animate = () => {
      const colors = getAlgoColors(algorithm);

      // Customize background clearing
      if (algorithm === 'ACO') {
        // Soft trail persistence for ants
        ctx.fillStyle = 'rgba(9, 9, 11, 0.08)';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = 'rgba(9, 9, 11, 0.22)';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw mouse gravity well
      const mouse = mouseRef.current;
      if (mouse.x !== null && mouse.y !== null && interactive) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
        ctx.fillStyle = colors.accent;
        ctx.fill();
        ctx.strokeStyle = `rgba(${algorithm === 'PSO' ? '16, 185, 129' : '6, 182, 212'}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Particle swarm logic
      agents.forEach((agent, idx) => {
        // Cohesion / alignment vector math
        let flockCenterX = 0;
        let flockCenterY = 0;
        let separationX = 0;
        let separationY = 0;
        let neighborCount = 0;

        // Compare position with other agents
        for (let j = 0; j < agents.length; j++) {
          if (idx === j) continue;
          const other = agents[j];
          const dist = Math.hypot(agent.x - other.x, agent.y - other.y);

          if (dist < 60) {
            flockCenterX += other.x;
            flockCenterY += other.y;
            neighborCount++;

            if (dist < 18) {
              separationX += agent.x - other.x;
              separationY += agent.y - other.y;
            }

            // Connect neighboring particles with thin glowing lines
            if (dist < 40 && algorithm !== 'ACO') {
              ctx.beginPath();
              ctx.moveTo(agent.x, agent.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = `rgba(100, 116, 139, ${0.12 * (1 - dist / 40)})`; // slate-500
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        // Apply flocking forces
        if (neighborCount > 0) {
          flockCenterX /= neighborCount;
          flockCenterY /= neighborCount;

          // Cohesion force (fly towards center of neighbors)
          agent.vx += (flockCenterX - agent.x) * (cohesion * 0.005);
          agent.vy += (flockCenterY - agent.y) * (cohesion * 0.005);
        }

        // Separation force (maintain small spacing)
        agent.vx += separationX * 0.02;
        agent.vy += separationY * 0.02;

        // Custom Algorithm Rules
        if (algorithm === 'PSO') {
          // Attract towards personal best, and towards global best (center/mouse if interactive)
          const targetX = mouse.x !== null ? mouse.x : width / 2;
          const targetY = mouse.y !== null ? mouse.y : height / 2;

          agent.vx += (agent.bestX! - agent.x) * 0.002 + (targetX - agent.x) * 0.008;
          agent.vy += (agent.bestY! - agent.y) * 0.002 + (targetY - agent.y) * 0.008;

          // Update localized best tracker randomly
          if (Math.random() < 0.01) {
            agent.bestX = agent.x;
            agent.bestY = agent.y;
          }
        } else if (algorithm === 'ACO') {
          // Ant-trail behavior: follow strong points, leave random walks
          if (mouse.x !== null && mouse.y !== null) {
            const mDist = Math.hypot(mouse.x - agent.x, mouse.y - agent.y);
            if (mDist < 180) {
              agent.vx += (mouse.x - agent.x) * 0.008;
              agent.vy += (mouse.y - agent.y) * 0.008;
            }
          }
          // Leave pheromone records occasionally
          if (Math.random() < 0.04) {
            pheromoneGrid.push({ x: agent.x, y: agent.y, intensity: 1.0 });
          }
        } else if (algorithm === 'ABC') {
          // Honeybee scouts: check wide regions, then collapse onto best patches
          if (idx % 6 === 0) {
            // Leader bee
            if (mouse.x !== null && mouse.y !== null) {
              agent.vx += (mouse.x - agent.x) * 0.02;
              agent.vy += (mouse.y - agent.y) * 0.02;
            } else {
              agent.vx += (Math.random() - 0.5) * 1.5;
              agent.vy += (Math.random() - 0.5) * 1.5;
            }
          } else {
            // Onlooker bee following nearest Leader
            const leader = agents[0];
            agent.vx += (leader.x - agent.x) * 0.005;
            agent.vy += (leader.y - agent.y) * 0.005;
          }
        } else {
          // Standard flocking: Attract to mouse gravitationally
          if (mouse.x !== null && mouse.y !== null) {
            agent.vx += (mouse.x - agent.x) * 0.003;
            agent.vy += (mouse.y - agent.y) * 0.003;
          }
        }

        // Add exploration/noise component
        agent.vx += (Math.random() - 0.5) * (exploration * 0.8);
        agent.vy += (Math.random() - 0.5) * (exploration * 0.8);

        // Speed caps and limits
        const speed = Math.hypot(agent.vx, agent.vy);
        const maxSpeed = algorithm === 'PSO' ? 4.5 : 3.0;
        if (speed > maxSpeed) {
          agent.vx = (agent.vx / speed) * maxSpeed;
          agent.vy = (agent.vy / speed) * maxSpeed;
        }

        // Bounce/Wrap boundaries
        agent.x += agent.vx;
        agent.y += agent.vy;

        if (agent.x < 0) {
          agent.x = 0;
          agent.vx *= -1;
        } else if (agent.x > width) {
          agent.x = width;
          agent.vx *= -1;
        }

        if (agent.y < 0) {
          agent.y = 0;
          agent.vy *= -1;
        } else if (agent.y > height) {
          agent.y = height;
          agent.vy *= -1;
        }

        // Draw individual agent
        ctx.beginPath();
        if (algorithm === 'ABC' && idx % 6 === 0) {
          // Draw leader larger
          ctx.arc(agent.x, agent.y, agent.size + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b'; // amber-500
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f59e0b';
        } else {
          ctx.arc(agent.x, agent.y, agent.size, 0, Math.PI * 2);
          ctx.fillStyle = agent.color;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }
    );

      // Handle pheromone rendering and decay for ACO
      if (algorithm === 'ACO') {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)'; // red-500 fading traces
        ctx.lineWidth = 1.2;
        for (let k = pheromoneGrid.length - 1; k >= 0; k--) {
          const pt = pheromoneGrid[k];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 * pt.intensity, 0, Math.PI * 2);
          ctx.stroke();

          pt.intensity -= 0.015;
          if (pt.intensity <= 0) {
            pheromoneGrid.splice(k, 1);
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    // Begin looping
    animate();

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [agentCount, cohesion, exploration, algorithm, interactive]);

  return (
    <div ref={containerRef} id="swarm-canvas-container" className={`relative w-full ${heightClass} ${className}`}>
      <canvas
        ref={canvasRef}
        id="swarm-canvas"
        className="block w-full h-full cursor-crosshair opacity-80"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
