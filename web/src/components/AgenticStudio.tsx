'use client';

import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import type { AgenticPlan, MotionStyle, VideoLayerSpec } from '@/lib/agenticPlan';
import { planOrDefault, createRng } from '@/lib/agenticPlan';

interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
}

const DEFAULT_PROMPT = 'neon city skyline drifting through cosmic auroras';

type RendererStatus =
  | { state: 'idle' }
  | { state: 'planning'; plan: AgenticPlan }
  | { state: 'rendering'; plan: AgenticPlan; progress: number }
  | { state: 'ready'; plan: AgenticPlan; url: string; duration: number }
  | { state: 'error'; plan?: AgenticPlan; message: string };

export function AgenticStudio() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [rendererStatus, setRendererStatus] = useState<RendererStatus>({ state: 'idle' });
  const [steps, setSteps] = useState<AgentStep[]>(() => buildSteps());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const frameRef = useRef<number | undefined>(undefined);

  const activePlan = useMemo<AgenticPlan>(() => {
    if (rendererStatus.state === 'idle') {
      return planOrDefault(prompt);
    }
    if (
      rendererStatus.state === 'planning' ||
      rendererStatus.state === 'rendering' ||
      rendererStatus.state === 'ready'
    ) {
      return rendererStatus.plan;
    }
    if (rendererStatus.state === 'error' && rendererStatus.plan) {
      return rendererStatus.plan;
    }
    return planOrDefault(prompt);
  }, [rendererStatus, prompt]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleGenerate = async () => {
    const normalizedPrompt = prompt.trim() || DEFAULT_PROMPT;
    const plan = planOrDefault(normalizedPrompt);
    setRendererStatus({ state: 'planning', plan });

    const pipeline = buildSteps();
    setSteps(pipeline);

    for (let i = 0; i < pipeline.length; i += 1) {
      setSteps((prev) =>
        prev.map((step, index) => {
          if (index < i) return { ...step, status: 'done' };
          if (index === i) return { ...step, status: 'running' };
          return { ...step, status: 'pending' };
        }),
      );
      // eslint-disable-next-line no-await-in-loop -- sequential choreography for UX
      await pause(600 + Math.random() * 400);
    }

    if (!canvasRef.current) {
      setRendererStatus({ state: 'error', plan, message: 'Canvas unavailable for rendering.' });
      return;
    }

    const renderResult = await renderVideo(plan, canvasRef.current, {
      recorderRef,
      recordingChunksRef,
      frameRef,
      onProgress: (progress) => setRendererStatus({ state: 'rendering', plan, progress }),
    });

    if (renderResult.type === 'error') {
      setRendererStatus({ state: 'error', plan, message: renderResult.reason });
      return;
    }

    setRendererStatus({
      state: 'ready',
      plan,
      url: renderResult.url,
      duration: plan.duration,
    });

    setSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row">
      <section className="flex flex-1 flex-col gap-8">
        <header className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/60 backdrop-blur">
            Agentic video lab · free generative pipeline
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            Deploy a free agentic AI to synthesize cinematic motion graphics from text prompts.
          </h1>
          <p className="max-w-xl text-base text-white/70">
            Our autonomous workflow interprets your idea, drafts a motion plan, choreographs layered emitters,
            and exports a ready-to-share WebM clip. No paid credits, no dependencies — everything runs in-browser.
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5/60 p-6 backdrop-blur">
          <label className="flex flex-col gap-3 text-sm font-medium text-white/70">
            Prompt
            <textarea
              className="min-h-[120px] rounded-2xl border border-white/10 bg-black/30 p-4 text-base text-white outline-none ring-2 ring-transparent transition focus:border-white/40 focus:ring-white/40"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the motion world you want to see..."
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-full bg-gradient-to-r from-sky-500 via-purple-500 to-fuchsia-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Generate Video
            </button>
            <span className="text-sm text-white/60">
              Generates {activePlan.duration}s clip · {activePlan.layers.length} procedural layers · {activePlan.bpm} BPM cadence
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard plan={activePlan} />
          <AgentTimeline steps={steps} status={rendererStatus.state} />
        </div>
      </section>

      <section className="flex flex-1 flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 shadow-2xl shadow-sky-900/40">
          <canvas
            ref={canvasRef}
            width={720}
            height={720}
            className="aspect-square w-full bg-black"
          />
          <StatusOverlay status={rendererStatus} />
        </div>

        {rendererStatus.state === 'ready' && (
          <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <video
              key={rendererStatus.url}
              src={rendererStatus.url}
              controls
              className="w-full rounded-2xl border border-white/10"
            />
            <div className="flex flex-col gap-3 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
              <span>
                {rendererStatus.plan.title} · {rendererStatus.duration}s · {rendererStatus.plan.motion} motion grammar
              </span>
              <div className="flex flex-wrap gap-3">
                <a
                  href={rendererStatus.url}
                  download={`${rendererStatus.plan.title.replace(/\s+/g, '-').toLowerCase()}.webm`}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Download WebM
                </a>
                <button
                  type="button"
                  onClick={() => setRendererStatus({ state: 'idle' })}
                  className="rounded-full border border-white/0 bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
                >
                  Reset Canvas
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PlanCard({ plan }: { plan: AgenticPlan }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-black/60 p-6 text-white">
      <div>
        <h2 className="text-lg font-semibold text-white">{plan.title}</h2>
        <p className="text-sm text-white/60">{plan.mood}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {plan.palette.map((color) => (
          <span
            key={color}
            className="flex h-9 flex-1 items-center justify-between rounded-full border border-white/5 px-4 text-xs font-medium backdrop-blur"
            style={{ background: `${color}1A`, color }}
          >
            <span>{color.toUpperCase()}</span>
            <span
              aria-hidden
              className="ml-3 h-3 w-3 rounded-full border border-white/30"
              style={{ background: color }}
            />
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm text-white/70">
        <div>
          <dt className="text-xs uppercase tracking-wide text-white/50">Duration</dt>
          <dd className="text-base font-semibold text-white">{plan.duration}s</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-white/50">Rhythm</dt>
          <dd className="text-base font-semibold text-white">{plan.bpm} BPM</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-white/50">Narrative</dt>
          <dd className="space-y-1 pt-2">
            {plan.narrativeBeats.map((beat, index) => (
              <p key={beat} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-xs text-white/60">
                  {index + 1}
                </span>
                <span>{beat}</span>
              </p>
            ))}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function AgentTimeline({ steps, status }: { steps: AgentStep[]; status: RendererStatus['state'] }) {
  return (
    <article className="flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-black/60 p-6 text-white">
      <div>
        <h2 className="text-lg font-semibold text-white">Agent Runbook</h2>
        <p className="text-sm text-white/60">Autonomous chain of thought generating the motion clip.</p>
      </div>

      <ul className="flex flex-col gap-4">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
          >
            <span className="mt-1 h-3 w-3 rounded-full"
              style={{
                background:
                  step.status === 'done'
                    ? 'linear-gradient(135deg,#22d3ee,#7c3aed)'
                    : step.status === 'running'
                      ? '#fbbf24'
                      : 'rgba(255,255,255,0.2)',
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{step.title}</span>
              <span className="text-xs text-white/60">{step.detail}</span>
            </div>
          </li>
        ))}
      </ul>

      <footer className="text-xs uppercase tracking-wide text-white/40">
        Status: {status === 'idle' ? 'Ready for prompt' : status}
      </footer>
    </article>
  );
}

function StatusOverlay({ status }: { status: RendererStatus }) {
  if (status.state === 'idle') {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/30 to-black/70 text-center text-white/70">
        Enter a prompt and generate to visualize your world.
      </div>
    );
  }

  if (status.state === 'planning') {
    return (
      <OverlayMessage
        heading="Auto-planning your motion grammar"
        subheading={`${status.plan.layers.length} layered emitters · ${status.plan.motion} choreography`}
      />
    );
  }

  if (status.state === 'rendering') {
    const percent = Math.round(status.progress * 100);
    return (
      <OverlayMessage
        heading="Rendering"
        subheading={`${percent}% · capturing ${status.plan.duration}s WebM`}
        progress={percent}
      />
    );
  }

  if (status.state === 'error') {
    return (
      <OverlayMessage
        heading="Render Failed"
        subheading={status.message}
      />
    );
  }

  return null;
}

function OverlayMessage({
  heading,
  subheading,
  progress,
}: {
  heading: string;
  subheading: string;
  progress?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-black/40 to-black/60 text-center text-white">
      <h3 className="text-lg font-semibold">{heading}</h3>
      <p className="max-w-xs text-sm text-white/70">{subheading}</p>
      {typeof progress === 'number' && (
        <div className="h-1.5 w-48 overflow-hidden rounded-full border border-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-purple-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

async function renderVideo(
  plan: AgenticPlan,
  canvas: HTMLCanvasElement,
  toolkit: {
    recorderRef: MutableRefObject<MediaRecorder | null>;
    recordingChunksRef: MutableRefObject<BlobPart[]>;
    frameRef: MutableRefObject<number | undefined>;
    onProgress: (value: number) => void;
  },
) {
  const context = canvas.getContext('2d');
  if (!context) {
    return { type: 'error' as const, reason: '2D context not available.' };
  }

  if (typeof MediaRecorder === 'undefined') {
    return { type: 'error' as const, reason: 'MediaRecorder API is not supported in this browser.' };
  }

  toolkit.recordingChunksRef.current = [];
  const stream = canvas.captureStream(60);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8_000_000,
  });

  toolkit.recorderRef.current = recorder;

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        toolkit.recordingChunksRef.current.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(toolkit.recordingChunksRef.current, { type: 'video/webm' });
      resolve(blob);
    });
    recorder.addEventListener('error', (event) => reject(event.error));
  });

  const rng = createRng(plan.seed);
  const particles = seedParticles(plan.layers, rng, canvas.width, canvas.height);
  const start = performance.now();
  const durationMs = plan.duration * 1000;

  recorder.start();

  const renderFrame = (timestamp: number) => {
    const elapsed = Math.min(timestamp - start, durationMs);
    const progress = elapsed / durationMs;
    toolkit.onProgress(progress);

    drawFrame({
      context,
      canvas,
      plan,
      particles,
      progress,
      elapsedSeconds: elapsed / 1000,
    });

    if (elapsed < durationMs) {
      toolkit.frameRef.current = requestAnimationFrame(renderFrame);
    } else {
      stream.getTracks().forEach((track) => track.stop());
      recorder.stop();
    }
  };

  toolkit.frameRef.current = requestAnimationFrame(renderFrame);

  try {
    const blob = await recordingPromise;
    const url = URL.createObjectURL(blob);
    return { type: 'success' as const, url };
  } catch (error) {
    return {
      type: 'error' as const,
      reason: error instanceof Error ? error.message : 'Failed to encode video.',
    };
  }
}

interface DrawParams {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  plan: AgenticPlan;
  particles: Particle[];
  progress: number;
  elapsedSeconds: number;
}

interface Particle {
  layer: VideoLayerSpec;
  x: number;
  y: number;
  depth: number;
  seed: number;
}

function drawFrame({ context, canvas, plan, particles, progress, elapsedSeconds }: DrawParams) {
  const { width, height } = canvas;
  context.fillStyle = alpha(plan.background, 0.9);
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width / 2, height / 2, height / 8, width / 2, height / 2, height / 1.4);
  glow.addColorStop(0, alpha(plan.palette[0] ?? '#ffffff', 0.2));
  glow.addColorStop(1, 'transparent');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const beatPhase = ((elapsedSeconds * plan.bpm) / 60) % 1;

  particles.forEach((particle) => {
    const baseColor = plan.palette[Math.floor(particle.seed * plan.palette.length)] ?? '#ffffff';
    const depthMultiplier = particle.depth * (1 + Math.sin(progress * Math.PI * 2) * 0.1);
    const phase = elapsedSeconds * 0.5 + particle.seed * 12;
    const motionVector = resolveMotion(plan.motion, particle, phase, progress, beatPhase);
    const size = particle.layer.size * (0.6 + particle.depth * 0.8);

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(motionVector.rotation);
    context.translate(motionVector.xOffset * width * 0.4, motionVector.yOffset * height * 0.4);

    if (particle.layer.shape === 'particles' || particle.layer.shape === 'orbs') {
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, alpha(baseColor, 0.9));
      gradient.addColorStop(1, alpha(baseColor, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, size, 0, Math.PI * 2);
      context.fill();
    } else if (particle.layer.shape === 'rays') {
      context.strokeStyle = alpha(baseColor, 0.3);
      context.lineWidth = 2 + depthMultiplier * 4;
      context.beginPath();
      context.moveTo(-size * 1.5, 0);
      context.lineTo(size * 1.5, 0);
      context.stroke();
    } else {
      context.strokeStyle = alpha(baseColor, 0.2);
      context.lineWidth = 1.5;
      context.beginPath();
      const contourSize = size * (0.4 + particle.depth * 0.6);
      for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 12) {
        const wobble = Math.sin(phase + angle * 3) * particle.layer.variance * 12;
        const radius = contourSize + wobble;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (angle === 0) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
      }
      context.closePath();
      context.stroke();
    }

    context.restore();
  });

  addFilmGrain(context, canvas, plan.seed, progress);
}

function seedParticles(
  layers: VideoLayerSpec[],
  rng: () => number,
  width: number,
  height: number,
) {
  const totalParticles: Particle[] = [];

  layers.forEach((layer) => {
    const count = Math.round(layer.density * 180);
    for (let i = 0; i < count; i += 1) {
      totalParticles.push({
        layer,
        x: rng() * width,
        y: rng() * height,
        depth: rng(),
        seed: rng(),
      });
    }
  });

  return totalParticles;
}

function resolveMotion(
  motion: MotionStyle,
  particle: Particle,
  phase: number,
  progress: number,
  beatPhase: number,
) {
  const wobble = Math.sin(phase + particle.seed * 6) * 0.5;
  const drift = (Math.cos(phase * 0.7) + Math.sin(progress * Math.PI * 2)) * 0.1;

  switch (motion) {
    case 'orbital':
      return {
        xOffset: Math.cos(phase) * (0.4 + particle.depth * 0.6),
        yOffset: Math.sin(phase * 0.9 + wobble) * (0.4 + particle.depth * 0.5),
        rotation: phase * 0.3,
      };
    case 'pulse':
      return {
        xOffset: Math.sin(phase + beatPhase * Math.PI * 2) * 0.5 * particle.depth,
        yOffset: Math.cos(phase * 1.2) * 0.5 * particle.depth,
        rotation: beatPhase * Math.PI * 2,
      };
    case 'ribbon':
      return {
        xOffset: Math.sin(phase * 0.6) * 0.8 * particle.depth,
        yOffset: (Math.cos(phase * 0.6 + wobble) + drift) * 0.5,
        rotation: Math.sin(progress * Math.PI * 2) * 0.6,
      };
    case 'burst':
      return {
        xOffset: Math.cos(phase) * (0.2 + progress * 0.8),
        yOffset: Math.sin(phase * 1.4) * (0.2 + progress * 0.8),
        rotation: progress * Math.PI * 2 + wobble,
      };
    default:
      return {
        xOffset: Math.sin(phase) * 0.6,
        yOffset: Math.cos(phase * 0.8 + wobble) * 0.6,
        rotation: drift,
      };
  }
}

function alpha(color: string, opacity: number) {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

function addFilmGrain(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  seed: number,
  progress: number,
) {
  const rng = createRng(seed + Math.floor(progress * 1_000));
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const grain = (rng() - 0.5) * 12;
    imageData.data[i] += grain;
    imageData.data[i + 1] += grain;
    imageData.data[i + 2] += grain;
  }
  context.putImageData(imageData, 0, 0);
}

function pause(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function buildSteps(): AgentStep[] {
  return [
    {
      id: 'semantic',
      title: 'Semantic Breakdown',
      detail: 'Decomposing prompt themes, moods, and motion cues.',
      status: 'pending',
    },
    {
      id: 'compositor',
      title: 'Layer Composer',
      detail: 'Designing layered emitters, palettes, and rhythm grammar.',
      status: 'pending',
    },
    {
      id: 'render',
      title: 'Realtime Renderer',
      detail: 'Synthesizing frames, injecting film grain, and capturing WebM.',
      status: 'pending',
    },
  ];
}
