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
  const normalizedLength = clamp((length - 0.4) / 2, 0, 1);
  const lineLength = 152 + normalizedLength * 92;
  const referenceEndY = pivot.y + lineLength + 24;
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
      <line className="stand" x1="220" y1="54" x2="220" y2={referenceEndY} strokeDasharray="5 7" />
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
  const chartLeft = 62;
  const chartBottom = 304;
  const chartWidth = 296;
  const chartHeight = 68;
  const activeX = chartLeft + (voltage / 12) * chartWidth;
  const activeY = chartBottom - (voltage / 12) * chartHeight;
  const ivPath = points
    .map((point, index) => {
      const x = chartLeft + (point.x / 12) * chartWidth;
      const y = chartBottom - (point.y / Math.max(maxCurrent, 0.1)) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${round(x, 1)} ${round(y, 1)}`;
    })
    .join(" ");
  const current = voltage / resistance;
  const sliderX = 214 + clamp((resistance - 4) / 36, 0, 1) * 80;
  const glow = clamp(current / 1.4, 0.12, 1);

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="欧姆定律曲线">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="circuit-wire" d="M64 88 H356 V202 H64 Z" />
      <rect className="battery-body" x="54" y="118" width="46" height="54" rx="6" />
      <line className="battery-terminal" x1="76" y1="106" x2="76" y2="130" />
      <line className="battery-terminal short" x1="76" y1="162" x2="76" y2="184" />
      <text className="svg-label small" x="48" y="210">{voltage} V</text>

      <rect className="resistor-track" x="202" y="74" width="114" height="38" rx="8" />
      <path className="resistor-zigzag" d="M214 93 l10 -12 l10 24 l10 -24 l10 24 l10 -24 l10 24 l10 -24 l10 12" />
      <line className="resistor-slider" x1={sliderX} y1="62" x2={sliderX - 22} y2="110" />
      <circle className="active-dot" cx={sliderX} cy="62" r="7" />
      <text className="svg-label small" x="204" y="136">R = {resistance} Ω</text>

      <circle className="meter ammeter" cx="146" cy="202" r="32" />
      <text className="meter-text" x="146" y="198">A</text>
      <text className="meter-value" x="146" y="220">{round(current, 2)}</text>
      <rect className="meter voltmeter" x="252" y="174" width="82" height="56" rx="10" />
      <text className="meter-text" x="274" y="197">V</text>
      <text className="meter-value left" x="298" y="197">{round(voltage, 1)}</text>
      <circle className="bulb-glow" cx="356" cy="88" r={18 + glow * 10} opacity={0.2 + glow * 0.38} />
      <circle className="bulb" cx="356" cy="88" r="18" />

      <path className="axis ohm-axis" d="M62 304 H358 M62 304 V236" />
      <path className="chart-line ohm-line" d={ivPath} />
      <circle className="active-dot" cx={activeX} cy={activeY} r="7" />
      <text className="svg-label small" x="72" y="326">I-U 图：{result.readings[1].value}</text>
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

function ProjectileVisual({ params, time, result }: VisualProps) {
  const speed = asNumber(params, "speed");
  const angle = (asNumber(params, "angle") * Math.PI) / 180;
  const gravity = asNumber(params, "gravity");
  const flightTime = (2 * speed * Math.sin(angle)) / gravity;
  const range = speed * Math.cos(angle) * flightTime;
  const t = flightTime > 0 ? time % flightTime : 0;
  const x = speed * Math.cos(angle) * t;
  const y = speed * Math.sin(angle) * t - 0.5 * gravity * t * t;
  const points = Array.from({ length: 44 }, (_, index) => {
    const pointTime = (index / 43) * flightTime;
    return {
      x: speed * Math.cos(angle) * pointTime,
      y: Math.max(0, speed * Math.sin(angle) * pointTime - 0.5 * gravity * pointTime * pointTime),
    };
  });
  const maxHeight = Math.max(...points.map((point) => point.y), 1);
  const projectilePath = (pathPoints: Array<{ x: number; y: number }>) =>
    pathPoints
      .map((point, index) => {
        const px = 48 + (point.x / Math.max(range, 1)) * 344;
        const py = 292 - (point.y / maxHeight) * 210;
        return `${index === 0 ? "M" : "L"} ${round(px, 1)} ${round(py, 1)}`;
      })
      .join(" ");
  const progress = flightTime > 0 ? t / flightTime : 0;
  const trailPoints = points.filter((_, index) => index / 43 <= progress);
  const trail = trailPoints.length > 1 ? trailPoints : [points[0], { x, y: Math.max(y, 0) }];
  const ballX = 48 + (x / Math.max(range, 1)) * 344;
  const ballY = 292 - (Math.max(y, 0) / maxHeight) * 210;

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="抛体运动轨迹">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="axis" d="M48 292 H398 M48 292 V68" />
      <path className="trajectory guide" d={projectilePath(points)} />
      <path className="trajectory active-trail" d={projectilePath(trail)} />
      <line className="launch-vector" x1="48" y1="292" x2={48 + Math.cos(angle) * 72} y2={292 - Math.sin(angle) * 72} />
      <circle className="projectile" cx={ballX} cy={ballY} r="12" />
      <text className="svg-label" x="58" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="278" y="326">H = {result.readings[2].value}</text>
    </svg>
  );
}

function BuoyancyVisual({ params, result }: VisualProps) {
  const objectDensity = asNumber(params, "objectDensity");
  const fluid = asString(params, "fluid");
  const volume = asNumber(params, "volume");
  const fluidDensity = fluid === "salt" ? 1030 : fluid === "oil" ? 900 : 1000;
  const floats = objectDensity < fluidDensity;
  const sinkDepth = floats ? clamp(objectDensity / fluidDensity, 0.16, 0.92) : 1;
  const blockY = floats ? 104 + sinkDepth * 98 : 226;
  const blockHeight = clamp(44 + volume * 12, 46, 92);
  const waterColor = fluid === "oil" ? "#d7ba62" : fluid === "salt" ? "#91c7d6" : "#8fb9d5";

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="浮力与沉浮状态">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="tank" x="78" y="70" width="220" height="224" rx="8" />
      <rect className="fluid" x="86" y="124" width="204" height="162" fill={waterColor} />
      <line className="surface-wave" x1="86" y1="124" x2="290" y2="124" />
      <rect className="floating-block" x="160" y={blockY} width="64" height={blockHeight} rx="6" />
      <line className="force up" x1="318" y1="254" x2="318" y2="164" />
      <line className="force down" x1="354" y1="144" x2="354" y2="234" />
      <text className="svg-label" x="306" y="132">G</text>
      <text className="svg-label" x="306" y="276">F浮</text>
      <text className="svg-label" x="72" y="328">{result.readings[2].value}</text>
    </svg>
  );
}

function GasLawVisual({ params, result }: VisualProps) {
  const temperature = asNumber(params, "temperature");
  const moles = asNumber(params, "moles");
  const pistonLoad = asNumber(params, "pistonLoad");
  const pressure = 85 + pistonLoad * 35;
  const volume = (moles * 8.314 * (temperature + 273.15)) / pressure;
  const pistonY = clamp(270 - volume * 1.15, 88, 248);
  const molecules = Array.from({ length: 18 }, (_, index) => {
    const usableHeight = Math.max(34, 270 - pistonY - 20);
    return {
      x: 116 + ((index * 31 + Math.floor(temperature)) % 150),
      y: pistonY + 18 + ((index * 43 + Math.floor(moles * 20)) % usableHeight),
      hot: temperature > 55 && index % 3 === 0,
    };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="气体状态方程活塞模型">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="cylinder" x="92" y="58" width="196" height="232" rx="10" />
      <rect className="piston" x="100" y={pistonY} width="180" height="18" rx="5" />
      <rect className="weight" x="142" y={pistonY - 38} width="96" height="30" rx="6" />
      {molecules.map((molecule, index) => (
        <circle key={index} className={molecule.hot ? "gas-dot hot" : "gas-dot"} cx={molecule.x} cy={molecule.y} r="5" />
      ))}
      <path className="thermometer" d="M336 94 V250" />
      <circle className="thermo-bulb" cx="336" cy="268" r="18" />
      <rect className="thermo-fill" x="331" y={250 - clamp((temperature / 100) * 138, 10, 138)} width="10" height={clamp((temperature / 100) * 138, 10, 138)} rx="5" />
      <text className="svg-label" x="74" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="270" y="326">{result.readings[1].value}</text>
    </svg>
  );
}

function ChromatographyVisual({ params, result }: VisualProps) {
  const solventHeight = asNumber(params, "solventHeight");
  const sample = asString(params, "sample");
  const polarity = asNumber(params, "polarity");
  const solventY = 292 - solventHeight * 2.4;
  const components = sample === "ink"
    ? [
        { color: "#427aa1", rf: 0.28 + polarity * 0.08 },
        { color: "#6d508f", rf: 0.48 + polarity * 0.05 },
        { color: "#b95747", rf: 0.68 - polarity * 0.04 },
      ]
    : [
        { color: "#537d5d", rf: 0.32 + polarity * 0.06 },
        { color: "#b08d45", rf: 0.55 + polarity * 0.05 },
        { color: "#d7ba62", rf: 0.76 - polarity * 0.03 },
      ];

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="纸层析分离">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="beaker" x="88" y="52" width="264" height="256" rx="10" />
      <rect className="solvent" x="98" y={solventY} width="244" height={292 - solventY} />
      <rect className="paper-strip" x="184" y="44" width="72" height="244" rx="4" />
      <line className="baseline" x1="184" y1="250" x2="256" y2="250" />
      <line className="solvent-front" x1="184" y1={solventY} x2="256" y2={solventY} />
      {components.map((component, index) => (
        <ellipse
          key={component.color}
          className="chromato-spot"
          cx={220 + (index - 1) * 16}
          cy={250 - component.rf * (250 - solventY)}
          rx="13"
          ry="8"
          fill={component.color}
        />
      ))}
      <text className="svg-label" x="62" y="328">{sample === "ink" ? "墨水样品" : "叶绿素样品"}</text>
      <text className="svg-label" x="266" y="328">{result.readings[0].value}</text>
    </svg>
  );
}

function PhotosynthesisVisual({ params, result }: VisualProps) {
  const light = asNumber(params, "light");
  const co2 = asNumber(params, "co2");
  const temperature = asNumber(params, "temperature");
  const rate = Number(result.readings[0].value.replace("%", ""));
  const bubbles = Array.from({ length: 12 }, (_, index) => {
    const phase = (index * 23 + light) % 100;
    return {
      x: 250 + ((index * 31) % 76),
      y: 248 - phase * 1.55,
      r: 4 + (index % 3),
    };
  });
  const curve = Array.from({ length: 36 }, (_, index) => {
    const x = index;
    const simulatedLight = (index / 35) * 100;
    const y = Math.min(100, simulatedLight * 1.15) * (co2 / 100) * Math.exp(-Math.pow((temperature - 28) / 24, 2));
    return { x, y };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="光合作用速率">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <circle className="sun" cx="96" cy="82" r={22 + light * 0.08} />
      <path className="leaf" d="M118 234 C152 130 234 110 294 172 C250 260 170 280 118 234 Z" />
      <path className="leaf-vein" d="M130 232 C178 200 220 176 292 172" />
      {bubbles.map((bubble, index) => (
        <circle key={index} className="oxygen-bubble" cx={bubble.x} cy={bubble.y} r={bubble.r} opacity={clamp(rate / 100, 0.2, 1)} />
      ))}
      <path className="axis" d="M68 306 H202 M68 306 V210" />
      <path className="chart-line" d={curvePath(curve, 220, 326, 28)} transform="translate(34, 20) scale(.64, .42)" />
      <text className="svg-label" x="52" y="328">速率 {result.readings[0].value}</text>
      <text className="svg-label" x="272" y="328">CO₂ {co2}%</text>
    </svg>
  );
}

function GeneticsVisual({ params, result }: VisualProps) {
  const parentA = asString(params, "parentA");
  const parentB = asString(params, "parentB");
  const gametes = (genotype: string) => genotype === "AA" ? ["A", "A"] : genotype === "aa" ? ["a", "a"] : ["A", "a"];
  const a = gametes(parentA);
  const b = gametes(parentB);
  const cells = [
    [a[0] + b[0], a[0] + b[1]],
    [a[1] + b[0], a[1] + b[1]],
  ].map((row) => row.map((cell) => cell.split("").sort().reverse().join("")));

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="孟德尔遗传方格">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <text className="svg-label" x="80" y="70">亲本：{parentA} × {parentB}</text>
      <g transform="translate(114 96)">
        <rect className="punnett-head" x="76" y="0" width="76" height="52" rx="6" />
        <rect className="punnett-head" x="152" y="0" width="76" height="52" rx="6" />
        <rect className="punnett-head" x="0" y="52" width="76" height="76" rx="6" />
        <rect className="punnett-head" x="0" y="128" width="76" height="76" rx="6" />
        <text className="punnett-text" x="114" y="33">{b[0]}</text>
        <text className="punnett-text" x="190" y="33">{b[1]}</text>
        <text className="punnett-text" x="38" y="98">{a[0]}</text>
        <text className="punnett-text" x="38" y="174">{a[1]}</text>
        {cells.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect className={cell === "aa" ? "punnett-cell recessive" : "punnett-cell"} x={76 + colIndex * 76} y={52 + rowIndex * 76} width="76" height="76" rx="6" />
              <text className="punnett-text" x={114 + colIndex * 76} y={100 + rowIndex * 76}>{cell}</text>
            </g>
          )),
        )}
      </g>
      <text className="svg-label" x="62" y="328">{result.readings[0].value}</text>
      <text className="svg-label" x="264" y="328">{result.readings[1].value}</text>
    </svg>
  );
}

function HookeVisual({ params, result }: VisualProps) {
  const mass = asNumber(params, "mass");
  const spring = asNumber(params, "spring");
  const gravity = asNumber(params, "gravity");
  const extension = (mass * gravity) / spring;
  const visualExtension = clamp(extension * 180, 18, 140);
  const topY = 58;
  const bottomY = 112 + visualExtension;
  const coils = Array.from({ length: 9 }, (_, index) => {
    const y = topY + 18 + index * ((bottomY - topY - 36) / 8);
    const x = index % 2 === 0 ? 190 : 250;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="胡克定律弹簧伸长">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <line className="stand" x1="96" y1="58" x2="344" y2="58" />
      <line className="stand" x1="220" y1="58" x2="220" y2="76" />
      <polyline className="spring-coil" points={`220,76 ${coils} 220,${bottomY}`} />
      <rect className="mass-block" x="178" y={bottomY} width="84" height="58" rx="8" />
      <line className="measurement-line" x1="310" y1="112" x2="310" y2={bottomY} />
      <text className="svg-label" x="314" y={(112 + bottomY) / 2}>x</text>
      <text className="svg-label" x="76" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="268" y="326">{result.readings[1].value}</text>
    </svg>
  );
}

function SoundWaveVisual({ params, time, result }: VisualProps) {
  const frequency = asNumber(params, "frequency");
  const amplitude = asNumber(params, "amplitude");
  const phase = asNumber(params, "phase");
  const enabled = asBool(params, "secondWave");
  const wavePoints = Array.from({ length: 96 }, (_, index) => {
    const x = index / 95;
    const first = Math.sin(x * Math.PI * 6 + time * frequency * 0.018);
    const second = enabled ? Math.sin(x * Math.PI * 6 + time * frequency * 0.018 + (phase * Math.PI) / 180) : 0;
    return { x: index, y: 1 + (amplitude / 100) * (first + second) * 0.48 };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="声波叠加波形">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <circle className="speaker" cx="76" cy="176" r="30" />
      <path className="speaker-cone" d="M86 158 L128 128 V224 L86 194 Z" />
      <path className="axis" d="M132 176 H392" />
      <path className="sound-wave" d={curvePath(wavePoints, 404, 292, 32)} />
      <path className="sound-ring" d="M132 142 C160 164 160 188 132 210" />
      <path className="sound-ring wide" d="M150 116 C196 154 196 198 150 236" />
      <text className="svg-label" x="58" y="326">{frequency} Hz</text>
      <text className="svg-label" x="274" y="326">{result.readings[0].value}</text>
    </svg>
  );
}

function ElectrolysisVisual({ params, result }: VisualProps) {
  const voltage = asNumber(params, "voltage");
  const time = asNumber(params, "time");
  const concentration = asNumber(params, "concentration");
  const intensity = clamp((voltage * concentration) / 24, 0.15, 1);
  const bubbles = Array.from({ length: 22 }, (_, index) => ({
    x: index % 2 === 0 ? 154 + (index % 4) * 8 : 276 + (index % 4) * 8,
    y: 258 - ((index * 23 + time * 3) % 142),
    r: 3 + (index % 3),
  }));

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="电解水气体生成">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="electrolyzer" x="86" y="84" width="268" height="204" rx="10" />
      <rect className="electrolyte" x="96" y="132" width="248" height="146" />
      <line className="electrode cathode" x1="154" y1="94" x2="154" y2="266" />
      <line className="electrode anode" x1="286" y1="94" x2="286" y2="266" />
      <path className="wire" d="M154 94 V54 H286 V94" />
      <rect className="battery-body" x="196" y="40" width="48" height="32" rx="6" />
      {bubbles.map((bubble, index) => (
        <circle key={index} className="oxygen-bubble" cx={bubble.x} cy={bubble.y} r={bubble.r} opacity={intensity} />
      ))}
      <text className="svg-label" x="124" y="314">H₂</text>
      <text className="svg-label" x="286" y="314">O₂</text>
      <text className="svg-label" x="58" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="262" y="326">{result.readings[1].value}</text>
    </svg>
  );
}

function SolubilityVisual({ params, result }: VisualProps) {
  const temperature = asNumber(params, "temperature");
  const solute = asString(params, "solute");
  const mass = asNumber(params, "mass");
  const base = solute === "salt" ? 35 : 13;
  const slope = solute === "salt" ? 0.08 : 0.86;
  const soluble = base + slope * temperature;
  const precipitate = clamp(mass - soluble, 0, 90);
  const curve = Array.from({ length: 41 }, (_, index) => {
    const temp = index * 2.5;
    return { x: temp, y: base + slope * temp };
  });

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="溶解度与结晶">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <rect className="beaker" x="58" y="88" width="142" height="204" rx="10" />
      <rect className="solvent" x="68" y="142" width="122" height="140" />
      {Array.from({ length: Math.ceil(precipitate / 8) }, (_, index) => (
        <polygon key={index} className="crystal" points={`${86 + (index % 6) * 15},270 ${94 + (index % 6) * 15},258 ${102 + (index % 6) * 15},270 ${94 + (index % 6) * 15},280`} />
      ))}
      <path className="axis" d="M238 288 H392 M238 288 V88" />
      <path className="chart-line" d={curvePath(curve, 408, 316, 36)} transform="translate(204, 0) scale(.46, .86)" />
      <circle className="active-dot" cx={238 + (temperature / 100) * 154} cy={288 - (soluble / Math.max(...curve.map((point) => point.y))) * 170} r="7" />
      <text className="svg-label" x="58" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="260" y="326">{result.readings[1].value}</text>
    </svg>
  );
}

function EnzymeVisual({ params, result }: VisualProps) {
  const temperature = asNumber(params, "temperature");
  const ph = asNumber(params, "ph");
  const substrate = asNumber(params, "substrate");
  const rate = Number(result.readings[0].value.replace("%", ""));
  const enzymeOpen = 34 - rate * 0.18;
  const particles = Array.from({ length: 16 }, (_, index) => ({
    x: 62 + ((index * 47 + substrate) % 312),
    y: 80 + ((index * 31 + temperature) % 192),
  }));

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="酶活性影响因素">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="enzyme-body" d={`M166 178 C166 ${126 + enzymeOpen} 274 ${126 + enzymeOpen} 274 178 C274 ${228 - enzymeOpen} 166 ${228 - enzymeOpen} 166 178 Z`} />
      <circle className="active-site" cx="220" cy="178" r="26" />
      {particles.map((particle, index) => (
        <circle key={index} className={index % 3 === 0 ? "substrate-dot hot" : "substrate-dot"} cx={particle.x} cy={particle.y} r="7" />
      ))}
      <path className="axis" d="M64 302 H376" />
      <text className="svg-label" x="58" y="326">pH {ph}</text>
      <text className="svg-label" x="180" y="326">{temperature} °C</text>
      <text className="svg-label" x="298" y="326">{result.readings[0].value}</text>
    </svg>
  );
}

function PopulationVisual({ params, result }: VisualProps) {
  const initial = asNumber(params, "initial");
  const growth = asNumber(params, "growth");
  const carrying = asNumber(params, "carrying");
  const curve = Array.from({ length: 48 }, (_, index) => {
    const t = index / 4;
    const y = carrying / (1 + ((carrying - initial) / initial) * Math.exp(-growth * t));
    return { x: index, y };
  });
  const finalPopulation = curve[curve.length - 1].y;

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="种群增长曲线">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="axis" d="M64 292 H386 M64 292 V72" />
      <line className="threshold" x1="64" y1="94" x2="386" y2="94" />
      <path className="chart-line population-line" d={curvePath(curve, 410, 318, 38)} />
      {Array.from({ length: 18 }, (_, index) => (
        <circle key={index} className="population-dot" cx={82 + (index * 47) % 282} cy={240 - ((index * 29) % 118)} r={4 + (index % 3)} opacity={clamp(finalPopulation / carrying, 0.28, 1)} />
      ))}
      <text className="svg-label" x="70" y="326">{result.readings[0].value}</text>
      <text className="svg-label" x="256" y="326">K = {carrying}</text>
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
    id: "projectile",
    title: "抛体运动",
    subject: "物理",
    summary: "调节初速度、发射角和重力加速度，观察轨迹、射程和最大高度。",
    defaults: { speed: 22, angle: 42, gravity: 9.8 },
    controls: [
      { type: "slider", key: "speed", label: "初速度", unit: "m/s", min: 8, max: 40, step: 1 },
      { type: "slider", key: "angle", label: "发射角", unit: "°", min: 10, max: 80, step: 1 },
      { type: "slider", key: "gravity", label: "重力加速度", unit: "m/s²", min: 1.6, max: 12, step: 0.1 },
    ],
    simulate: (params) => {
      const speed = asNumber(params, "speed");
      const angle = (asNumber(params, "angle") * Math.PI) / 180;
      const gravity = asNumber(params, "gravity");
      const flightTime = (2 * speed * Math.sin(angle)) / gravity;
      const range = speed * Math.cos(angle) * flightTime;
      const maxHeight = (speed * speed * Math.sin(angle) * Math.sin(angle)) / (2 * gravity);
      return {
        readings: [
          { label: "射程", value: `${round(range, 1)} m`, tone: "good" },
          { label: "飞行时间", value: `${round(flightTime, 2)} s` },
          { label: "最大高度", value: `${round(maxHeight, 1)} m` },
        ],
        status: asNumber(params, "angle") > 45 ? "角度增大时最大高度提高，但水平分速度会减小。" : "接近 45° 时，在同一高度发射可获得较大射程。",
      };
    },
    render: (props) => <ProjectileVisual {...props} />,
  },
  {
    id: "buoyancy",
    title: "浮力与密度",
    subject: "物理",
    summary: "改变物体密度、体积和液体类型，判断物体上浮、悬浮或下沉。",
    defaults: { objectDensity: 760, volume: 3, fluid: "water" },
    controls: [
      { type: "slider", key: "objectDensity", label: "物体密度", unit: "kg/m³", min: 200, max: 1600, step: 20 },
      { type: "slider", key: "volume", label: "体积", unit: "L", min: 1, max: 8, step: 0.5 },
      {
        type: "select",
        key: "fluid",
        label: "液体",
        options: [
          { label: "水", value: "water" },
          { label: "盐水", value: "salt" },
          { label: "食用油", value: "oil" },
        ],
      },
    ],
    simulate: (params) => {
      const objectDensity = asNumber(params, "objectDensity");
      const volume = asNumber(params, "volume") / 1000;
      const fluid = asString(params, "fluid");
      const fluidDensity = fluid === "salt" ? 1030 : fluid === "oil" ? 900 : 1000;
      const buoyantForce = fluidDensity * 9.8 * volume;
      const weight = objectDensity * 9.8 * volume;
      const state = Math.abs(objectDensity - fluidDensity) < 30 ? "近似悬浮" : objectDensity < fluidDensity ? "上浮" : "下沉";
      return {
        readings: [
          { label: "浮力", value: `${round(buoyantForce, 1)} N`, tone: state === "上浮" ? "good" : "info" },
          { label: "重力", value: `${round(weight, 1)} N` },
          { label: "状态", value: state, tone: state === "下沉" ? "warn" : "good" },
        ],
        status: objectDensity < fluidDensity ? "物体密度小于液体密度，最终会漂浮。" : "物体密度大于液体密度时，重力超过可获得的浮力。",
      };
    },
    render: (props) => <BuoyancyVisual {...props} />,
  },
  {
    id: "hooke",
    title: "胡克定律",
    subject: "物理",
    summary: "调节质量、弹簧劲度系数和重力加速度，观察弹簧伸长量与弹力关系。",
    defaults: { mass: 0.6, spring: 24, gravity: 9.8 },
    controls: [
      { type: "slider", key: "mass", label: "质量", unit: "kg", min: 0.1, max: 2, step: 0.1 },
      { type: "slider", key: "spring", label: "劲度系数", unit: "N/m", min: 8, max: 60, step: 1 },
      { type: "slider", key: "gravity", label: "重力加速度", unit: "m/s²", min: 1.6, max: 12, step: 0.1 },
    ],
    simulate: (params) => {
      const mass = asNumber(params, "mass");
      const spring = asNumber(params, "spring");
      const gravity = asNumber(params, "gravity");
      const force = mass * gravity;
      const extension = force / spring;
      return {
        readings: [
          { label: "弹力", value: `${round(force, 2)} N`, tone: "good" },
          { label: "伸长量", value: `${round(extension * 100, 1)} cm` },
          { label: "关系", value: "F = kx" },
        ],
        status: spring < 20 ? "弹簧较软，同样重量会带来更明显的伸长。" : "劲度系数越大，同样弹力下伸长量越小。",
      };
    },
    render: (props) => <HookeVisual {...props} />,
  },
  {
    id: "sound-wave",
    title: "声波叠加",
    subject: "物理",
    summary: "调节频率、振幅与相位差，观察两列声波的叠加效果。",
    defaults: { frequency: 440, amplitude: 55, phase: 0, secondWave: true },
    controls: [
      { type: "slider", key: "frequency", label: "频率", unit: "Hz", min: 120, max: 1000, step: 20 },
      { type: "slider", key: "amplitude", label: "振幅", unit: "%", min: 10, max: 100, step: 1 },
      { type: "slider", key: "phase", label: "相位差", unit: "°", min: 0, max: 180, step: 5 },
      { type: "toggle", key: "secondWave", label: "第二列声波" },
    ],
    simulate: (params) => {
      const frequency = asNumber(params, "frequency");
      const amplitude = asNumber(params, "amplitude");
      const phase = asNumber(params, "phase");
      const enabled = asBool(params, "secondWave");
      const combined = enabled ? amplitude * Math.abs(1 + Math.cos((phase * Math.PI) / 180)) : amplitude;
      return {
        readings: [
          { label: "合成响度", value: `${round(clamp(combined, 0, 200), 0)}%`, tone: phase < 45 ? "good" : "info" },
          { label: "波长趋势", value: frequency > 600 ? "较短" : "较长" },
          { label: "相位差", value: `${phase}°` },
        ],
        status: enabled ? "相位接近时增强，相位差增大时叠加效果逐渐减弱。" : "只显示单列声波时，响度主要由振幅决定。",
      };
    },
    render: (props) => <SoundWaveVisual {...props} />,
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
    id: "gas-law",
    title: "气体状态方程",
    subject: "化学",
    summary: "用活塞模型观察温度、物质的量和外压如何影响气体体积。",
    defaults: { temperature: 35, moles: 1.2, pistonLoad: 2 },
    controls: [
      { type: "slider", key: "temperature", label: "温度", unit: "°C", min: 0, max: 100, step: 1 },
      { type: "slider", key: "moles", label: "物质的量", unit: "mol", min: 0.5, max: 2.5, step: 0.1 },
      { type: "slider", key: "pistonLoad", label: "活塞负载", unit: "级", min: 0, max: 5, step: 0.5 },
    ],
    simulate: (params) => {
      const temperature = asNumber(params, "temperature") + 273.15;
      const moles = asNumber(params, "moles");
      const pressure = 85 + asNumber(params, "pistonLoad") * 35;
      const volume = (moles * 8.314 * temperature) / pressure;
      return {
        readings: [
          { label: "体积", value: `${round(volume, 1)} L`, tone: "good" },
          { label: "压强", value: `${round(pressure, 0)} kPa` },
          { label: "关系", value: "PV = nRT" },
        ],
        status: "温度或物质的量升高会使气体体积增大，外压增大会压缩气体。",
      };
    },
    render: (props) => <GasLawVisual {...props} />,
  },
  {
    id: "chromatography",
    title: "纸层析分离",
    subject: "化学",
    summary: "观察不同样品在溶剂前沿推动下的分离效果和 Rf 值。",
    defaults: { solventHeight: 58, sample: "ink", polarity: 0.5 },
    controls: [
      { type: "slider", key: "solventHeight", label: "溶剂前沿", unit: "mm", min: 20, max: 90, step: 1 },
      {
        type: "select",
        key: "sample",
        label: "样品",
        options: [
          { label: "彩色墨水", value: "ink" },
          { label: "叶绿素提取液", value: "leaf" },
        ],
      },
      { type: "slider", key: "polarity", label: "溶剂极性", min: 0, max: 1, step: 0.05 },
    ],
    simulate: (params) => {
      const solventHeight = asNumber(params, "solventHeight");
      const polarity = asNumber(params, "polarity");
      const mainRf = clamp(0.34 + polarity * 0.32, 0.2, 0.86);
      return {
        readings: [
          { label: "主斑点 Rf", value: round(mainRf, 2), tone: "good" },
          { label: "前沿距离", value: `${round(solventHeight, 0)} mm` },
          { label: "分离度", value: polarity > 0.35 && polarity < 0.8 ? "较好" : "一般" },
        ],
        status: "组分在固定相和流动相中的分配不同，因此移动距离不同。",
      };
    },
    render: (props) => <ChromatographyVisual {...props} />,
  },
  {
    id: "electrolysis",
    title: "电解水",
    subject: "化学",
    summary: "调节电压、电解质浓度和时间，观察氢气与氧气按比例生成。",
    defaults: { voltage: 6, concentration: 1, time: 20 },
    controls: [
      { type: "slider", key: "voltage", label: "电压", unit: "V", min: 1, max: 12, step: 0.5 },
      { type: "slider", key: "concentration", label: "电解质浓度", unit: "mol/L", min: 0.2, max: 2, step: 0.1 },
      { type: "slider", key: "time", label: "电解时间", unit: "min", min: 1, max: 60, step: 1 },
    ],
    simulate: (params) => {
      const voltage = asNumber(params, "voltage");
      const concentration = asNumber(params, "concentration");
      const time = asNumber(params, "time");
      const current = voltage * concentration * 0.12;
      const hydrogen = current * time * 0.42;
      const oxygen = hydrogen / 2;
      return {
        readings: [
          { label: "氢气", value: `${round(hydrogen, 1)} mL`, tone: "good" },
          { label: "氧气", value: `${round(oxygen, 1)} mL` },
          { label: "体积比", value: "2 : 1" },
        ],
        status: "水电解生成氢气和氧气，理论体积比约为 2:1。",
      };
    },
    render: (props) => <ElectrolysisVisual {...props} />,
  },
  {
    id: "solubility",
    title: "溶解度与结晶",
    subject: "化学",
    summary: "比较温度、溶质类型和加入质量对溶解与析晶状态的影响。",
    defaults: { temperature: 40, solute: "nitrate", mass: 60 },
    controls: [
      { type: "slider", key: "temperature", label: "温度", unit: "°C", min: 0, max: 100, step: 1 },
      {
        type: "select",
        key: "solute",
        label: "溶质",
        options: [
          { label: "硝酸钾", value: "nitrate" },
          { label: "食盐", value: "salt" },
        ],
      },
      { type: "slider", key: "mass", label: "加入质量", unit: "g", min: 10, max: 120, step: 1 },
    ],
    simulate: (params) => {
      const temperature = asNumber(params, "temperature");
      const solute = asString(params, "solute");
      const mass = asNumber(params, "mass");
      const base = solute === "salt" ? 35 : 13;
      const slope = solute === "salt" ? 0.08 : 0.86;
      const soluble = base + slope * temperature;
      const precipitate = Math.max(mass - soluble, 0);
      return {
        readings: [
          { label: "溶解度", value: `${round(soluble, 1)} g`, tone: precipitate > 0 ? "warn" : "good" },
          { label: "析出质量", value: `${round(precipitate, 1)} g` },
          { label: "状态", value: precipitate > 0 ? "有晶体" : "全溶解" },
        ],
        status: solute === "salt" ? "食盐溶解度随温度变化较小。" : "硝酸钾溶解度随温度升高明显增加。",
      };
    },
    render: (props) => <SolubilityVisual {...props} />,
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
  {
    id: "photosynthesis",
    title: "光合作用速率",
    subject: "生物",
    summary: "调节光照、二氧化碳和温度，观察限制因素如何改变产氧速率。",
    defaults: { light: 65, co2: 70, temperature: 28 },
    controls: [
      { type: "slider", key: "light", label: "光照强度", unit: "%", min: 0, max: 100, step: 1 },
      { type: "slider", key: "co2", label: "CO₂ 浓度", unit: "%", min: 10, max: 100, step: 1 },
      { type: "slider", key: "temperature", label: "温度", unit: "°C", min: 5, max: 45, step: 1 },
    ],
    simulate: (params) => {
      const light = asNumber(params, "light");
      const co2 = asNumber(params, "co2");
      const temperature = asNumber(params, "temperature");
      const tempFactor = Math.exp(-Math.pow((temperature - 28) / 16, 2));
      const rate = clamp(Math.min(light * 1.18, 100) * (co2 / 100) * tempFactor, 0, 100);
      const limiting = light < 35 ? "光照" : co2 < 40 ? "CO₂" : temperature < 15 || temperature > 38 ? "温度" : "综合条件";
      return {
        readings: [
          { label: "相对速率", value: `${round(rate, 0)}%`, tone: rate > 55 ? "good" : "warn" },
          { label: "限制因素", value: limiting },
          { label: "适宜温度", value: "约 28°C" },
        ],
        status: `当前主要受${limiting}影响。光合作用常由最低效的条件限制。`,
      };
    },
    render: (props) => <PhotosynthesisVisual {...props} />,
  },
  {
    id: "genetics",
    title: "孟德尔遗传方格",
    subject: "生物",
    summary: "选择亲本基因型，观察子代基因型和显性性状比例。",
    defaults: { parentA: "Aa", parentB: "Aa", trait: "round" },
    controls: [
      {
        type: "select",
        key: "parentA",
        label: "亲本 A",
        options: [
          { label: "AA 显性纯合", value: "AA" },
          { label: "Aa 杂合", value: "Aa" },
          { label: "aa 隐性纯合", value: "aa" },
        ],
      },
      {
        type: "select",
        key: "parentB",
        label: "亲本 B",
        options: [
          { label: "AA 显性纯合", value: "AA" },
          { label: "Aa 杂合", value: "Aa" },
          { label: "aa 隐性纯合", value: "aa" },
        ],
      },
      {
        type: "select",
        key: "trait",
        label: "性状",
        options: [
          { label: "豌豆圆粒", value: "round" },
          { label: "高茎", value: "tall" },
        ],
      },
    ],
    simulate: (params) => {
      const gametes = (genotype: string) => genotype === "AA" ? ["A", "A"] : genotype === "aa" ? ["a", "a"] : ["A", "a"];
      const a = gametes(asString(params, "parentA"));
      const b = gametes(asString(params, "parentB"));
      const children = [a[0] + b[0], a[0] + b[1], a[1] + b[0], a[1] + b[1]].map((child) => child.split("").sort().reverse().join(""));
      const dominant = children.filter((child) => child !== "aa").length;
      const recessive = children.length - dominant;
      return {
        readings: [
          { label: "显性比例", value: `${dominant}/4`, tone: dominant >= 3 ? "good" : "info" },
          { label: "隐性比例", value: `${recessive}/4` },
          { label: "基因型", value: Array.from(new Set(children)).join(" / ") },
        ],
        status: "每个亲本各提供一个等位基因，组合结果决定子代基因型和表现型。",
      };
    },
    render: (props) => <GeneticsVisual {...props} />,
  },
  {
    id: "enzyme",
    title: "酶活性",
    subject: "生物",
    summary: "调节温度、pH 和底物浓度，观察酶促反应速率如何变化。",
    defaults: { temperature: 37, ph: 7, substrate: 70 },
    controls: [
      { type: "slider", key: "temperature", label: "温度", unit: "°C", min: 0, max: 70, step: 1 },
      { type: "slider", key: "ph", label: "pH", min: 2, max: 12, step: 0.1 },
      { type: "slider", key: "substrate", label: "底物浓度", unit: "%", min: 10, max: 100, step: 1 },
    ],
    simulate: (params) => {
      const temperature = asNumber(params, "temperature");
      const ph = asNumber(params, "ph");
      const substrate = asNumber(params, "substrate");
      const tempFactor = Math.exp(-Math.pow((temperature - 37) / 18, 2));
      const phFactor = Math.exp(-Math.pow((ph - 7) / 2.2, 2));
      const rate = clamp(substrate * tempFactor * phFactor, 0, 100);
      return {
        readings: [
          { label: "反应速率", value: `${round(rate, 0)}%`, tone: rate > 55 ? "good" : "warn" },
          { label: "最适 pH", value: "约 7" },
          { label: "温度影响", value: temperature > 55 ? "可能失活" : "可逆变化" },
        ],
        status: "酶活性通常在适宜温度和 pH 附近最高，偏离后速率会下降。",
      };
    },
    render: (props) => <EnzymeVisual {...props} />,
  },
  {
    id: "population",
    title: "种群增长",
    subject: "生物",
    summary: "调节初始数量、增长率和环境容纳量，观察 S 型增长曲线。",
    defaults: { initial: 24, growth: 0.42, carrying: 360 },
    controls: [
      { type: "slider", key: "initial", label: "初始数量", unit: "个", min: 10, max: 100, step: 5 },
      { type: "slider", key: "growth", label: "增长率", unit: "1/年", min: 0.1, max: 0.9, step: 0.05 },
      { type: "slider", key: "carrying", label: "环境容纳量", unit: "个", min: 120, max: 600, step: 20 },
    ],
    simulate: (params) => {
      const initial = asNumber(params, "initial");
      const growth = asNumber(params, "growth");
      const carrying = asNumber(params, "carrying");
      const finalPopulation = carrying / (1 + ((carrying - initial) / initial) * Math.exp(-growth * 12));
      return {
        readings: [
          { label: "末期数量", value: `${round(finalPopulation, 0)} 个`, tone: finalPopulation > carrying * 0.85 ? "good" : "info" },
          { label: "增长率", value: round(growth, 2) },
          { label: "容纳量", value: `${carrying} 个` },
        ],
        status: finalPopulation > carrying * 0.85 ? "种群逐渐接近环境容纳量，增长速度会放缓。" : "资源仍较充足时，种群数量会继续较快增加。",
      };
    },
    render: (props) => <PopulationVisual {...props} />,
  },
];
