import type { ExperimentModule, ExperimentParams, SimulationResult, VisualProps } from "../types";

const asNumber = (params: ExperimentParams, key: string) => Number(params[key]);
const asString = (params: ExperimentParams, key: string) => String(params[key]);
const asBool = (params: ExperimentParams, key: string) => Boolean(params[key]);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 2) => value.toFixed(digits);

const curvePath = (
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number,
  pad = 24,
) => {
  if (!points.length) return "";
  const maxX = Math.max(...points.map((point) => point.x), 1);
  const maxY = Math.max(...points.map((point) => point.y), 1);
  return points
    .map((point, index) => {
      const x = pad + (point.x / maxX) * (width - pad * 2);
      const y = height - pad - (point.y / maxY) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"} ${round(x, 1)} ${round(y, 1)}`;
    })
    .join(" ");
};

function PendulumVisual({ params, time }: VisualProps) {
  const length = asNumber(params, "length");
  const gravity = asNumber(params, "gravity");
  const angle = asNumber(params, "angle");
  const showTrace = asBool(params, "trace");
  const period = 2 * Math.PI * Math.sqrt(length / gravity);
  const theta = (angle * Math.PI) / 180 * Math.cos((2 * Math.PI * time) / period);
  const pivot = { x: 220, y: 54 };
  const lineLength = 210 + length * 70;
  const bob = {
    x: pivot.x + Math.sin(theta) * lineLength,
    y: pivot.y + Math.cos(theta) * lineLength,
  };
  const trace = Array.from({ length: 28 }, (_, index) => {
    const t = (index / 27) * Math.PI * 2;
    const a = (angle * Math.PI) / 180 * Math.cos(t);
    const x = pivot.x + Math.sin(a) * lineLength;
    const y = pivot.y + Math.cos(a) * lineLength;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="单摆运动仿真">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <line className="stand" x1="78" y1="54" x2="362" y2="54" />
      <line className="stand" x1="220" y1="54" x2="220" y2="318" strokeDasharray="5 7" />
      {showTrace && <polyline className="trace" points={trace} />}
      <line className="ray strong" x1={pivot.x} y1={pivot.y} x2={bob.x} y2={bob.y} />
      <circle className="pivot" cx={pivot.x} cy={pivot.y} r="8" />
      <circle className="bob" cx={bob.x} cy={bob.y} r="23" />
      <text className="svg-label" x="34" y="316">T = {round(period, 2)} s</text>
    </svg>
  );
}

function OhmVisual({ params, result }: VisualProps) {
  const voltage = asNumber(params, "voltage");
  const resistance = asNumber(params, "resistance");
  const maxCurrent = 12 / resistance;
  const points = Array.from({ length: 13 }, (_, v) => ({ x: v, y: v / resistance }));
  const activeX = 52 + (voltage / 12) * 296;
  const activeY = 278 - ((voltage / resistance) / Math.max(maxCurrent, 0.1)) * 196;

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="欧姆定律曲线">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="wire" d="M80 86 H184 V126 H256 V86 H360 V212 H80 Z" />
      <rect className="component" x="184" y="112" width="72" height="28" rx="4" />
      <circle className="meter" cx="96" cy="212" r="26" />
      <text className="meter-text" x="96" y="218">A</text>
      <path className="axis" d="M52 278 H348 M52 278 V82" />
      <path className="chart-line" d={curvePath(points, 344, 304, 52)} />
      <circle className="active-dot" cx={activeX} cy={activeY} r="7" />
      <text className="svg-label" x="272" y="126">{resistance} Ω</text>
      <text className="svg-label" x="276" y="312">{result.readings[1].value}</text>
    </svg>
  );
}

