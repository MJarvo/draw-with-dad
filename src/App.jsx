import { useState, useRef, useEffect, useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ═══════════════════════════════════════════════════════════════════════
// MECHANICS — matches real ArtWorkout behaviour:
//
// Each step adds ONE visible element to the drawing.
// Steps are interleaved — not all outlines then all colour.
// If the element is a FILLED shape → ghost is a solid coloured region
//   (kid colours it in with thick brush)
// If the element is a THIN LINE → ghost is a dashed stroke
//   (kid traces it with thin brush)
//
// completedSVG = everything fully rendered up to (not including) this step
// ghost        = white/bright dashed guide showing only the NEW element
// The ghost sits on Layer 4 (topmost) so it's always visible
//
// Art style: bold flat cartoon, thick black outlines, expressive faces,
// cel-shaded fills — like the ArtWorkout "Soda pop" image shown.
// ═══════════════════════════════════════════════════════════════════════

const SW = 6;      // standard outline stroke width
const BG = "#fafaf8"; // canvas bg

// Ghost helpers — grey so kids see colour appear as they draw over the guide
const GW = 5;
const GD = "12 6";

// Side-effect: gFill stores the intended colour so auto-colour can read it
let _lastGhostFill = "#E53935";

// Render solid outline group
const ol = (children, sw=SW) => (
  <g fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
    {children}
  </g>
);

// Ghost: thin line guide — grey dashes, kids trace over with dark brush
const gLine = (children) => (
  <g fill="none" stroke="#AAAAAA" strokeWidth={GW} strokeDasharray={GD} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}>
    {children}
  </g>
);

