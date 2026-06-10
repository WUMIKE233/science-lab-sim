import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Atom,
  Beaker,
  BookOpenCheck,
  ChartSpline,
  ChevronRight,
  ClipboardList,
  ListFilter,
  Microscope,
  Pause,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
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

const subjectFilters: Array<Subject | "全部"> = ["全部", "物理", "化学", "生物"];

interface Snapshot {
  id: string;
  experimentId: string;
  title: string;
  subject: Subject;
  elapsed: number;
  readings: Array<{ label: string; value: string }>;
}

function formatControlValue(value: ExperimentParams[string], unit?: string) {
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function useClock(running: boolean) {
  const [time, setTime] = useState(0);
  const resetTime = useCallback(() => setTime(0), []);

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

  return { time, resetTime };
}

function createInitialParams(experiment: ExperimentModule) {
  return { ...experiment.defaults };
}

function App() {
  const [activeId, setActiveId] = useState(experiments[0].id);
  const [subjectFilter, setSubjectFilter] = useState<Subject | "全部">("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [paramsByExperiment, setParamsByExperiment] = useState<Record<string, ExperimentParams>>(() =>
    Object.fromEntries(experiments.map((experiment) => [experiment.id, createInitialParams(experiment)])),
  );
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [running, setRunning] = useState(true);
  const { time, resetTime } = useClock(running);
  const subjectCounts = useMemo(
    () =>
      experiments.reduce<Record<Subject, number>>(
        (counts, experiment) => ({
          ...counts,
          [experiment.subject]: counts[experiment.subject] + 1,
        }),
        { 物理: 0, 化学: 0, 生物: 0 },
      ),
    [],
  );
  const filteredExperiments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return experiments.filter((experiment) => {
      const subjectMatches = subjectFilter === "全部" || experiment.subject === subjectFilter;
      const text = [
        experiment.title,
        experiment.subject,
        experiment.summary,
        ...experiment.controls.map((control) => control.label),
      ].join(" ").toLowerCase();
      return subjectMatches && (!keyword || text.includes(keyword));
    });
  }, [searchTerm, subjectFilter]);
  const activeExperiment = experiments.find((experiment) => experiment.id === activeId) ?? experiments[0];
  const activeParams = paramsByExperiment[activeExperiment.id] ?? activeExperiment.defaults;
  const activeIndex = experiments.findIndex((experiment) => experiment.id === activeExperiment.id) + 1;
  const result = useMemo(
    () => activeExperiment.simulate(activeParams, time),
    [activeExperiment, activeParams, time],
  );

  useEffect(() => {
    if (filteredExperiments.length && !filteredExperiments.some((experiment) => experiment.id === activeId)) {
      setActiveId(filteredExperiments[0].id);
      resetTime();
    }
  }, [activeId, filteredExperiments, resetTime]);

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

  const captureSnapshot = () => {
    const snapshot: Snapshot = {
      id: `${activeExperiment.id}-${Date.now()}`,
      experimentId: activeExperiment.id,
      title: activeExperiment.title,
      subject: activeExperiment.subject,
      elapsed: time,
      readings: result.readings.map((reading) => ({ label: reading.label, value: reading.value })),
    };
    setSnapshots((current) => [snapshot, ...current].slice(0, 4));
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
        <div className="library-tools" aria-label="实验检索">
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="搜索实验"
              placeholder="搜索实验、参数或学科"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="filter-strip" aria-label="按学科筛选">
            {subjectFilters.map((filter) => (
              <button
                className={filter === subjectFilter ? "filter-chip active" : "filter-chip"}
                key={filter}
                onClick={() => setSubjectFilter(filter)}
                type="button"
              >
                {filter}
                <span>{filter === "全部" ? experiments.length : subjectCounts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <nav className="experiment-list">
          {filteredExperiments.map((experiment) => {
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
          {!filteredExperiments.length && (
            <div className="empty-state">
              <ListFilter size={18} />
              <p>没有匹配的实验</p>
            </div>
          )}
        </nav>
      </aside>

      <section className="lab-stage" aria-labelledby="experiment-title">
        <header className="stage-header">
          <div>
            <p className={`subject-pill ${subjectClass[activeExperiment.subject]}`}>{activeExperiment.subject}</p>
            <h2 id="experiment-title">{activeExperiment.title}</h2>
            <p className="experiment-summary">{activeExperiment.summary}</p>
            <div className="stage-meta" aria-label="实验库统计">
              <span>第 {activeIndex} / {experiments.length} 个实验</span>
              <span>{activeExperiment.controls.length} 个可调参数</span>
              <span>{result.readings.length} 项实时读数</span>
            </div>
          </div>
          <div className="stage-actions">
            <button className="icon-button" onClick={captureSnapshot} type="button" title="记录读数">
              <ClipboardList size={18} />
            </button>
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

            <section className="snapshot-panel" aria-label="读数记录">
              <div className="section-title">
                <ClipboardList size={17} />
                <h3>记录</h3>
                {snapshots.length > 0 && (
                  <button className="mini-icon-button" onClick={() => setSnapshots([])} type="button" title="清空记录">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {snapshots.length === 0 ? (
                <p className="snapshot-empty">暂无记录</p>
              ) : (
                <div className="snapshot-list">
                  {snapshots.map((snapshot) => (
                    <article className="snapshot-item" key={snapshot.id}>
                      <div>
                        <strong>{snapshot.title}</strong>
                        <span>{snapshot.subject} · {snapshot.elapsed.toFixed(1)} s</span>
                      </div>
                      <dl>
                        {snapshot.readings.slice(0, 3).map((reading) => (
                          <div key={`${snapshot.id}-${reading.label}`}>
                            <dt>{reading.label}</dt>
                            <dd>{reading.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="teaching-card" aria-label="课堂观察建议">
              <div className="section-title">
                <Target size={17} />
                <h3>观察建议</h3>
              </div>
              <ol>
                <li>先只调节「{activeExperiment.controls[0]?.label ?? "主要参数"}」，观察读数变化。</li>
                <li>记录「{result.readings[0]?.label ?? "关键读数"}」的变化趋势。</li>
                <li>重置后改变第二个参数，比较两次现象。</li>
              </ol>
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