function LensVisual({ params }: VisualProps) {
  const objectDistance = asNumber(params, "objectDistance");
  const focalLength = asNumber(params, "focalLength");
  const objectHeight = asNumber(params, "objectHeight");
  const denominator = objectDistance - focalLength;
  const imageDistance = Math.abs(denominator) < 0.2 ? 24 : (focalLength * objectDistance) / denominator;
  const scale = 7;
  const lensX = 220;
  const axisY = 184;
  const objectX = lensX - objectDistance * scale;
  const objectTopY = axisY - objectHeight * 12;
  const imageX = lensX + clamp(imageDistance, -20, 24) * scale;
  const imageHeight = denominator > 0 ? (-imageDistance / objectDistance) * objectHeight * 12 : (Math.abs(imageDistance) / objectDistance) * objectHeight * 12;
  const imageTopY = axisY + imageHeight;

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="凸透镜成像光路">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <line className="axis" x1="42" y1={axisY} x2="398" y2={axisY} />
      <ellipse className="lens" cx={lensX} cy={axisY} rx="16" ry="126" />
      <line className="focus" x1={lensX - focalLength * scale} y1="169" x2={lensX - focalLength * scale} y2="199" />
      <line className="focus" x1={lensX + focalLength * scale} y1="169" x2={lensX + focalLength * scale} y2="199" />
      <line className="object" x1={objectX} y1={axisY} x2={objectX} y2={objectTopY} />
      <polygon className="object-head" points={`${objectX - 8},${objectTopY + 12} ${objectX},${objectTopY} ${objectX + 8},${objectTopY + 12}`} />
      <line className="ray" x1={objectX} y1={objectTopY} x2={lensX} y2={objectTopY} />
      <line className="ray" x1={lensX} y1={objectTopY} x2={imageX} y2={imageTopY} />
      <line className="ray alt" x1={objectX} y1={objectTopY} x2={lensX} y2={axisY} />
      <line className="ray alt" x1={lensX} y1={axisY} x2={imageX} y2={imageTopY} />
      <line className="image-arrow" x1={imageX} y1={axisY} x2={imageX} y2={imageTopY} />
      <text className="svg-label" x="54" y="318">f = {focalLength} cm</text>
      <text className="svg-label" x="302" y="318">v = {round(imageDistance, 1)} cm</text>
    </svg>
  );
}

