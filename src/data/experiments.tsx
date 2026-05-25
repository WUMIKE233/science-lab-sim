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
  const ballX = 48 + (x / Math.max(range, 1)) * 344;
  const ballY = 292 - (Math.max(y, 0) / maxHeight) * 210;

  return (
    <svg className="simulation-svg" viewBox="0 0 440 360" role="img" aria-label="抛体运动轨迹">
      <rect className="svg-grid" x="24" y="24" width="392" height="312" rx="6" />
      <path className="axis" d="M48 292 H398 M48 292 V68" />
      <path className="trajectory" d={curvePath(points, 392, 316, 48)} />
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
];
