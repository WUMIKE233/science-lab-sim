import { useEffect, useMemo, useState } from "react";
import {
  Atom,
  Beaker,
  BookOpenCheck,
  ChartSpline,
  ChevronRight,
  Microscope,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { experiments } from "./data/experiments";
import type { ControlConfig, ExperimentModule, ExperimentParams, Subject } from "./types";

const subjectIcons: Record<Subject, typeof Atom> = {
  物理: Atom,
  化学: Beaker,
  生物: Microscope,
};

const subjectClass: Record<Subject, string> = {
  物理: "subject-physics",
  化学: "subject-chemistry",
  生物: "subject-biology",
};

function formatControlValue(value: ExperimentParams[string], unit?: string) {
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function useClock(running: boolean) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1000;
      previous = now;
      setTime((current) => current + delta);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  return { time, resetTime: () => setTime(0) };
}

function createInitialParams(experiment: ExperimentModule) {
  return { ...experiment.defaults };
}

function App() {
  const [activeId, setActiveId] = useState(experiments[0].id);
  const [paramsByExperiment, setParamsByExperiment] = useState<Record<string, ExperimentParams>>(() =>
    Object.fromEntries(experiments.map((experiment) => [experiment.id, createInitialParams(experiment)])),
  );
  const [running, setRunning] = useState(true);
  const { time, resetTime } = useClock(running);
  const activeExperiment = experiments.find((experiment) => experiment.id === activeId) ?? experiments[0];
  const activeParams = paramsByExperiment[activeExperiment.id] ?? activeExperiment.defaults;
  const result = useMemo(
    () => activeExperiment.simulate(activeParams, time),
    [activeExperiment, activeParams, time],
  );

  const setParam = (key: string, value: number | string | boolean) => {
    setParamsByExperiment((current) => ({
      ...current,
      [activeExperiment.id]: {
        ...current[activeExperiment.id],
        [key]: value,
      },
    }));
  };

  const resetExperiment = () => {
    setParamsByExperiment((current) => ({
      ...current,
      [activeExperiment.id]: createInitialParams(activeExperiment),
    }));
    resetTime();
  };

  return (
    <main className="app-shell">
      <aside className="lab-sidebar" aria-label="实验导航">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="eyebrow">Science Lab Sim</p>
            <h1>理科实验可视化仿真</h1>
          </div>
        </div>

        <nav className="experiment-list">
          {experiments.map((experiment) => {
            const Icon = subjectIcons[experiment.subject];
            const selected = experiment.id === activeExperiment.id;
            return (
              <button
                className={`experiment-tab ${selected ? "active" : ""}`}
                key={experiment.id}
                onClick={() => setActiveId(experiment.id)}
                type="button"
              >
                <span className={`subject-icon ${subjectClass[experiment.subject]}`}>
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{experiment.title}</strong>
                  <small>{experiment.subject}</small>
                </span>
                <ChevronRight className="tab-chevron" size={16} />
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="lab-stage" aria-labelledby="experiment-title">
        <header className="stage-header">
          <div>
            <p className={`subject-pill ${subjectClass[activeExperiment.subject]}`}>{activeExperiment.subject}</p>
            <h2 id="experiment-title">{activeExperiment.title}</h2>
            <p>{activeExperiment.summary}</p>
          </div>
          <div className="stage-actions">
            <button className="icon-button" onClick={() => setRunning((value) => !value)} type="button" title={running ? "暂停" : "播放"}>
              {running ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="icon-button" onClick={resetExperiment} type="button" title="重置">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <div className="workspace">
          <section className="visual-panel" aria-label="实验可视化">
            {activeExperiment.render({ params: activeParams, result, time })}
          </section>

          <aside className="control-panel" aria-label="参数控制与数据读数">
            <section className="panel-section">
              <div className="section-title">
                <SlidersHorizontal size={17} />
                <h3>参数</h3>
              </div>
              <div className="control-stack">
                {activeExperiment.controls.map((control) => (
                  <ControlField
                    control={control}
                    key={control.key}
                    value={activeParams[control.key]}
                    onChange={(value) => setParam(control.key, value)}
                  />
                ))}
              </div>
            </section>

            <section className="panel-section">
              <div className="section-title">
                <ChartSpline size={17} />
                <h3>读数</h3>
              </div>
              <div className="readout-grid">
                {result.readings.map((reading) => (
                  <div className={`readout ${reading.tone ?? "info"}`} key={reading.label}>
                    <span>{reading.label}</span>
                    <strong>{reading.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="status-strip">
              <BookOpenCheck size={18} />
              <p>{result.status}</p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ControlField({
  control,
  value,
  onChange,
}: {
  control: ControlConfig;
  value: ExperimentParams[string];
  onChange: (value: number | string | boolean) => void;
}) {
  if (control.type === "slider") {
    const numeric = Number(value);
    return (
      <label className="control-field">
        <span>
          {control.label}
          <strong>{formatControlValue(numeric, control.unit)}</strong>
        </span>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={numeric}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  }

  if (control.type === "number") {
    return (
      <label className="control-field number-field">
        <span>
          {control.label}
          <strong>{control.unit}</strong>
        </span>
        <input
          type="number"
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  }

  if (control.type === "select") {
    return (
      <label className="control-field select-field">
        <span>{control.label}</span>
        <select value={String(value)} onChange={(event) => onChange(event.target.value)}>
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="toggle-field">
      <span>{control.label}</span>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export default App;