// Ghost: filled shape guide — grey fill + grey dashed border
// The real colour appears as the kid draws over the grey region
const gFill = (fillColor, children) => {
  _lastGhostFill = fillColor;
  return (
    <g opacity={0.75}>
      <g fill="#CCCCCC" stroke="none">{children}</g>
      <g fill="none" stroke="#AAAAAA" strokeWidth={GW} strokeDasharray={GD} strokeLinejoin="round" strokeLinecap="round">{children}</g>
    </g>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🍕 PIZZA SLICE
// ═══════════════════════════════════════════════════════════════════════
const PIZZA_STEPS = [
  {
    hint: "Colour in the pizza base 🍕",
    type: "fill",
    ghost: () => gFill("#F5C842",
      <path d="M200,60 L52,385 Q200,420 348,385 Z"/>
    ),
    completedSVG: () => null,
  },
  {
    hint: "Trace the outline of the slice",
    type: "line",
    ghost: () => gLine(
      <path d="M200,60 L52,385 Q200,420 348,385 Z"/>
    ),
    completedSVG: () => (
      <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
    ),
  },
  {
    hint: "Colour the crust golden brown 🟤",
    type: "fill",
    ghost: () => gFill("#C8853A",
      <path d="M52,385 Q200,430 348,385 Q200,410 52,385 Z" />
    ),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        {ol(<path d="M200,60 L52,385 Q200,420 348,385 Z"/>)}
      </>
    ),
  },
  {
    hint: "Paint the tomato sauce red 🍅",
    type: "fill",
    ghost: () => gFill("#D93B2B",
      <path d="M200,100 L80,368 Q200,388 320,368 Z"/>
    ),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        <path d="M52,385 Q200,415 348,385 Q200,408 52,385Z" fill="#C8853A"/>
        {ol(<path d="M200,60 L52,385 Q200,420 348,385 Z"/>)}
        {ol(<path d="M52,385 Q200,415 348,385 Q200,408 52,385Z"/>)}
      </>
    ),
  },
  {
    hint: "Paint the melted cheese yellow 🧀",
    type: "fill",
    ghost: () => gFill("#F7DC6F",
      <path d="M200,108 L88,355 Q200,374 312,355 Z"/>
    ),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        <path d="M52,385 Q200,415 348,385 Q200,408 52,385Z" fill="#C8853A"/>
        <path d="M200,100 L80,368 Q200,388 320,368 Z" fill="#D93B2B"/>
        {ol(<path d="M200,60 L52,385 Q200,420 348,385 Z"/>)}
        {ol(<path d="M52,385 Q200,415 348,385 Q200,408 52,385Z"/>)}
        {ol(<path d="M200,100 L80,368 Q200,388 320,368 Z"/>)}
      </>
    ),
  },
  {
    hint: "Draw 3 pepperoni circles 🔴",
    type: "fill",
    ghost: () => gFill("#C0392B",
      <><circle cx="200" cy="240" r="28"/><circle cx="148" cy="308" r="22"/><circle cx="252" cy="308" r="22"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        <path d="M52,385 Q200,415 348,385 Q200,408 52,385Z" fill="#C8853A"/>
        <path d="M200,100 L80,368 Q200,388 320,368 Z" fill="#D93B2B"/>
        <path d="M200,108 L88,355 Q200,374 312,355 Z" fill="#F7DC6F"/>
        {ol(<path d="M200,60 L52,385 Q200,420 348,385 Z"/>)}
        {ol(<path d="M52,385 Q200,415 348,385 Q200,408 52,385Z"/>)}
        {ol(<path d="M200,100 L80,368 Q200,388 320,368 Z"/>)}
        {ol(<path d="M200,108 L88,355 Q200,374 312,355 Z"/>)}
      </>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🌈 RAINBOW
// ═══════════════════════════════════════════════════════════════════════
const RAINBOW_STEPS = [
  {
    hint: "Colour the red band 🔴",
    type: "fill",
    ghost: () => gFill("#E53935",
      <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z"/>
    ),
    completedSVG: () => null,
  },
  {
    hint: "Colour the orange band 🟠",
    type: "fill",
    ghost: () => gFill("#FF9800",
      <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z"/>
    ),
    completedSVG: () => (
      <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
    ),
  },
  {
    hint: "Colour the yellow band 💛",
    type: "fill",
    ghost: () => gFill("#FFD600",
      <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z"/>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
      </>
    ),
  },
  {
    hint: "Colour the green band 💚",
    type: "fill",
    ghost: () => gFill("#4CAF50",
      <path d="M162,340 Q162,232 200,232 Q238,232 238,340 L200,340 Z"/>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
        <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z" fill="#FFD600"/>
      </>
    ),
  },
  {
    hint: "Outline the whole rainbow arc",
    type: "line",
    ghost: () => gLine(
      <><path d="M38,340 Q38,120 200,120 Q362,120 362,340"/><path d="M82,340 Q82,160 200,160 Q318,160 318,340"/><path d="M122,340 Q122,196 200,196 Q278,196 278,340"/><path d="M162,340 Q162,232 200,232 Q238,232 238,340"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
        <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z" fill="#FFD600"/>
        <path d="M162,340 Q162,232 200,232 Q238,232 238,340 L200,340 Z" fill="#4CAF50"/>
      </>
    ),
  },
  {
    hint: "Draw the left fluffy cloud ☁️",
    type: "fill",
    ghost: () => gFill("#ffffff",
      <><circle cx="72" cy="340" r="42"/><circle cx="108" cy="322" r="36"/><circle cx="50" cy="322" r="28"/><rect x="42" y="340" width="108" height="40" rx="8"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
        <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z" fill="#FFD600"/>
        <path d="M162,340 Q162,232 200,232 Q238,232 238,340 L200,340 Z" fill="#4CAF50"/>
        {ol(<><path d="M38,340 Q38,120 200,120 Q362,120 362,340"/><path d="M82,340 Q82,160 200,160 Q318,160 318,340"/><path d="M122,340 Q122,196 200,196 Q278,196 278,340"/><path d="M162,340 Q162,232 200,232 Q238,232 238,340"/></>, 5)}
      </>
    ),
  },
  {
    hint: "Draw the right fluffy cloud ☁️",
    type: "fill",
    ghost: () => gFill("#ffffff",
      <><circle cx="328" cy="340" r="42"/><circle cx="292" cy="322" r="36"/><circle cx="350" cy="322" r="28"/><rect x="250" y="340" width="108" height="40" rx="8"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
        <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z" fill="#FFD600"/>
        <path d="M162,340 Q162,232 200,232 Q238,232 238,340 L200,340 Z" fill="#4CAF50"/>
        {ol(<><path d="M38,340 Q38,120 200,120 Q362,120 362,340"/><path d="M82,340 Q82,160 200,160 Q318,160 318,340"/><path d="M122,340 Q122,196 200,196 Q278,196 278,340"/><path d="M162,340 Q162,232 200,232 Q238,232 238,340"/></>, 5)}
        <circle cx="72" cy="340" r="42" fill="#fff"/><circle cx="108" cy="322" r="36" fill="#fff"/><circle cx="50" cy="322" r="28" fill="#fff"/><rect x="42" y="340" width="108" height="40" rx="8" fill="#fff"/>
        {ol(<><circle cx="72" cy="340" r="42"/><circle cx="108" cy="322" r="36"/><circle cx="50" cy="322" r="28"/></>, 5)}
      </>
    ),
  },
  {
    hint: "Add the sun peeking out ☀️",
    type: "fill",
    ghost: () => gFill("#FFD600",
      <><circle cx="200" cy="130" r="44"/>{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=a*Math.PI/180;return<line key={i} x1={200+52*Math.cos(r)} y1={130+52*Math.sin(r)} x2={200+70*Math.cos(r)} y2={130+70*Math.sin(r)} strokeWidth="8" strokeLinecap="round" stroke="#FFD600"/>})}</>
    ),
    completedSVG: () => (
      <>
        <path d="M38,340 Q38,120 200,120 Q362,120 362,340 L318,340 Q318,160 200,160 Q82,160 82,340 Z" fill="#E53935"/>
        <path d="M82,340 Q82,160 200,160 Q318,160 318,340 L278,340 Q278,196 200,196 Q122,196 122,340 Z" fill="#FF9800"/>
        <path d="M122,340 Q122,196 200,196 Q278,196 278,340 L238,340 Q238,232 200,232 Q162,232 162,340 Z" fill="#FFD600"/>
        <path d="M162,340 Q162,232 200,232 Q238,232 238,340 L200,340 Z" fill="#4CAF50"/>
        {ol(<><path d="M38,340 Q38,120 200,120 Q362,120 362,340"/><path d="M82,340 Q82,160 200,160 Q318,160 318,340"/><path d="M122,340 Q122,196 200,196 Q278,196 278,340"/><path d="M162,340 Q162,232 200,232 Q238,232 238,340"/></>, 5)}
        <circle cx="72" cy="340" r="42" fill="#fff"/><circle cx="108" cy="322" r="36" fill="#fff"/><circle cx="50" cy="322" r="28" fill="#fff"/><rect x="42" y="340" width="108" height="40" rx="8" fill="#fff"/>
        <circle cx="328" cy="340" r="42" fill="#fff"/><circle cx="292" cy="322" r="36" fill="#fff"/><circle cx="350" cy="322" r="28" fill="#fff"/><rect x="250" y="340" width="108" height="40" rx="8" fill="#fff"/>
        {ol(<><circle cx="72" cy="340" r="42"/><circle cx="108" cy="322" r="36"/><circle cx="50" cy="322" r="28"/><circle cx="328" cy="340" r="42"/><circle cx="292" cy="322" r="36"/><circle cx="350" cy="322" r="28"/></>, 5)}
      </>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🍦 ICE CREAM
// ═══════════════════════════════════════════════════════════════════════
const ICE_CREAM_STEPS = [
  {
    hint: "Colour the waffle cone 🍦",
    type: "fill",
    ghost: () => gFill("#D4870A",
      <path d="M155,295 L200,430 L245,295 Z"/>
    ),
    completedSVG: () => null,
  },
  {
    hint: "Outline the cone shape",
    type: "line",
    ghost: () => gLine(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>),
    completedSVG: () => (
      <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
    ),
  },
  {
    hint: "Colour the pink strawberry scoop 🍓",
    type: "fill",
    ghost: () => gFill("#F48FB1",
      <ellipse cx="200" cy="252" rx="72" ry="64"/>
    ),
    completedSVG: () => (
      <>
        <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
        {ol(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>)}
      </>
    ),
  },
  {
    hint: "Colour the mint choc chip scoop 🍃",
    type: "fill",
    ghost: () => gFill("#80CBC4",
      <ellipse cx="200" cy="178" rx="68" ry="60"/>
    ),
    completedSVG: () => (
      <>
        <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
        {ol(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>)}
        <ellipse cx="200" cy="252" rx="72" ry="64" fill="#F48FB1"/>
        {ol(<ellipse cx="200" cy="252" rx="72" ry="64"/>)}
      </>
    ),
  },
  {
    hint: "Draw the drips of ice cream 💧",
    type: "line",
    ghost: () => gLine(<><path d="M158,268 Q150,290 155,310"/><path d="M242,268 Q250,290 245,310"/><path d="M185,310 Q178,330 183,348"/></>),
    completedSVG: () => (
      <>
        <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
        {ol(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>)}
        <ellipse cx="200" cy="252" rx="72" ry="64" fill="#F48FB1"/>
        {ol(<ellipse cx="200" cy="252" rx="72" ry="64"/>)}
        <ellipse cx="200" cy="178" rx="68" ry="60" fill="#80CBC4"/>
        {ol(<ellipse cx="200" cy="178" rx="68" ry="60"/>)}
      </>
    ),
  },
  {
    hint: "Draw the chocolate chips 🍫",
    type: "fill",
    ghost: () => gFill("#4E342E",
      <><ellipse cx="178" cy="162" rx="10" ry="7" transform="rotate(-20,178,162)"/><ellipse cx="215" cy="155" rx="10" ry="7" transform="rotate(15,215,155)"/><ellipse cx="198" cy="185" rx="10" ry="7" transform="rotate(-5,198,185)"/><ellipse cx="170" cy="185" rx="8" ry="6"/><ellipse cx="228" cy="178" rx="8" ry="6" transform="rotate(25,228,178)"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
        {ol(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>)}
        <ellipse cx="200" cy="252" rx="72" ry="64" fill="#F48FB1"/>
        {ol(<ellipse cx="200" cy="252" rx="72" ry="64"/>)}
        <ellipse cx="200" cy="178" rx="68" ry="60" fill="#80CBC4"/>
        {ol(<ellipse cx="200" cy="178" rx="68" ry="60"/>)}
        {ol(<><path d="M158,268 Q150,290 155,310"/><path d="M242,268 Q250,290 245,310"/><path d="M185,310 Q178,330 183,348"/></>, 5)}
      </>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🚗 CAR
// ═══════════════════════════════════════════════════════════════════════
const CAR_STEPS = [
  {
    hint: "Colour the car body red 🔴",
    type: "fill",
    ghost: () => gFill("#E53935",
      <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>
    ),
    completedSVG: () => null,
  },
  {
    hint: "Outline the car body shape",
    type: "line",
    ghost: () => gLine(
      <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>
    ),
    completedSVG: () => (
      <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
    ),
  },
  {
    hint: "Colour the windows blue 🔵",
    type: "fill",
    ghost: () => gFill("#90CAF9",
      <><path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z"/><path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
        {ol(<path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>)}
      </>
    ),
  },
  {
    hint: "Colour the bumpers grey",
    type: "fill",
    ghost: () => gFill("#9E9E9E",
      <rect x="48" y="258" width="304" height="20" rx="10"/>
    ),
    completedSVG: () => (
      <>
        <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
        {ol(<path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>)}
        <path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z" fill="#90CAF9"/>
        <path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z" fill="#90CAF9"/>
        {ol(<><path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z"/><path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z"/></>)}
      </>
    ),
  },
  {
    hint: "Draw the two big wheels 🟤",
    type: "fill",
    ghost: () => gFill("#424242",
      <><circle cx="110" cy="288" r="42"/><circle cx="290" cy="288" r="42"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
        {ol(<path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>)}
        <path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z" fill="#90CAF9"/>
        <path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z" fill="#90CAF9"/>
        {ol(<><path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z"/><path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z"/></>)}
        <rect x="48" y="258" width="304" height="20" rx="10" fill="#9E9E9E"/>
        {ol(<rect x="48" y="258" width="304" height="20" rx="10"/>)}
      </>
    ),
  },
  {
    hint: "Draw the wheel hubcaps ⚪",
    type: "fill",
    ghost: () => gFill("#eeeeee",
      <><circle cx="110" cy="288" r="20"/><circle cx="290" cy="288" r="20"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
        {ol(<path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>)}
        <path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z" fill="#90CAF9"/>
        <path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z" fill="#90CAF9"/>
        {ol(<><path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z"/><path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z"/></>)}
        <rect x="48" y="258" width="304" height="20" rx="10" fill="#9E9E9E"/>
        {ol(<rect x="48" y="258" width="304" height="20" rx="10"/>)}
        <circle cx="110" cy="288" r="42" fill="#424242"/>
        <circle cx="290" cy="288" r="42" fill="#424242"/>
        {ol(<><circle cx="110" cy="288" r="42"/><circle cx="290" cy="288" r="42"/></>)}
      </>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🦖 T-REX
// Detailed dinosaur — body, tail, head, belly, legs, teeth, eye, arm, claws, spines
// ═══════════════════════════════════════════════════════════════════════
const TREX_C = { body:"#4CAF50", dark:"#2E7D32", belly:"#C8E6C9", mid:"#388E3C" };
const _trexBase = <>
  <path d="M88,232 Q88,166 172,154 Q258,142 284,198 Q310,238 282,300 Q250,346 163,343 Q86,337 88,284 Z" fill={TREX_C.body}/>
  <path d="M94,270 Q54,292 28,344 Q10,380 38,382 Q63,385 82,349 Q102,314 116,285 Z" fill={TREX_C.body}/>
  <path d="M260,163 Q265,117 312,99 Q364,84 391,117 Q417,149 401,183 Q386,218 356,226 Q318,236 292,221 Q261,202 260,176 Z" fill={TREX_C.body}/>
</>;
const _trexBelly = <path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z" fill={TREX_C.belly}/>;
const _trexOutline = ol(<>
  <path d="M88,232 Q88,166 172,154 Q258,142 284,198 Q310,238 282,300 Q250,346 163,343 Q86,337 88,284 Z"/>
  <path d="M94,270 Q54,292 28,344 Q10,380 38,382 Q63,385 82,349 Q102,314 116,285 Z"/>
  <path d="M260,163 Q265,117 312,99 Q364,84 391,117 Q417,149 401,183 Q386,218 356,226 Q318,236 292,221 Q261,202 260,176 Z"/>
</>);
const _trexJaw = <path d="M266,213 Q275,237 320,246 Q364,252 384,230 Q404,212 401,196" fill="none" stroke="#1a1a1a" strokeWidth={SW} strokeLinecap="round"/>;
const _trexLegs = <>
  <path d="M148,337 L130,402 Q122,430 143,434 Q167,437 178,418 Q184,402 178,386 L175,337 Z" fill={TREX_C.dark}/>
  <path d="M220,332 L222,390 Q222,418 246,423 Q270,427 274,410 Q278,394 266,378 L260,332 Z" fill={TREX_C.dark}/>
</>;
const _trexLegOutline = ol(<>
  <path d="M148,337 L130,402 Q122,430 143,434 Q167,437 178,418 Q184,402 178,386 L175,337 Z"/>
  <path d="M220,332 L222,390 Q222,418 246,423 Q270,427 274,410 Q278,394 266,378 L260,332 Z"/>
</>);
const _trexTeeth = <>
  <rect x="269" y="213" width="13" height="20" rx="4" fill="white"/>
  <rect x="286" y="212" width="13" height="22" rx="4" fill="white"/>
  <rect x="303" y="211" width="13" height="22" rx="4" fill="white"/>
  <rect x="320" y="212" width="13" height="21" rx="4" fill="white"/>
  <rect x="337" y="213" width="12" height="19" rx="4" fill="white"/>
  <rect x="352" y="215" width="11" height="17" rx="4" fill="white"/>
  <rect x="366" y="218" width="10" height="14" rx="4" fill="white"/>
  <rect x="278" y="228" width="10" height="14" rx="3" fill="white"/>
  <rect x="293" y="226" width="10" height="16" rx="3" fill="white"/>
  <rect x="308" y="225" width="10" height="17" rx="3" fill="white"/>
  <rect x="323" y="226" width="10" height="15" rx="3" fill="white"/>
  <rect x="337" y="229" width="9" height="12" rx="3" fill="white"/>
</>;
const _trexEye = <>
  <circle cx="346" cy="138" r="17" fill="white"/>
  <circle cx="350" cy="143" r="10" fill="#1a1a1a"/>
  <circle cx="346" cy="138" r="4" fill="white"/>
</>;
const _trexArm = <>
  <path d="M269,196 Q292,181 310,196 Q320,209 308,217 Q292,213 278,204 Z" fill={TREX_C.mid}/>
  {ol(<path d="M269,196 Q292,181 310,196 Q320,209 308,217 Q292,213 278,204 Z"/>)}
  {ol(<><line x1="310" y1="196" x2="322" y2="188"/><line x1="310" y1="196" x2="320" y2="202"/><line x1="310" y1="196" x2="314" y2="212"/></>, 4)}
</>;
const _trexClaws = ol(<>
  <line x1="122" y1="434" x2="110" y2="444"/><line x1="133" y1="434" x2="127" y2="446"/>
  <line x1="145" y1="434" x2="144" y2="447"/><line x1="157" y1="430" x2="162" y2="440"/>
  <line x1="224" y1="423" x2="218" y2="436"/><line x1="236" y1="425" x2="236" y2="438"/>
  <line x1="249" y1="423" x2="254" y2="434"/><line x1="263" y1="416" x2="270" y2="425"/>
</>, 5);
const _trexSpines = ol(<>
  <path d="M174,154 Q170,132 180,120 Q188,110 192,128 Q196,144 205,152"/>
  <path d="M205,152 Q202,132 212,122 Q220,114 222,130 Q224,146 230,153"/>
  <path d="M230,153 Q228,136 237,127 Q244,120 245,135 Q246,150 252,160"/>
</>, 5);

const TREX_STEPS = [
  {
    hint: "Colour the big green body",
    type: "fill",
    ghost: () => gFill(TREX_C.body, <>
      <path d="M88,232 Q88,166 172,154 Q258,142 284,198 Q310,238 282,300 Q250,346 163,343 Q86,337 88,284 Z"/>
      <path d="M94,270 Q54,292 28,344 Q10,380 38,382 Q63,385 82,349 Q102,314 116,285 Z"/>
    </>),
    completedSVG: () => null,
  },
  {
    hint: "Colour the big head green",
    type: "fill",
    ghost: () => gFill(TREX_C.body,
      <path d="M260,163 Q265,117 312,99 Q364,84 391,117 Q417,149 401,183 Q386,218 356,226 Q318,236 292,221 Q261,202 260,176 Z"/>
    ),
    completedSVG: () => <>
      <path d="M88,232 Q88,166 172,154 Q258,142 284,198 Q310,238 282,300 Q250,346 163,343 Q86,337 88,284 Z" fill={TREX_C.body}/>
      <path d="M94,270 Q54,292 28,344 Q10,380 38,382 Q63,385 82,349 Q102,314 116,285 Z" fill={TREX_C.body}/>
    </>,
  },
  {
    hint: "Colour the pale belly",
    type: "fill",
    ghost: () => gFill(TREX_C.belly,
      <path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>
    ),
    completedSVG: () => <>{_trexBase}{_trexOutline}</>,
  },
  {
    hint: "Outline the body and head",
    type: "line",
    ghost: () => gLine(<>
      <path d="M88,232 Q88,166 172,154 Q258,142 284,198 Q310,238 282,300 Q250,346 163,343 Q86,337 88,284 Z"/>
      <path d="M94,270 Q54,292 28,344 Q10,380 38,382 Q63,385 82,349 Q102,314 116,285 Z"/>
      <path d="M260,163 Q265,117 312,99 Q364,84 391,117 Q417,149 401,183 Q386,218 356,226 Q318,236 292,221 Q261,202 260,176 Z"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}</>,
  },
  {
    hint: "Colour the dark green legs",
    type: "fill",
    ghost: () => gFill(TREX_C.dark, <>
      <path d="M148,337 L130,402 Q122,430 143,434 Q167,437 178,418 Q184,402 178,386 L175,337 Z"/>
      <path d="M220,332 L222,390 Q222,418 246,423 Q270,427 274,410 Q278,394 266,378 L260,332 Z"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}</>,
  },
  {
    hint: "Outline the legs and draw toe claws",
    type: "line",
    ghost: () => gLine(<>
      <path d="M148,337 L130,402 Q122,430 143,434 Q167,437 178,418 Q184,402 178,386 L175,337 Z"/>
      <path d="M220,332 L222,390 Q222,418 246,423 Q270,427 274,410 Q278,394 266,378 L260,332 Z"/>
      <line x1="122" y1="434" x2="110" y2="444"/><line x1="133" y1="434" x2="127" y2="446"/>
      <line x1="145" y1="434" x2="144" y2="447"/><line x1="157" y1="430" x2="162" y2="440"/>
      <line x1="224" y1="423" x2="218" y2="436"/><line x1="236" y1="425" x2="236" y2="438"/>
      <line x1="249" y1="423" x2="254" y2="434"/><line x1="263" y1="416" x2="270" y2="425"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}</>,
  },
  {
    hint: "Fill in the white teeth",
    type: "fill",
    ghost: () => gFill("white", <>
      <rect x="269" y="213" width="13" height="20" rx="4"/>
      <rect x="286" y="212" width="13" height="22" rx="4"/>
      <rect x="303" y="211" width="13" height="22" rx="4"/>
      <rect x="320" y="212" width="13" height="21" rx="4"/>
      <rect x="337" y="213" width="12" height="19" rx="4"/>
      <rect x="352" y="215" width="11" height="17" rx="4"/>
      <rect x="278" y="228" width="10" height="14" rx="3"/>
      <rect x="293" y="226" width="10" height="16" rx="3"/>
      <rect x="308" y="225" width="10" height="17" rx="3"/>
      <rect x="323" y="226" width="10" height="15" rx="3"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}</>,
  },
  {
    hint: "Draw the outline of each tooth",
    type: "line",
    ghost: () => gLine(<>
      <rect x="269" y="213" width="13" height="20" rx="4"/>
      <rect x="286" y="212" width="13" height="22" rx="4"/>
      <rect x="303" y="211" width="13" height="22" rx="4"/>
      <rect x="320" y="212" width="13" height="21" rx="4"/>
      <rect x="337" y="213" width="12" height="19" rx="4"/>
      <rect x="278" y="228" width="10" height="14" rx="3"/>
      <rect x="293" y="226" width="10" height="16" rx="3"/>
      <rect x="308" y="225" width="10" height="17" rx="3"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}{_trexTeeth}</>,
  },
  {
    hint: "Fill in the big white eye",
    type: "fill",
    ghost: () => gFill("white", <circle cx="346" cy="138" r="17"/>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}{_trexTeeth}{ol(<><rect x="269" y="213" width="13" height="20" rx="4"/><rect x="286" y="212" width="13" height="22" rx="4"/><rect x="303" y="211" width="13" height="22" rx="4"/><rect x="320" y="212" width="13" height="21" rx="4"/><rect x="337" y="213" width="12" height="19" rx="4"/><rect x="278" y="228" width="10" height="14" rx="3"/><rect x="293" y="226" width="10" height="16" rx="3"/><rect x="308" y="225" width="10" height="17" rx="3"/></>)}</>,
  },
  {
    hint: "Draw the dark pupil and eye shine",
    type: "line",
    ghost: () => gLine(<><circle cx="346" cy="138" r="17"/><circle cx="350" cy="143" r="10"/><circle cx="346" cy="138" r="4"/></>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}{_trexTeeth}{ol(<><rect x="269" y="213" width="13" height="20" rx="4"/><rect x="286" y="212" width="13" height="22" rx="4"/><rect x="303" y="211" width="13" height="22" rx="4"/><rect x="320" y="212" width="13" height="21" rx="4"/><rect x="337" y="213" width="12" height="19" rx="4"/><rect x="278" y="228" width="10" height="14" rx="3"/><rect x="293" y="226" width="10" height="16" rx="3"/><rect x="308" y="225" width="10" height="17" rx="3"/></>)}{_trexEye}</>,
  },
  {
    hint: "Draw the tiny arm and finger claws",
    type: "line",
    ghost: () => gLine(<>
      <path d="M269,196 Q292,181 310,196 Q320,209 308,217 Q292,213 278,204 Z"/>
      <line x1="310" y1="196" x2="322" y2="188"/><line x1="310" y1="196" x2="320" y2="202"/>
      <line x1="310" y1="196" x2="314" y2="212"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}{_trexTeeth}{ol(<><rect x="269" y="213" width="13" height="20" rx="4"/><rect x="286" y="212" width="13" height="22" rx="4"/><rect x="303" y="211" width="13" height="22" rx="4"/><rect x="320" y="212" width="13" height="21" rx="4"/><rect x="337" y="213" width="12" height="19" rx="4"/><rect x="278" y="228" width="10" height="14" rx="3"/><rect x="293" y="226" width="10" height="16" rx="3"/><rect x="308" y="225" width="10" height="17" rx="3"/></>)}{_trexEye}{_trexSpines}</>,
  },
  {
    hint: "Draw the spines along the back",
    type: "line",
    ghost: () => gLine(<>
      <path d="M174,154 Q170,132 180,120 Q188,110 192,128 Q196,144 205,152"/>
      <path d="M205,152 Q202,132 212,122 Q220,114 222,130 Q224,146 230,153"/>
      <path d="M230,153 Q228,136 237,127 Q244,120 245,135 Q246,150 252,160"/>
    </>),
    completedSVG: () => <>{_trexBase}{_trexBelly}{_trexOutline}{ol(<path d="M168,160 Q238,150 278,197 Q300,234 278,294 Q246,340 163,340 Q102,334 90,294 Q89,268 100,250 Q120,218 168,206 Z"/>)}{_trexJaw}{_trexLegs}{_trexLegOutline}{_trexClaws}{_trexTeeth}{ol(<><rect x="269" y="213" width="13" height="20" rx="4"/><rect x="286" y="212" width="13" height="22" rx="4"/><rect x="303" y="211" width="13" height="22" rx="4"/><rect x="320" y="212" width="13" height="21" rx="4"/><rect x="337" y="213" width="12" height="19" rx="4"/><rect x="278" y="228" width="10" height="14" rx="3"/><rect x="293" y="226" width="10" height="16" rx="3"/><rect x="308" y="225" width="10" height="17" rx="3"/></>)}{_trexEye}{_trexArm}</>,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🚀 ROCKET IN SPACE
// Detailed rocket with porthole, fins, flames, planet, rings, stars
// ═══════════════════════════════════════════════════════════════════════
const _rBody = "M168,135 L168,338 L232,338 L232,135 Z";
const _rNose = "M168,135 Q168,90 200,70 Q232,90 232,135 Z";
const _rFinL = "M168,298 L110,374 L168,348 Z";
const _rFinR = "M232,298 L290,374 L232,348 Z";
const _rMiniL = "M158,210 L134,234 L158,222 Z";
const _rMiniR = "M242,210 L266,234 L242,222 Z";
const _rOutline = ol(<>
  <path d={_rBody}/><path d={_rNose}/>
  <path d={_rFinL}/><path d={_rFinR}/>
  <path d={_rMiniL}/><path d={_rMiniR}/>
</>);
const _rWindow1 = <circle cx="200" cy="188" r="32" fill="#1565C0"/>;
const _rWindow2 = <circle cx="200" cy="188" r="22" fill="#42A5F5"/>;
const _rWindowShine = <ellipse cx="193" cy="180" rx="8" ry="5" transform="rotate(-30,193,180)" fill="rgba(255,255,255,0.6)"/>;
const _rWindowOutline = ol(<circle cx="200" cy="188" r="32"/>);
const _rPlanet = <circle cx="318" cy="90" r="46" fill="#FF8A65"/>;
const _rRing = <>
  <ellipse cx="318" cy="90" rx="72" ry="19" fill="none" stroke="#1a1a1a" strokeWidth={SW}/>
  <ellipse cx="318" cy="90" rx="72" ry="19" fill="none" stroke="#FF7043" strokeWidth="14" opacity="0.5"/>
  {ol(<ellipse cx="318" cy="90" rx="72" ry="19"/>)}
</>;
const _rFlameOut = <path d="M177,338 Q166,382 188,412 Q200,424 212,412 Q234,382 223,338 Z" fill="#FF6D00"/>;
const _rFlameIn = <path d="M185,338 Q178,374 195,403 Q200,412 205,403 Q222,374 215,338 Z" fill="#FFD600"/>;
const _rStars = ol(<>
  <circle cx="48" cy="58" r="5"/><circle cx="82" cy="28" r="4"/>
  <circle cx="340" cy="28" r="4"/><circle cx="372" cy="55" r="5"/>
  <circle cx="55" cy="155" r="3"/><circle cx="36" cy="240" r="4"/>
  <circle cx="368" cy="180" r="3"/><circle cx="378" cy="130" r="5"/>
  <circle cx="64" cy="320" r="3"/><circle cx="22" cy="360" r="4"/>
</>, 3);

const ROCKET_STEPS = [
  {
    hint: "Colour the silver rocket body",
    type: "fill",
    ghost: () => gFill("#CFD8DC", <path d={_rBody}/>),
    completedSVG: () => null,
  },
  {
    hint: "Colour the red nose cone",
    type: "fill",
    ghost: () => gFill("#E53935", <path d={_rNose}/>),
    completedSVG: () => <path d={_rBody} fill="#CFD8DC"/>,
  },
  {
    hint: "Colour all four fins red",
    type: "fill",
    ghost: () => gFill("#E53935", <><path d={_rFinL}/><path d={_rFinR}/><path d={_rMiniL}/><path d={_rMiniR}/></>),
    completedSVG: () => <><path d={_rBody} fill="#CFD8DC"/><path d={_rNose} fill="#E53935"/></>,
  },
  {
    hint: "Trace the outline of the whole rocket",
    type: "line",
    ghost: () => gLine(<><path d={_rBody}/><path d={_rNose}/><path d={_rFinL}/><path d={_rFinR}/><path d={_rMiniL}/><path d={_rMiniR}/></>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
    </>,
  },
  {
    hint: "Colour the dark blue porthole",
    type: "fill",
    ghost: () => gFill("#1565C0", <circle cx="200" cy="188" r="32"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}
    </>,
  },
  {
    hint: "Colour the lighter blue inside the porthole",
    type: "fill",
    ghost: () => gFill("#42A5F5", <circle cx="200" cy="188" r="22"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}
    </>,
  },
  {
    hint: "Colour the orange planet",
    type: "fill",
    ghost: () => gFill("#FF8A65", <circle cx="318" cy="90" r="46"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}{_rWindow2}{_rWindowShine}{_rWindowOutline}
    </>,
  },
  {
    hint: "Draw the planet's rings",
    type: "line",
    ghost: () => gLine(<ellipse cx="318" cy="90" rx="72" ry="19"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}{_rWindow2}{_rWindowShine}{_rWindowOutline}{_rPlanet}
      {ol(<circle cx="318" cy="90" r="46"/>)}
    </>,
  },
  {
    hint: "Colour the orange outer flame",
    type: "fill",
    ghost: () => gFill("#FF6D00", <path d="M177,338 Q166,382 188,412 Q200,424 212,412 Q234,382 223,338 Z"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}{_rWindow2}{_rWindowShine}{_rWindowOutline}{_rPlanet}{_rRing}
    </>,
  },
  {
    hint: "Colour the bright yellow inner flame",
    type: "fill",
    ghost: () => gFill("#FFD600", <path d="M185,338 Q178,374 195,403 Q200,412 205,403 Q222,374 215,338 Z"/>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}{_rWindow2}{_rWindowShine}{_rWindowOutline}{_rPlanet}{_rRing}{_rFlameOut}
    </>,
  },
  {
    hint: "Draw the stars all around",
    type: "line",
    ghost: () => gLine(<>
      <circle cx="48" cy="58" r="5"/><circle cx="82" cy="28" r="4"/>
      <circle cx="340" cy="28" r="4"/><circle cx="372" cy="55" r="5"/>
      <circle cx="55" cy="155" r="3"/><circle cx="36" cy="240" r="4"/>
      <circle cx="368" cy="180" r="3"/><circle cx="378" cy="130" r="5"/>
      <circle cx="64" cy="320" r="3"/><circle cx="22" cy="360" r="4"/>
    </>),
    completedSVG: () => <>
      <path d={_rBody} fill="#CFD8DC"/>
      <path d={_rNose} fill="#E53935"/>
      <path d={_rFinL} fill="#E53935"/><path d={_rFinR} fill="#E53935"/>
      <path d={_rMiniL} fill="#E53935"/><path d={_rMiniR} fill="#E53935"/>
      {_rOutline}{_rWindow1}{_rWindow2}{_rWindowShine}{_rWindowOutline}{_rPlanet}{_rRing}{_rFlameOut}{_rFlameIn}
    </>,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON: 🏰 CASTLE
// Towers, battlements, gate, moat, windows, flag, drawbridge, stone lines
// ═══════════════════════════════════════════════════════════════════════
const CAST_G = "#90A4AE";  // stone grey
const CAST_D = "#546E7A";  // dark stone
const _castTowers = <>
  <rect x="44" y="178" width="96" height="212" fill={CAST_G}/>
  <rect x="260" y="178" width="96" height="212" fill={CAST_G}/>
  <rect x="75" y="278" width="250" height="112" fill={CAST_G}/>
</>;
const _castCenter = <rect x="152" y="108" width="96" height="170" fill={CAST_D}/>;
const _castOutline = ol(<>
  <rect x="44" y="178" width="96" height="212"/><rect x="260" y="178" width="96" height="212"/>
  <rect x="75" y="278" width="250" height="112"/><rect x="152" y="108" width="96" height="170"/>
</>);
const _castBattlements = <>
  {/* left tower */}
  <rect x="44" y="152" width="18" height="26" fill={CAST_G}/><rect x="70" y="152" width="18" height="26" fill={CAST_G}/>
  <rect x="96" y="152" width="18" height="26" fill={CAST_G}/><rect x="122" y="152" width="18" height="26" fill={CAST_G}/>
  {/* right tower */}
  <rect x="260" y="152" width="18" height="26" fill={CAST_G}/><rect x="286" y="152" width="18" height="26" fill={CAST_G}/>
  <rect x="312" y="152" width="18" height="26" fill={CAST_G}/><rect x="338" y="152" width="18" height="26" fill={CAST_G}/>
  {/* center tower */}
  <rect x="152" y="82" width="16" height="26" fill={CAST_D}/><rect x="178" y="82" width="16" height="26" fill={CAST_D}/>
  <rect x="204" y="82" width="16" height="26" fill={CAST_D}/><rect x="230" y="82" width="16" height="26" fill={CAST_D}/>
</>;
const _castBattlementsOutline = ol(<>
  <rect x="44" y="152" width="18" height="26"/><rect x="70" y="152" width="18" height="26"/>
  <rect x="96" y="152" width="18" height="26"/><rect x="122" y="152" width="18" height="26"/>
  <rect x="260" y="152" width="18" height="26"/><rect x="286" y="152" width="18" height="26"/>
  <rect x="312" y="152" width="18" height="26"/><rect x="338" y="152" width="18" height="26"/>
  <rect x="152" y="82" width="16" height="26"/><rect x="178" y="82" width="16" height="26"/>
  <rect x="204" y="82" width="16" height="26"/><rect x="230" y="82" width="16" height="26"/>
</>);
const _castMoat = <rect x="0" y="388" width="400" height="52" fill="#1565C0"/>;
const _castGate = <path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z" fill="#1a1a1a"/>;
const _castWindows = <>
  <rect x="74" y="218" width="32" height="50" rx="16" fill="#1565C0"/>
  <rect x="294" y="218" width="32" height="50" rx="16" fill="#1565C0"/>
  <rect x="166" y="148" width="24" height="38" rx="12" fill="#1565C0"/>
  <rect x="210" y="148" width="24" height="38" rx="12" fill="#1565C0"/>
</>;
const _castWindowOutline = ol(<>
  <rect x="74" y="218" width="32" height="50" rx="16"/>
  <rect x="294" y="218" width="32" height="50" rx="16"/>
  <rect x="166" y="148" width="24" height="38" rx="12"/>
  <rect x="210" y="148" width="24" height="38" rx="12"/>
</>);
const _castFlag = <>
  <line x1="200" y1="108" x2="200" y2="52" stroke="#1a1a1a" strokeWidth="4"/>
  <path d="M200,52 L246,68 L200,84 Z" fill="#E53935"/>
  {ol(<path d="M200,52 L246,68 L200,84 Z"/>)}
</>;
const _castBridge = <>
  <rect x="157" y="388" width="86" height="30" fill="#8D6E63"/>
  {ol(<rect x="157" y="388" width="86" height="30"/>)}
  {ol(<><line x1="175" y1="388" x2="175" y2="418"/><line x1="192" y1="388" x2="192" y2="418"/>
       <line x1="209" y1="388" x2="209" y2="418"/><line x1="226" y1="388" x2="226" y2="418"/></>, 4)}
</>;
const _castStoneLines = ol(<>
  {[208,238,268,298,328,358].map(y=><line key={y} x1="44" y1={y} x2="356" y2={y}/>)}
  {[140,168,196,224,252].map(y=><line key={y} x1="152" y1={y} x2="248" y2={y}/>)}
</>, 2);

const CASTLE_STEPS = [
  {
    hint: "Colour the left and right stone towers",
    type: "fill",
    ghost: () => gFill(CAST_G, <>
      <rect x="44" y="178" width="96" height="212"/>
      <rect x="260" y="178" width="96" height="212"/>
    </>),
    completedSVG: () => null,
  },
  {
    hint: "Colour the main wall between the towers",
    type: "fill",
    ghost: () => gFill(CAST_G, <rect x="75" y="278" width="250" height="112"/>),
    completedSVG: () => <>
      <rect x="44" y="178" width="96" height="212" fill={CAST_G}/>
      <rect x="260" y="178" width="96" height="212" fill={CAST_G}/>
    </>,
  },
  {
    hint: "Colour the tall dark center tower",
    type: "fill",
    ghost: () => gFill(CAST_D, <rect x="152" y="108" width="96" height="170"/>),
    completedSVG: () => <>
      <rect x="44" y="178" width="96" height="212" fill={CAST_G}/>
      <rect x="260" y="178" width="96" height="212" fill={CAST_G}/>
      <rect x="75" y="278" width="250" height="112" fill={CAST_G}/>
      {ol(<><rect x="44" y="178" width="96" height="212"/><rect x="260" y="178" width="96" height="212"/><rect x="75" y="278" width="250" height="112"/></>)}
    </>,
  },
  {
    hint: "Colour the battlements on every tower",
    type: "fill",
    ghost: () => gFill(CAST_G, <>
      <rect x="44" y="152" width="18" height="26"/><rect x="70" y="152" width="18" height="26"/>
      <rect x="96" y="152" width="18" height="26"/><rect x="122" y="152" width="18" height="26"/>
      <rect x="260" y="152" width="18" height="26"/><rect x="286" y="152" width="18" height="26"/>
      <rect x="312" y="152" width="18" height="26"/><rect x="338" y="152" width="18" height="26"/>
    </>),
    completedSVG: () => <>
      <rect x="44" y="178" width="96" height="212" fill={CAST_G}/>
      <rect x="260" y="178" width="96" height="212" fill={CAST_G}/>
      <rect x="75" y="278" width="250" height="112" fill={CAST_G}/>
      <rect x="152" y="108" width="96" height="170" fill={CAST_D}/>
      {_castOutline}
    </>,
  },
  {
    hint: "Colour the center tower battlements darker",
    type: "fill",
    ghost: () => gFill(CAST_D, <>
      <rect x="152" y="82" width="16" height="26"/><rect x="178" y="82" width="16" height="26"/>
      <rect x="204" y="82" width="16" height="26"/><rect x="230" y="82" width="16" height="26"/>
    </>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}
      <rect x="44" y="152" width="18" height="26" fill={CAST_G}/><rect x="70" y="152" width="18" height="26" fill={CAST_G}/>
      <rect x="96" y="152" width="18" height="26" fill={CAST_G}/><rect x="122" y="152" width="18" height="26" fill={CAST_G}/>
      <rect x="260" y="152" width="18" height="26" fill={CAST_G}/><rect x="286" y="152" width="18" height="26" fill={CAST_G}/>
      <rect x="312" y="152" width="18" height="26" fill={CAST_G}/><rect x="338" y="152" width="18" height="26" fill={CAST_G}/>
      {ol(<><rect x="44" y="152" width="18" height="26"/><rect x="70" y="152" width="18" height="26"/><rect x="96" y="152" width="18" height="26"/><rect x="122" y="152" width="18" height="26"/><rect x="260" y="152" width="18" height="26"/><rect x="286" y="152" width="18" height="26"/><rect x="312" y="152" width="18" height="26"/><rect x="338" y="152" width="18" height="26"/></>)}
    </>,
  },
  {
    hint: "Fill the blue moat with water",
    type: "fill",
    ghost: () => gFill("#1565C0", <rect x="0" y="388" width="400" height="52"/>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}
    </>,
  },
  {
    hint: "Fill in the dark gate archway",
    type: "fill",
    ghost: () => gFill("#1a1a1a",
      <path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z"/>
    ),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}{_castMoat}
    </>,
  },
  {
    hint: "Colour the blue arched windows",
    type: "fill",
    ghost: () => gFill("#1565C0", <>
      <rect x="74" y="218" width="32" height="50" rx="16"/>
      <rect x="294" y="218" width="32" height="50" rx="16"/>
      <rect x="166" y="148" width="24" height="38" rx="12"/>
      <rect x="210" y="148" width="24" height="38" rx="12"/>
    </>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}{_castMoat}{_castGate}
      {ol(<path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z"/>)}
    </>,
  },
  {
    hint: "Draw the red flag on the center tower",
    type: "fill",
    ghost: () => gFill("#E53935", <path d="M200,52 L246,68 L200,84 Z"/>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}
      {_castMoat}{_castGate}{ol(<path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z"/>)}
      {_castWindows}{_castWindowOutline}
    </>,
  },
  {
    hint: "Draw the wooden drawbridge planks",
    type: "fill",
    ghost: () => gFill("#8D6E63", <rect x="157" y="388" width="86" height="30"/>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}
      {_castMoat}{_castGate}{ol(<path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z"/>)}
      {_castWindows}{_castWindowOutline}{_castFlag}
    </>,
  },
  {
    hint: "Draw the stone lines across the walls",
    type: "line",
    ghost: () => gLine(<>
      {[208,238,268,298,328,358].map(y=><line key={y} x1="44" y1={y} x2="356" y2={y}/>)}
      {[140,168,196,224,252].map(y=><line key={y} x1="152" y1={y} x2="248" y2={y}/>)}
    </>),
    completedSVG: () => <>
      {_castTowers}{_castCenter}{_castOutline}{_castBattlements}{_castBattlementsOutline}
      {_castMoat}{_castGate}{ol(<path d="M157,390 L157,312 Q157,272 200,272 Q243,272 243,312 L243,390 Z"/>)}
      {_castWindows}{_castWindowOutline}{_castFlag}{_castBridge}
    </>,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON REGISTRY
// ═══════════════════════════════════════════════════════════════════════
const LESSONS = [
  { id:"pizza",   title:"Pizza Slice",  emoji:"🍕", color:"#D93B2B", bg:"#1a0800", steps: PIZZA_STEPS },
  { id:"rainbow", title:"Rainbow",      emoji:"🌈", color:"#7C4DFF", bg:"#080820", steps: RAINBOW_STEPS },
  { id:"icecream",title:"Ice Cream",    emoji:"🍦", color:"#F48FB1", bg:"#1a0812", steps: ICE_CREAM_STEPS },
  { id:"car",     title:"Race Car",     emoji:"🚗", color:"#E53935", bg:"#160808", steps: CAR_STEPS },
  { id:"trex",    title:"T-Rex",        emoji:"🦖", color:"#4CAF50", bg:"#0a1a0a", steps: TREX_STEPS },
  { id:"rocket",  title:"Rocket",       emoji:"🚀", color:"#607D8B", bg:"#080810", steps: ROCKET_STEPS },
  { id:"castle",  title:"Castle",       emoji:"🏰", color:"#607D8B", bg:"#0d1218", steps: CASTLE_STEPS },
];

function Stars() {
  return (
    <div style={{display:"flex",gap:14,justifyContent:"center"}}>
      {[1,2,3].map(i=>(
        <span key={i} style={{fontSize:58,display:"inline-block",filter:"drop-shadow(0 0 14px #FFD700)",animation:`popIn ${0.22+i*0.18}s cubic-bezier(0.34,1.56,0.64,1) both`}}>⭐</span>
      ))}
    </div>
  );
}

export default function App() {
  const [screen,   setScreen]  = useState("home");
  const [lesson,   setLesson]  = useState(null);
  const [stepIdx,  setStepIdx] = useState(0);
  const [brushSz,  setBrushSz] = useState(18);
  const [brushCol, setBrushCol]= useState("#E53935");
  const [ghostOp,  setGhostOp] = useState(0.78);
  const [done,     setDone]    = useState([]);
  const [capturedCanvas, setCapturedCanvas] = useState(null);

  const canvasRef     = useRef(null);
  const drawing       = useRef(false);
  const lastPos       = useRef(null);
  const strokeHistory = useRef([]);          // undo stack (dataURLs)
  const pinchRef      = useRef(null);        // active pinch state
  const justPinched   = useRef(false);       // prevent draw-dot after pinch ends
  const [zoom, setZoom] = useState(1);
  const zoomRef       = useRef(1);           // always-current zoom for event handlers
  const [pan,  setPan]  = useState({x:0,y:0});
  const panRef        = useRef({x:0,y:0});

  const PALETTE = [
    "#E53935","#FF9800","#FFD600","#4CAF50",
    "#2196F3","#90CAF9","#7C4DFF","#F48FB1",
    "#80CBC4","#D4870A","#4E342E","#9E9E9E",
    "#424242","#1a1a1a","#ffffff","#F7DC6F",
  ];

  const step       = lesson?.steps[stepIdx];
  const totalSteps = lesson?.steps.length ?? 0;
  const isLast     = stepIdx === totalSteps - 1;
  const isFill     = step?.type === "fill";
  const phaseCol   = lesson?.color ?? "#fff";

  // getBoundingClientRect accounts for CSS transforms on parents, so zoom/pan
  // are automatically handled without any manual math here.
  const getPos = (e) => {
    const c = canvasRef.current;
    if (!c) return {x:0,y:0};
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x:(s.clientX-r.left)*(c.width/r.width), y:(s.clientY-r.top)*(c.height/r.height) };
  };

  const getPinchDist = (touches) =>
    Math.hypot(touches[1].clientX-touches[0].clientX, touches[1].clientY-touches[0].clientY);

  const undo = useCallback(()=>{
    const c = canvasRef.current;
    if (!c || strokeHistory.current.length === 0) return;
    const dataUrl = strokeHistory.current.pop();
    const img = new Image();
    img.onload = () => {
      const ctx = c.getContext("2d");
      ctx.clearRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0);
    };
    img.src = dataUrl;
  },[]);

  const onDown = useCallback((e)=>{
    // Two-finger = start pinch, not a draw stroke
    if (e.touches && e.touches.length >= 2) {
      drawing.current = false;
      pinchRef.current = {
        dist: getPinchDist(e.touches),
        startZoom: zoomRef.current,
        startPan: {...panRef.current},
        startMidX: (e.touches[0].clientX+e.touches[1].clientX)/2,
        startMidY: (e.touches[0].clientY+e.touches[1].clientY)/2,
      };
      return;
    }
    e.preventDefault();
    if (justPinched.current) { justPinched.current = false; return; }
    drawing.current = true;
    // Save canvas snapshot for undo (cap stack at 30)
    const c = canvasRef.current;
    if (c) {
      if (strokeHistory.current.length >= 30) strokeHistory.current.shift();
      strokeHistory.current.push(c.toDataURL());
    }
    const p = getPos(e); lastPos.current = p;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath(); ctx.arc(p.x,p.y,brushSz/2,0,Math.PI*2);
    ctx.fillStyle=brushCol; ctx.fill();
  },[brushSz,brushCol]);

  const onMove = useCallback((e)=>{
    e.preventDefault();
    // Two-finger = update pinch zoom + pan
    if (e.touches && e.touches.length >= 2 && pinchRef.current) {
      const { dist: d0, startZoom, startPan, startMidX, startMidY } = pinchRef.current;
      const d1 = getPinchDist(e.touches);
      const newZoom = Math.min(4, Math.max(1, startZoom * (d1/d0)));
      const midX = (e.touches[0].clientX+e.touches[1].clientX)/2;
      const midY = (e.touches[0].clientY+e.touches[1].clientY)/2;
      const newPan = {
        x: startPan.x + (midX - startMidX),
        y: startPan.y + (midY - startMidY),
      };
      zoomRef.current = newZoom;
      panRef.current = newPan;
      setZoom(newZoom);
      setPan(newPan);
      return;
    }
    if (!drawing.current) return;
    const p = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y);
    ctx.lineTo(p.x,p.y);
    ctx.strokeStyle=brushCol; ctx.lineWidth=brushSz;
    ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke();
    lastPos.current = p;
  },[brushSz,brushCol]);

  const onUp = useCallback((e)=>{
    if (pinchRef.current) {
      pinchRef.current = null;
      justPinched.current = true;
      setTimeout(()=>{ justPinched.current = false; }, 300);
    }
    drawing.current = false;
  },[]);

  useEffect(()=>{
    const c=canvasRef.current;
    if(!c||screen!=="draw") return;
    c.addEventListener("mousedown",onDown);
    c.addEventListener("mousemove",onMove);
    c.addEventListener("mouseup",onUp);
    c.addEventListener("mouseleave",onUp);
    c.addEventListener("touchstart",onDown,{passive:false});
    c.addEventListener("touchmove",onMove,{passive:false});
    c.addEventListener("touchend",onUp);
    return ()=>{
      c.removeEventListener("mousedown",onDown);
      c.removeEventListener("mousemove",onMove);
      c.removeEventListener("mouseup",onUp);
      c.removeEventListener("mouseleave",onUp);
      c.removeEventListener("touchstart",onDown);
      c.removeEventListener("touchmove",onMove);
      c.removeEventListener("touchend",onUp);
    };
  },[screen,onDown,onMove,onUp]);

  useEffect(()=>{
    if(!step) return;
    setBrushSz(step.type==="fill" ? 22 : 12);
    // Auto-select brush colour: call ghost() to trigger gFill side-effect
    if (step.type === "fill") {
      _lastGhostFill = "#E53935";
      step.ghost(); // triggers gFill which sets _lastGhostFill
      setBrushCol(_lastGhostFill);
    } else {
      setBrushCol("#1a1a1a"); // line/trace steps always use dark
    }
    // Reset zoom/pan when moving to new step
    zoomRef.current = 1; panRef.current = {x:0,y:0};
    setZoom(1); setPan({x:0,y:0});
    strokeHistory.current = [];
  },[stepIdx,lesson]);

  const [isLandscape, setIsLandscape] = useState(()=>window.innerWidth > window.innerHeight);
  useEffect(()=>{
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return ()=>{ window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  },[]);

  const startLesson=(l)=>{
    setLesson(l); setStepIdx(0); setScreen("draw");
    setTimeout(()=>{ const c=canvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); },40);
  };
  const nextStep=()=>{
    if(isLast){
      setCapturedCanvas(canvasRef.current?.toDataURL("image/png") ?? null);
      setDone(p=>[...new Set([...p,lesson.id])]);
      setScreen("complete");
    } else setStepIdx(i=>i+1);
  };

  const saveDrawing = useCallback(()=>{
    if(!lesson) return;
    const lastStep = lesson.steps[lesson.steps.length - 1];
    const svgMarkup = renderToStaticMarkup(
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440">
        {lastStep.completedSVG()}
      </svg>
    );
    const blob = new Blob([svgMarkup], {type:"image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(blob);
    const svgImg = new Image();
    svgImg.onload = () => {
      const off = document.createElement("canvas");
      off.width = 800; off.height = 880;
      const ctx = off.getContext("2d");
      ctx.scale(2, 2);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, 400, 440);
      ctx.drawImage(svgImg, 0, 0, 400, 440);
      URL.revokeObjectURL(svgUrl);
      const finish = () => {
        const a = document.createElement("a");
        a.href = off.toDataURL("image/png");
        a.download = `${lesson.title.replace(/\s+/g,"-")}.png`;
        a.click();
      };
      if(capturedCanvas) {
        const userImg = new Image();
        userImg.onload = () => { ctx.drawImage(userImg, 0, 0, 400, 440); finish(); };
        userImg.src = capturedCanvas;
      } else finish();
    };
    svgImg.src = svgUrl;
  },[lesson, capturedCanvas]);
  const goHome=()=>{ setScreen("home"); setLesson(null); setStepIdx(0); };
  const cycleGhost=()=>setGhostOp(o=>o<0.5?0.82:o<0.75?0.45:0.78);

  // Card tilts so they feel hand-placed, not generated
  const TILTS = [-2.5, 1.8, -1.2, 2.1];
  // Each lesson gets a bold solid card colour (not a dark gradient)
  const CARD_BG = ["#E8380D","#6C3FD4","#D4006A","#1565C0"];

  const F = "'Baloo 2', 'Arial Rounded MT Bold', sans-serif";

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800;900&display=swap');
    * { box-sizing: border-box; }
    @keyframes bob { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(1deg)} }
    @keyframes popIn { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
    @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes confettiFall { 0%{opacity:1;transform:translateY(-20px) rotate(0deg)} 100%{opacity:0;transform:translateY(600px) rotate(540deg)} }
    .card { transition: transform 0.18s, box-shadow 0.18s; }
    .card:hover { transform: scale(1.05) rotate(0deg) !important; box-shadow: 0 12px 32px #0004 !important; }
    .card:active { transform: scale(0.96) !important; }
    .btn { transition: transform 0.12s; }
    .btn:hover { transform: scale(1.03); }
    .btn:active { transform: scale(0.96); }
    .swatch { transition: transform 0.1s; }
    .swatch:hover { transform: scale(1.2); }
    .swatch:active { transform: scale(0.88); }
  `;

  // ══════════ HOME ══════════
  if(screen==="home") return (
    <div style={{minHeight:"100dvh",background:"#fdf7ee",fontFamily:F,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isLandscape?"20px 40px":"28px 18px",overflow:"auto"}}>
      <style>{globalStyles}</style>

      {isLandscape ? (
        <div style={{display:"flex",alignItems:"center",gap:48,width:"100%",maxWidth:1060}}>
          {/* Title block */}
          <div style={{flexShrink:0,textAlign:"left"}}>
            <div style={{fontSize:64,lineHeight:1,marginBottom:6}}>🎨</div>
            <h1 style={{margin:"0 0 6px",fontSize:"clamp(32px,4vw,52px)",fontWeight:900,color:"#1a1a1a",lineHeight:1.05,letterSpacing:"-1px"}}>
              Draw<br/>With<br/>Dad!
            </h1>
            <p style={{margin:0,fontSize:14,color:"#888",fontWeight:700,letterSpacing:"0.02em"}}>Step-by-step drawing for kids</p>
          </div>
          {/* Cards row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,flex:1}}>
            {LESSONS.map((l,i)=>(
              <div key={l.id} className="card" onClick={()=>startLesson(l)}
                style={{background:CARD_BG[i],borderRadius:20,padding:"24px 12px 18px",textAlign:"center",cursor:"pointer",
                  transform:`rotate(${TILTS[i]}deg)`,boxShadow:"0 6px 20px #0003",position:"relative",userSelect:"none"}}>
                {done.includes(l.id) && (
                  <div style={{position:"absolute",top:-8,right:-8,background:"#2ecc40",border:"3px solid #fff",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",zIndex:2}}>✓</div>
                )}
                <div style={{fontSize:"clamp(44px,5vw,60px)",marginBottom:10,display:"block"}}>{l.emoji}</div>
                <div style={{fontSize:15,fontWeight:900,color:"#fff",textShadow:"0 1px 3px #0005"}}>{l.title}</div>
                <div style={{marginTop:10,fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:700}}>{l.steps.length} steps</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{textAlign:"center",marginBottom:28,animation:"slideUp 0.4s ease both"}}>
            <div style={{fontSize:56,display:"inline-block",animation:"bob 3s ease infinite"}}>🎨</div>
            <h1 style={{margin:"8px 0 4px",fontSize:"clamp(34px,9vw,48px)",fontWeight:900,color:"#1a1a1a",letterSpacing:"-1px",lineHeight:1}}>Draw With Dad!</h1>
            <p style={{margin:0,fontSize:14,color:"#999",fontWeight:700}}>Step-by-step drawing for kids</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,width:"100%",maxWidth:400}}>
            {LESSONS.map((l,i)=>(
              <div key={l.id} className="card" onClick={()=>startLesson(l)}
                style={{background:CARD_BG[i],borderRadius:20,padding:"22px 10px 18px",textAlign:"center",cursor:"pointer",
                  transform:`rotate(${TILTS[i]}deg)`,boxShadow:"0 6px 20px #0003",position:"relative",userSelect:"none",
                  animation:`slideUp ${0.3+i*0.08}s ease both`}}>
                {done.includes(l.id) && (
                  <div style={{position:"absolute",top:-8,right:-8,background:"#2ecc40",border:"3px solid #fff",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",zIndex:2}}>✓</div>
                )}
                <div style={{fontSize:52,marginBottom:10}}>{l.emoji}</div>
                <div style={{fontSize:15,fontWeight:900,color:"#fff",textShadow:"0 1px 3px #0005"}}>{l.title}</div>
                <div style={{marginTop:8,fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:700}}>{l.steps.length} steps</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ══════════ COMPLETE ══════════
  if(screen==="complete") {
    const lastStep = lesson.steps[lesson.steps.length - 1];
    const DrawingPreview = (
      <div style={{position:"relative",width:"100%",height:"100%",borderRadius:16,overflow:"hidden",
        boxShadow:"0 8px 32px #0004",border:"4px solid #fff"}}>
        <div style={{position:"absolute",inset:0,background:BG,zIndex:0}}/>
        <svg viewBox="0 0 400 440" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:1}}>
          {lastStep.completedSVG()}
        </svg>
        {capturedCanvas && (
          <img src={capturedCanvas} alt="your drawing" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:2}}/>
        )}
      </div>
    );
    const Buttons = (
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
        <button className="btn" onClick={saveDrawing}
          style={{background:"#2ecc40",color:"#fff",border:"none",borderRadius:14,padding:"15px 24px",
            fontSize:17,fontWeight:900,cursor:"pointer",fontFamily:F,
            boxShadow:"0 4px 0 #27ae36",letterSpacing:"0.01em"}}>
          Save my drawing
        </button>
        <button className="btn" onClick={()=>startLesson(lesson)}
          style={{background:lesson.color,color:"#fff",border:"none",borderRadius:14,padding:"14px 24px",
            fontSize:16,fontWeight:900,cursor:"pointer",fontFamily:F,boxShadow:`0 4px 0 ${lesson.color}bb`}}>
          Draw it again
        </button>
        <button className="btn" onClick={goHome}
          style={{background:"transparent",color:"#777",border:"2.5px solid #ddd",borderRadius:14,
            padding:"12px 24px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:F}}>
          Pick another
        </button>
      </div>
    );

    return (
      <div style={{minHeight:"100dvh",background:"#fdf7ee",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",overflow:"auto",padding:"20px 16px",boxSizing:"border-box"}}>
        <style>{globalStyles}</style>
        {/* confetti */}
        {["#E53935","#FF9800","#FFD600","#4CAF50","#7C4DFF","#2196F3","#FF69B4","#00BCD4"].map((c,i)=>(
          <div key={i} style={{position:"fixed",top:-20,left:`${5+i*12}%`,width:i%2===0?10:14,height:i%2===0?14:10,
            background:c,borderRadius:i%3===0?"50%":3,
            animation:`confettiFall ${1.6+i*0.2}s ${i*0.1}s ease-in both`,zIndex:10,pointerEvents:"none"}}/>
        ))}

        {isLandscape ? (
          <div style={{display:"flex",alignItems:"center",gap:40,width:"100%",maxWidth:980}}>
            <div style={{flex:"0 0 auto",aspectRatio:"400/440",height:"min(76dvh,500px)",animation:"popIn 0.4s ease both"}}>
              {DrawingPreview}
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <div style={{fontSize:56,lineHeight:1}}>🎉</div>
                <h2 style={{margin:"8px 0 4px",fontSize:"clamp(32px,4vw,48px)",fontWeight:900,color:"#1a1a1a",letterSpacing:"-1px"}}>You did it!</h2>
                <p style={{margin:0,fontSize:16,color:"#888",fontWeight:700}}>You drew {lesson.title}! {lesson.emoji}</p>
              </div>
              <Stars/>
              <div style={{maxWidth:320}}>{Buttons}</div>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,width:"100%",maxWidth:400}}>
            <div style={{fontSize:56}}>🎉</div>
            <h2 style={{margin:0,fontSize:"clamp(32px,9vw,48px)",fontWeight:900,color:"#1a1a1a",letterSpacing:"-1px",textAlign:"center"}}>You did it!</h2>
            <p style={{margin:0,fontSize:15,color:"#888",fontWeight:700}}>You drew {lesson.title}! {lesson.emoji}</p>
            <Stars/>
            <div style={{width:"100%",aspectRatio:"400/440",animation:"popIn 0.4s 0.2s ease both",opacity:0,animationFillMode:"forwards"}}>
              {DrawingPreview}
            </div>
            {Buttons}
          </div>
        )}
      </div>
    );
  }

  // ══════════ DRAW SCREEN ══════════
  // Warm dark studio feel — not a video game
  const studioBg = "#1c1510";

  const Canvas = (
    <div style={{position:"relative",width:"100%",height:"100%",borderRadius:12,overflow:"hidden",
      boxShadow:"0 8px 40px #0008, 0 2px 0 #fff2 inset"}}>
      {/* inner wrapper receives the pinch-zoom transform */}
      <div style={{position:"absolute",inset:0,
        transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
        transformOrigin:"center center",
        willChange:"transform"}}>
        <div style={{position:"absolute",inset:0,background:BG,zIndex:0}}/>
        <svg viewBox="0 0 400 440" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1}}>
          {step.completedSVG(lesson.color)}
        </svg>
        <svg viewBox="0 0 400 440" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:ghostOp,pointerEvents:"none",zIndex:2}}>
          {step.ghost(lesson.color)}
        </svg>
        <canvas ref={canvasRef} width={400} height={440}
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",cursor:"crosshair",touchAction:"none",zIndex:3}}/>
      </div>
      {/* overlays sit outside the zoom wrapper so they stay fixed */}
      <div style={{position:"absolute",top:10,left:10,zIndex:4,
        background:isFill?"#e67e22":"#2980b9",borderRadius:20,
        padding:"4px 12px",fontSize:12,fontWeight:900,color:"#fff",letterSpacing:"0.05em"}}>
        {isFill?"COLOUR IN":"TRACE"}
      </div>
      {zoom > 1 && (
        <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",zIndex:4,
          background:"#0007",borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:800,color:"#fff"}}>
          {zoom.toFixed(1)}×
        </div>
      )}
    </div>
  );

  const Controls = (ls) => (
    <div style={{display:"flex",flexDirection:"column",gap:ls?8:6,height:"100%"}}>
      {/* back + title + step counter */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={goHome} className="btn"
          style={{background:"#fff1",border:"2px solid #fff2",borderRadius:10,
            padding:"8px 12px",fontSize:16,cursor:"pointer",fontFamily:F,fontWeight:900,color:"#aaa",flexShrink:0}}>
          ←
        </button>
        <div style={{flex:1,fontWeight:900,fontSize:ls?14:16,color:"#ddd",textAlign:"center"}}>
          {lesson.title}
        </div>
        <div style={{background:phaseCol,borderRadius:10,padding:"6px 11px",
          fontSize:12,fontWeight:900,color:"#fff",whiteSpace:"nowrap",flexShrink:0}}>
          {stepIdx+1} / {totalSteps}
        </div>
      </div>

      {/* progress bar — chunky, no glow */}
      <div style={{height:10,background:"#333",borderRadius:999,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${((stepIdx+1)/totalSteps)*100}%`,
          background:phaseCol,borderRadius:999,
          transition:"width 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </div>

      {/* hint — sticky note style */}
      <div style={{background:"#fff9c4",borderRadius:10,padding:"10px 14px",
        borderLeft:`5px solid ${phaseCol}`,boxShadow:"0 2px 8px #0002"}}>
        <div style={{fontWeight:900,fontSize:ls?13:15,color:"#333",lineHeight:1.35}}>{step.hint}</div>
        <div style={{fontWeight:700,fontSize:11,color:"#888",marginTop:3}}>
          {isFill ? "Fill it in using a big brush" : "Trace carefully over the guide"}
        </div>
      </div>

      {/* brush sizes */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:800,color:"#666",flexShrink:0}}>Size:</span>
        {[8,16,26].map(sz=>(
          <button key={sz} className="swatch" onClick={()=>setBrushSz(sz)}
            style={{width:ls?36:40,height:ls?36:40,borderRadius:"50%",border:"none",
              background:brushSz===sz?"#fff":"#fff1",
              outline:brushSz===sz?`3px solid ${phaseCol}`:"3px solid transparent",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <div style={{width:sz*0.65,height:sz*0.65,borderRadius:"50%",background:brushCol}}/>
          </button>
        ))}
      </div>

      {/* colour palette — square swatches, feels more like a real paint set */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,flex:1,alignContent:"start"}}>
        {PALETTE.map(c=>(
          <button key={c} className="swatch" onClick={()=>setBrushCol(c)}
            style={{aspectRatio:"1",borderRadius:8,background:c,cursor:"pointer",border:"none",
              outline:brushCol===c?"3px solid #fff":"3px solid transparent",
              boxShadow:brushCol===c?"0 0 0 2px "+phaseCol:"none"}}>
          </button>
        ))}
      </div>

      {/* undo + next row */}
      <div style={{display:"flex",gap:8,marginTop:"auto"}}>
        <button className="btn" onClick={undo}
          style={{background:"#fff1",border:"2px solid #fff2",borderRadius:12,
            padding:ls?"13px 10px":"16px 12px",fontSize:ls?18:20,fontWeight:900,cursor:"pointer",
            color:"#aaa",fontFamily:F,flexShrink:0}}
          title="Undo last stroke">
          ↩
        </button>
        <button className="btn" onClick={nextStep}
          style={{flex:1,background:phaseCol,border:"none",borderRadius:12,
            padding:ls?"13px":"16px",fontSize:ls?15:17,fontWeight:900,cursor:"pointer",
            color:"#fff",fontFamily:F,letterSpacing:"0.01em",
            boxShadow:`0 4px 0 ${phaseCol}99`}}>
          {isLast ? "Finished!" : "Done — Next →"}
        </button>
      </div>
    </div>
  );

  if(isLandscape) return (
    <div style={{background:studioBg,fontFamily:F,display:"flex",height:"100dvh",overflow:"hidden",padding:14,gap:14,boxSizing:"border-box"}}>
      <style>{globalStyles}</style>
      <div style={{flex:"0 0 auto",aspectRatio:"400/440",height:"100%"}}>
        {Canvas}
      </div>
      <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
        {Controls(true)}
      </div>
    </div>
  );

  return (
    <div style={{background:studioBg,fontFamily:F,minHeight:"100dvh",padding:"12px 12px 24px",boxSizing:"border-box"}}>
      <style>{globalStyles}</style>
      <div style={{maxWidth:440,margin:"0 auto",display:"flex",flexDirection:"column",gap:8}}>
        {Controls(false)}
        <div style={{aspectRatio:"400/440",marginTop:4}}>
          {Canvas}
        </div>
      </div>
    </div>
  );
}