function TitrationVisual({ params, result }: VisualProps) {
  const volume = asNumber(params, "baseVolume");
  const acid = asNumber(params, "acidConcentration");
  const base = asNumber(params, "baseConcentration");
  const equivalent = (25 * acid) / base;
  const progress = clamp(volume / equivalent, 0, 1.4);
  const ph = Number(result.readings[2].value);
  const liquid = ph < 6.2 ? "#f7b7be" : ph < 8.2 ? "#dfe5d9" : "#b78fc9";
  const curve = Array.from({ length: 36 }, (_, index) => {
    const x = (index / 35) * equivalent * 1.45;
    const delta = x - equivalent;
    const y = 2.4 + 9.4 / (1 + Math.exp(-delta * 1.25));
    return { x, y };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="酸碱中和滴定">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="burette" x="104" y="38" width="34" height="176" rx="8" />
      <line className="drop-line" x1="121" y1="214" x2="121" y2="247" />
      <circle className="drop" cx="121" cy={242 + Math.sin(progress * 18) * 5} r="5" />
      <path className="flask" d="M80 306 C98 248 108 228 108 204 H136 C136 228 148 248 166 306 Z" />
      <path className="liquid" d="M91 292 C108 276 139 276 155 292 L149 308 H97 Z" fill={liquid} />
      <path className="axis" d="M210 290 H394 M210 290 V78" />
      <path className="chart-line" d={curvePath(curve, 408, 316, 36)} transform="translate(174, 0) scale(.52, .88)" />
      <line className="threshold" x1={210 + progress * 128} y1="88" x2={210 + progress * 128} y2="290" />
      <text className="svg-label" x="70" y="328">酚酞颜色</text>
      <text className="svg-label" x="250" y="328">pH {round(ph, 2)}</text>
    </svg>
  );
}

function ReactionVisual({ params, result }: VisualProps) {
  const temperature = asNumber(params, "temperature");
  const catalyst = asString(params, "catalyst") === "yes";
  const concentration = asNumber(params, "concentration");
  const k = 0.012 * Math.pow(1.08, temperature - 25) * (catalyst ? 2.4 : 1) * concentration;
  const curve = Array.from({ length: 40 }, (_, index) => {
    const t = index * 0.7;
    return { x: t, y: concentration * Math.exp(-k * t) };
  });
  const particles = Array.from({ length: 24 }, (_, index) => {
    const x = 58 + ((index * 37 + temperature * 2) % 142);
    const y = 76 + ((index * 53 + concentration * 20) % 178);
    const hot = (index + Math.floor(temperature)) % 3 === 0;
    return { x, y, hot };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="反应速率曲线">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="reactor" x="44" y="54" width="180" height="224" rx="8" />
      {particles.map((particle, index) => (
        <circle
          key={index}
          className={particle.hot ? "particle hot" : "particle"}
          cx={particle.x}
          cy={particle.y}
          r={particle.hot ? 7 : 5}
        />
      ))}
      {catalyst && <path className="catalyst" d="M72 278 C118 246 154 246 204 278" />}
      <path className="axis" d="M260 286 H398 M260 286 V72" />
      <path className="chart-line decay" d={curvePath(curve, 422, 314, 36)} transform="translate(222, 0) scale(.43, .88)" />
      <text className="svg-label" x="52" y="310">碰撞频率</text>
      <text className="svg-label" x="262" y="320">{result.readings[0].value}</text>
    </svg>
  );
}

function CellVisual({ params }: VisualProps) {
  const specimen = asString(params, "specimen");
  const magnification = asNumber(params, "magnification");
  const stain = asBool(params, "stain");
  const cells = specimen === "onion"
    ? Array.from({ length: 18 }, (_, index) => ({
        x: 92 + (index % 6) * 38,
        y: 84 + Math.floor(index / 6) * 54,
        w: 32,
        h: 44,
      }))
    : Array.from({ length: 14 }, (_, index) => ({
        x: 86 + ((index * 47) % 214),
        y: 78 + ((index * 61) % 190),
        w: 28 + (index % 4) * 5,
        h: 22 + (index % 3) * 6,
      }));
  const zoom = magnification / 100;

  return (
    <svg className="simulation-svg microscope-svg" viewBox="0 0 440 360" role="img" aria-label="显微镜细胞观察">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <circle className="microscope-field" cx="220" cy="178" r="132" />
      <g transform={`translate(${220 - 220 * zoom} ${178 - 178 * zoom}) scale(${zoom})`}>
        {cells.map((cell, index) => (
          <g key={index}>
            {specimen === "onion" ? (
              <rect
                className={stain ? "cell stained" : "cell"}
                x={cell.x}
                y={cell.y}
                width={cell.w}
                height={cell.h}
                rx="5"
              />
            ) : (
              <ellipse
                className={stain ? "cell stained" : "cell"}
                cx={cell.x}
                cy={cell.y}
                rx={cell.w}
                ry={cell.h}
              />
            )}
            <circle className="nucleus" cx={cell.x + cell.w * 0.48} cy={cell.y + cell.h * 0.48} r="5" />
          </g>
        ))}
      </g>
      <circle className="field-mask" cx="220" cy="178" r="132" />
      <text className="svg-label" x="58" y="326">{magnification}x</text>
      <text className="svg-label" x="312" y="326">{specimen === "onion" ? "洋葱表皮" : "口腔上皮"}</text>
    </svg>
  );
}

export const experiments: ExperimentModule[] = [
  {
    id: "pendulum",
    title: "单摆周期",
    subject: "物理",
    summary: "观察摆长和重力加速度如何改变简谐摆动周期。",
    defaults: { length: 1.2, gravity: 9.8, angle: 16, trace: true },
    controls: [
      { type: "slider", key: "length", label: "摆长", unit: "m", min: 0.4, max: 2.4, step: 0.1 },
      { type: "slider", key: "gravity", label: "重力加速度", unit: "m/s²", min: 1.6, max: 12, step: 0.1 },
      { type: "slider", key: "angle", label: "初始角度", unit: "°", min: 4, max: 28, step: 1 },
      { type: "toggle", key: "trace", label: "显示轨迹" },
    ],
    simulate: (params) => {
      const length = asNumber(params, "length");
      const gravity = asNumber(params, "gravity");
      const period = 2 * Math.PI * Math.sqrt(length / gravity);
      return {
        readings: [
          { label: "周期", value: `${round(period, 2)} s`, tone: "good" },
          { label: "频率", value: `${round(1 / period, 2)} Hz` },
          { label: "模型", value: "小角度近似" },
        ],
        status: length > 1.8 ? "摆长增大，周期随之变长。" : "周期主要由摆长与重力加速度决定。",
      };
    },
    render: (props) => <PendulumVisual {...props} />,
  },
  {
    id: "ohm",
    title: "欧姆定律",
    subject: "物理",
    summary: "调节电压和电阻，实时查看电流与 I-V 关系。",
    defaults: { voltage: 6, resistance: 12, circuit: "series" },
    controls: [
      { type: "slider", key: "voltage", label: "电压", unit: "V", min: 0, max: 12, step: 0.5 },
      { type: "slider", key: "resistance", label: "电阻", unit: "Ω", min: 4, max: 40, step: 1 },
      {
        type: "select",
        key: "circuit",
        label: "电路",
        options: [
          { label: "单电阻", value: "series" },
          { label: "等效演示", value: "equivalent" },
        ],
      },
    ],
    simulate: (params) => {
      const voltage = asNumber(params, "voltage");
      const resistance = asNumber(params, "resistance");
      const current = voltage / resistance;
      return {
        readings: [
          { label: "电流", value: `${round(current, 3)} A`, tone: current > 1 ? "warn" : "good" },
          { label: "关系", value: "I = U / R" },
          { label: "功率", value: `${round(voltage * current, 2)} W` },
        ],
        chart: Array.from({ length: 13 }, (_, v) => ({ x: v, y: v / resistance })),
        status: "电阻保持不变时，电流与电压成正比。",
      };
    },
    render: (props) => <OhmVisual {...props} />,
  },
  {
    id: "lens",
    title: "凸透镜成像",
    subject: "物理",
    summary: "改变物距、焦距和物高，观察实像与虚像位置。",
    defaults: { objectDistance: 24, focalLength: 10, objectHeight: 4 },
    controls: [
      { type: "slider", key: "objectDistance", label: "物距", unit: "cm", min: 6, max: 36, step: 1 },
      { type: "slider", key: "focalLength", label: "焦距", unit: "cm", min: 6, max: 18, step: 1 },
      { type: "slider", key: "objectHeight", label: "物高", unit: "cm", min: 2, max: 7, step: 0.5 },
    ],
    simulate: (params) => {
      const u = asNumber(params, "objectDistance");
      const f = asNumber(params, "focalLength");
      const denominator = u - f;
      const v = Math.abs(denominator) < 0.2 ? Infinity : (f * u) / denominator;
      const real = v > 0;
      return {
        readings: [
          { label: "像距", value: Number.isFinite(v) ? `${round(v, 1)} cm` : "无穷远", tone: real ? "good" : "info" },
          { label: "像性质", value: real ? "倒立实像" : "正立虚像" },
          { label: "放大率", value: Number.isFinite(v) ? round(Math.abs(v / u), 2) : "∞" },
        ],
        status: u > 2 * f ? "物体在二倍焦距外，形成缩小的实像。" : u > f ? "物体在一倍到二倍焦距之间，形成放大的实像。" : "物体在焦距内，形成正立放大的虚像。",
      };
    },
    render: (props) => <LensVisual {...props} />,
  },
  {
    id: "titration",
    title: "酸碱中和滴定",
    subject: "化学",
    summary: "模拟强酸强碱滴定曲线与酚酞颜色变化。",
    defaults: { acidConcentration: 0.1, baseConcentration: 0.1, baseVolume: 24 },
    controls: [
      { type: "number", key: "acidConcentration", label: "酸浓度", unit: "mol/L", min: 0.05, max: 0.3, step: 0.01 },
      { type: "number", key: "baseConcentration", label: "碱浓度", unit: "mol/L", min: 0.05, max: 0.3, step: 0.01 },
      { type: "slider", key: "baseVolume", label: "滴加碱体积", unit: "mL", min: 0, max: 60, step: 0.5 },
    ],
    simulate: (params) => {
      const acid = asNumber(params, "acidConcentration");
      const base = asNumber(params, "baseConcentration");
      const volume = asNumber(params, "baseVolume");
      const acidMol = acid * 0.025;
      const baseMol = base * (volume / 1000);
      const totalVolume = 0.025 + volume / 1000;
      const excess = baseMol - acidMol;
      const ph = Math.abs(excess) < 0.00002
        ? 7
        : excess > 0
          ? 14 + Math.log10(excess / totalVolume)
          : -Math.log10(Math.abs(excess) / totalVolume);
      const equivalent = (25 * acid) / base;
      return {
        readings: [
          { label: "等当点", value: `${round(equivalent, 1)} mL` },
          { label: "滴加体积", value: `${round(volume, 1)} mL` },
          { label: "pH", value: round(clamp(ph, 0, 14), 2), tone: Math.abs(volume - equivalent) < 1 ? "warn" : "good" },
        ],
        status: Math.abs(volume - equivalent) < 1 ? "接近等当点，pH 会出现明显突跃。" : volume < equivalent ? "溶液仍偏酸性。" : "碱已过量，溶液偏碱性。",
      };
    },
    render: (props) => <TitrationVisual {...props} />,
  },
  {
    id: "reaction-rate",
    title: "反应速率",
    subject: "化学",
    summary: "比较温度、浓度和催化剂对反应速率的影响。",
    defaults: { temperature: 28, concentration: 1, catalyst: "no" },
    controls: [
      { type: "slider", key: "temperature", label: "温度", unit: "°C", min: 10, max: 70, step: 1 },
      { type: "slider", key: "concentration", label: "反应物浓度", unit: "mol/L", min: 0.4, max: 2.2, step: 0.1 },
      {
        type: "select",
        key: "catalyst",
        label: "催化剂",
        options: [
          { label: "无", value: "no" },
          { label: "加入", value: "yes" },
        ],
      },
    ],
    simulate: (params) => {
      const temperature = asNumber(params, "temperature");
      const concentration = asNumber(params, "concentration");
      const catalyst = asString(params, "catalyst") === "yes";
      const rate = 0.012 * Math.pow(1.08, temperature - 25) * concentration * (catalyst ? 2.4 : 1);
      return {
        readings: [
          { label: "速率常数", value: `${round(rate, 3)} min⁻¹`, tone: rate > 0.08 ? "warn" : "good" },
          { label: "半衰时间", value: `${round(Math.log(2) / rate, 1)} min` },
          { label: "催化剂", value: catalyst ? "已加入" : "未加入" },
        ],
        status: catalyst ? "催化剂降低反应活化能，曲线下降更快。" : "升温或提高浓度会增加有效碰撞。",
      };
    },
    render: (props) => <ReactionVisual {...props} />,
  },
  {
    id: "microscope",
    title: "显微镜细胞观察",
    subject: "生物",
    summary: "切换样本、倍率和染色状态，观察细胞结构差异。",
    defaults: { specimen: "onion", magnification: 100, stain: true },
    controls: [
      {
        type: "select",
        key: "specimen",
        label: "样本",
        options: [
          { label: "洋葱表皮", value: "onion" },
          { label: "口腔上皮", value: "cheek" },
        ],
      },
      { type: "slider", key: "magnification", label: "倍率", unit: "x", min: 40, max: 400, step: 20 },
      { type: "toggle", key: "stain", label: "碘液染色" },
    ],
    simulate: (params) => {
      const specimen = asString(params, "specimen");
      const magnification = asNumber(params, "magnification");
      const stain = asBool(params, "stain");
      return {
        readings: [
          { label: "视野倍率", value: `${magnification}x`, tone: "good" },
          { label: "细胞类型", value: specimen === "onion" ? "植物细胞" : "动物细胞" },
          { label: "细胞核", value: stain ? "更清晰" : "较浅" },
        ],
        status: specimen === "onion" ? "植物细胞排列规则，可见细胞壁。" : "动物细胞形态较圆润，没有细胞壁。",
      };
    },
    render: (props) => <CellVisual {...props} />,
  },
];
