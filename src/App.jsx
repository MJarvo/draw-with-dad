import { useState, useRef, useEffect, useCallback } from "react";

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

// Ghost helpers — always white dashes, clearly visible over any fill
const GW = 5;
const GD = "12 6";
const GC = "#ffffff";

// Render solid outline group
const ol = (children, sw=SW) => (
  <g fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
    {children}
  </g>
);

// Ghost: thin line guide (white dashes)
const gLine = (children) => (
  <g fill="none" stroke={GC} strokeWidth={GW} strokeDasharray={GD} strokeLinejoin="round" strokeLinecap="round" opacity={0.95}>
    {children}
  </g>
);

// Ghost: filled shape guide (coloured + white dashed border — shows what to colour in)
const gFill = (fillColor, children) => (
  <g opacity={0.82}>
    <g fill={fillColor} stroke="none">{children}</g>
    <g fill="none" stroke={GC} strokeWidth={GW} strokeDasharray={GD} strokeLinejoin="round" strokeLinecap="round">{children}</g>
  </g>
);

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
  {
    hint: "Draw the happy eyes 👀",
    type: "line",
    ghost: () => gLine(
      <><path d="M172,218 Q178,208 184,218"/><path d="M216,218 Q222,208 228,218"/></>
    ),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        <path d="M52,385 Q200,415 348,385 Q200,408 52,385Z" fill="#C8853A"/>
        <path d="M200,100 L80,368 Q200,388 320,368 Z" fill="#D93B2B"/>
        <path d="M200,108 L88,355 Q200,374 312,355 Z" fill="#F7DC6F"/>
        <circle cx="200" cy="240" r="28" fill="#C0392B"/><circle cx="148" cy="308" r="22" fill="#C0392B"/><circle cx="252" cy="308" r="22" fill="#C0392B"/>
        {ol(<><path d="M200,60 L52,385 Q200,420 348,385 Z"/><path d="M52,385 Q200,415 348,385 Q200,408 52,385Z"/><path d="M200,100 L80,368 Q200,388 320,368 Z"/><path d="M200,108 L88,355 Q200,374 312,355 Z"/><circle cx="200" cy="240" r="28"/><circle cx="148" cy="308" r="22"/><circle cx="252" cy="308" r="22"/></>)}
      </>
    ),
  },
  {
    hint: "Draw the big smile 😄",
    type: "line",
    ghost: () => gLine(<path d="M178,268 Q200,290 222,268"/>),
    completedSVG: () => (
      <>
        <path d="M200,60 L52,385 Q200,420 348,385 Z" fill="#F5C842"/>
        <path d="M52,385 Q200,415 348,385 Q200,408 52,385Z" fill="#C8853A"/>
        <path d="M200,100 L80,368 Q200,388 320,368 Z" fill="#D93B2B"/>
        <path d="M200,108 L88,355 Q200,374 312,355 Z" fill="#F7DC6F"/>
        <circle cx="200" cy="240" r="28" fill="#C0392B"/><circle cx="148" cy="308" r="22" fill="#C0392B"/><circle cx="252" cy="308" r="22" fill="#C0392B"/>
        {ol(<><path d="M200,60 L52,385 Q200,420 348,385 Z"/><path d="M52,385 Q200,415 348,385 Q200,408 52,385Z"/><path d="M200,100 L80,368 Q200,388 320,368 Z"/><path d="M200,108 L88,355 Q200,374 312,355 Z"/><circle cx="200" cy="240" r="28"/><circle cx="148" cy="308" r="22"/><circle cx="252" cy="308" r="22"/></>)}
        {ol(<><path d="M172,218 Q178,208 184,218"/><path d="M216,218 Q222,208 228,218"/></>, 5)}
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
  {
    hint: "Draw the happy face 😊",
    type: "line",
    ghost: () => gLine(<><circle cx="183" cy="240" r="8"/><circle cx="217" cy="240" r="8"/><path d="M182,262 Q200,278 218,262"/></>),
    completedSVG: () => (
      <>
        <path d="M155,295 L200,430 L245,295 Z" fill="#D4870A"/>
        {ol(<><path d="M155,295 L200,430 L245,295"/><line x1="160" y1="315" x2="240" y2="315"/><line x1="168" y1="340" x2="232" y2="340"/><line x1="178" y1="365" x2="222" y2="365"/><line x1="190" y1="390" x2="210" y2="390"/></>)}
        <ellipse cx="200" cy="252" rx="72" ry="64" fill="#F48FB1"/>
        {ol(<ellipse cx="200" cy="252" rx="72" ry="64"/>)}
        <ellipse cx="200" cy="178" rx="68" ry="60" fill="#80CBC4"/>
        {ol(<ellipse cx="200" cy="178" rx="68" ry="60"/>)}
        {ol(<><path d="M158,268 Q150,290 155,310"/><path d="M242,268 Q250,290 245,310"/><path d="M185,310 Q178,330 183,348"/></>, 5)}
        <ellipse cx="178" cy="162" rx="10" ry="7" fill="#4E342E" transform="rotate(-20,178,162)"/>
        <ellipse cx="215" cy="155" rx="10" ry="7" fill="#4E342E" transform="rotate(15,215,155)"/>
        <ellipse cx="198" cy="185" rx="10" ry="7" fill="#4E342E" transform="rotate(-5,198,185)"/>
        <ellipse cx="170" cy="185" rx="8" ry="6" fill="#4E342E"/>
        <ellipse cx="228" cy="178" rx="8" ry="6" fill="#4E342E" transform="rotate(25,228,178)"/>
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
  {
    hint: "Draw the headlights and face 😎",
    type: "line",
    ghost: () => gLine(<><circle cx="78" cy="228" r="14"/><circle cx="322" cy="228" r="14"/><path d="M176,232 Q186,222 196,232"/><path d="M204,232 Q214,222 224,232"/><path d="M182,248 Q200,262 218,248"/></>),
    completedSVG: () => (
      <>
        <path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z" fill="#E53935"/>
        {ol(<path d="M48,270 L48,210 Q48,190 68,190 L148,190 L178,130 Q185,115 200,115 Q215,115 222,130 L252,190 L332,190 Q352,190 352,210 L352,270 Z"/>)}
        <path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z" fill="#90CAF9"/>
        <path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z" fill="#90CAF9"/>
        {ol(<><path d="M152,188 L176,138 Q180,128 188,128 L200,128 L200,188 Z"/><path d="M200,128 L212,128 Q220,128 224,138 L248,188 L200,188 Z"/></>)}
        <rect x="48" y="258" width="304" height="20" rx="10" fill="#9E9E9E"/>
        {ol(<rect x="48" y="258" width="304" height="20" rx="10"/>)}
        <circle cx="110" cy="288" r="42" fill="#424242"/><circle cx="290" cy="288" r="42" fill="#424242"/>
        {ol(<><circle cx="110" cy="288" r="42"/><circle cx="290" cy="288" r="42"/></>)}
        <circle cx="110" cy="288" r="20" fill="#eee"/><circle cx="290" cy="288" r="20" fill="#eee"/>
        {ol(<><circle cx="110" cy="288" r="20"/><circle cx="290" cy="288" r="20"/></>)}
      </>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LESSON REGISTRY
// ═══════════════════════════════════════════════════════════════════════
const LESSONS = [
  { id:"pizza",   title:"Happy Pizza", emoji:"🍕", color:"#D93B2B", bg:"#1a0800", thumbColor:"#FFB74D", steps: PIZZA_STEPS },
  { id:"rainbow", title:"Rainbow",     emoji:"🌈", color:"#7C4DFF", bg:"#080820", thumbColor:"#CE93D8", steps: RAINBOW_STEPS },
  { id:"icecream",title:"Ice Cream",   emoji:"🍦", color:"#F48FB1", bg:"#1a0812", thumbColor:"#F48FB1", steps: ICE_CREAM_STEPS },
  { id:"car",     title:"Race Car",    emoji:"🚗", color:"#E53935", bg:"#160808", thumbColor:"#EF9A9A", steps: CAR_STEPS },
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

  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);

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

  const getPos = (e) => {
    const c = canvasRef.current;
    if (!c) return {x:0,y:0};
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x:(s.clientX-r.left)*(c.width/r.width), y:(s.clientY-r.top)*(c.height/r.height) };
  };

  const onDown = useCallback((e)=>{
    e.preventDefault(); drawing.current=true;
    const p=getPos(e); lastPos.current=p;
    const ctx=canvasRef.current?.getContext("2d");
    if(!ctx) return;
    ctx.beginPath(); ctx.arc(p.x,p.y,brushSz/2,0,Math.PI*2);
    ctx.fillStyle=brushCol; ctx.fill();
  },[brushSz,brushCol]);

  const onMove = useCallback((e)=>{
    e.preventDefault(); if(!drawing.current) return;
    const p=getPos(e);
    const ctx=canvasRef.current?.getContext("2d");
    if(!ctx) return;
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y);
    ctx.lineTo(p.x,p.y);
    ctx.strokeStyle=brushCol; ctx.lineWidth=brushSz;
    ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke();
    lastPos.current=p;
  },[brushSz,brushCol]);

  const onUp = useCallback(()=>{ drawing.current=false; },[]);

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
  },[stepIdx,lesson]);

  const startLesson=(l)=>{
    setLesson(l); setStepIdx(0); setScreen("draw");
    setTimeout(()=>{ const c=canvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); },40);
  };
  const nextStep=()=>{
    if(isLast){ setDone(p=>[...new Set([...p,lesson.id])]); setScreen("complete"); }
    else setStepIdx(i=>i+1);
  };
  const goHome=()=>{ setScreen("home"); setLesson(null); setStepIdx(0); };
  const cycleGhost=()=>setGhostOp(o=>o<0.5?0.82:o<0.75?0.45:0.78);

  const appStyle={
    minHeight:"100vh",fontFamily:"'Nunito','Arial Rounded MT Bold',sans-serif",
    display:"flex",flexDirection:"column",alignItems:"center",boxSizing:"border-box",
  };

  // ══════════ HOME ══════════
  if(screen==="home") return (
    <div style={{...appStyle,background:"linear-gradient(160deg,#0f0f1e,#18080e,#080f18)",padding:"20px 14px 36px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200%}100%{background-position:-200%}}
        .lc{transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s;}
        .lc:hover{transform:translateY(-6px) scale(1.04);}
        .lc:active{transform:scale(0.94);}
      `}</style>
      <div style={{textAlign:"center",marginBottom:14,animation:"fadeUp 0.5s ease both"}}>
        <div style={{fontSize:66,display:"inline-block",animation:"float 2.5s ease infinite",filter:"drop-shadow(0 0 22px #E8436A66)"}}>🎨</div>
        <h1 style={{margin:"4px 0 6px",fontSize:"clamp(28px,7vw,40px)",fontWeight:900,letterSpacing:"-0.5px",background:"linear-gradient(90deg,#E53935,#FF9800,#FFD600,#4CAF50,#7C4DFF)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite"}}>Draw With Dad!</h1>
        <p style={{margin:0,fontSize:15,color:"#555",fontWeight:800}}>Colour · Trace · Build up your drawing 🖌️</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,width:"100%",maxWidth:420}}>
        {LESSONS.map((l,i)=>{
          const fc=l.steps.filter(s=>s.type==="fill").length;
          const lc=l.steps.filter(s=>s.type==="line").length;
          return (
            <div key={l.id} className="lc" onClick={()=>startLesson(l)} style={{background:`linear-gradient(145deg,#141428,${l.bg})`,borderRadius:24,padding:"22px 10px 18px",textAlign:"center",cursor:"pointer",boxShadow:`0 8px 32px ${l.color}33,inset 0 1px 0 ${l.color}22`,border:`1.5px solid ${l.color}44`,animation:`fadeUp ${0.3+i*0.1}s ease both`,position:"relative"}}>
              {done.includes(l.id)&&(<div style={{position:"absolute",top:10,right:10,background:"#4CAF50",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"white",fontWeight:900}}>✓</div>)}
              <div style={{fontSize:52,marginBottom:8,filter:`drop-shadow(0 4px 10px ${l.color}55)`}}>{l.emoji}</div>
              <div style={{fontSize:15,fontWeight:900,color:l.thumbColor}}>{l.title}</div>
              <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8}}>
                <span style={{fontSize:11,background:"#fff1",borderRadius:8,padding:"3px 8px",color:"#aaa",fontWeight:800}}>🎨 {fc} fill</span>
                <span style={{fontSize:11,background:"#fff1",borderRadius:8,padding:"3px 8px",color:"#aaa",fontWeight:800}}>✏️ {lc} line</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ══════════ COMPLETE ══════════
  if(screen==="complete") return (
    <div style={{...appStyle,background:"linear-gradient(160deg,#0f0f1e,#18080e)",justifyContent:"center",padding:24,textAlign:"center"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes popIn{from{opacity:0;transform:scale(0) rotate(-20deg)}to{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes fall{0%{opacity:1;transform:translateY(-30px) rotate(0)}100%{opacity:0;transform:translateY(560px) rotate(720deg)}}
        .bb{transition:transform 0.15s;}.bb:hover{transform:scale(1.05);}.bb:active{transform:scale(0.94);}
      `}</style>
      {["#E53935","#FF9800","#FFD600","#4CAF50","#7C4DFF","#2196F3","#FF69B4","#00BCD4"].map((c,i)=>(
        <div key={i} style={{position:"fixed",top:-30,left:`${4+i*13}%`,width:13,height:13,background:c,borderRadius:i%2===0?"50%":3,animation:`fall ${1.4+i*0.2}s ${i*0.12}s ease-in forwards`,zIndex:10}}/>
      ))}
      <div style={{fontSize:88,animation:"bounce 1s ease infinite",filter:"drop-shadow(0 0 26px #FFD700)"}}>🎉</div>
      <h2 style={{fontSize:"clamp(30px,8vw,44px)",fontWeight:900,margin:"10px 0 8px",background:`linear-gradient(135deg,${lesson.color},#FFD600)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AMAZING!!</h2>
      <p style={{fontSize:18,color:"#aaa",fontWeight:800,margin:"0 0 20px"}}>You drew a {lesson.title}! {lesson.emoji}</p>
      <Stars/>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:28,width:"100%",maxWidth:300}}>
        <button className="bb" onClick={()=>startLesson(lesson)} style={{background:`linear-gradient(135deg,${lesson.color},${lesson.color}bb)`,color:"white",border:"none",borderRadius:18,padding:"16px 24px",fontSize:17,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 24px ${lesson.color}55`}}>🔄 Draw it again!</button>
        <button className="bb" onClick={goHome} style={{background:"#fff1",color:"#aaa",border:"1.5px solid #333",borderRadius:18,padding:"14px 24px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>🏠 Pick another</button>
      </div>
    </div>
  );

  // ══════════ DRAW SCREEN ══════════
  return (
    <div style={{...appStyle,background:lesson.bg,padding:"12px 10px 22px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .cb{transition:transform 0.13s,opacity 0.13s;}.cb:hover{transform:scale(1.14);}.cb:active{transform:scale(0.86);}
        .nb{transition:transform 0.14s;}.nb:hover{transform:scale(1.04);}.nb:active{transform:scale(0.95);}
      `}</style>

      <div style={{display:"flex",alignItems:"center",width:"100%",maxWidth:440,marginBottom:8,gap:8}}>
        <button onClick={goHome} style={{background:"#fff1",border:"1.5px solid #333",borderRadius:12,padding:"9px 13px",fontSize:17,cursor:"pointer",fontFamily:"inherit",fontWeight:900,color:"#888"}}>←</button>
        <div style={{flex:1,textAlign:"center",fontWeight:900,fontSize:16,color:"#ddd"}}>{lesson.emoji} {lesson.title}</div>
        <div style={{background:`${phaseCol}22`,border:`1.5px solid ${phaseCol}55`,borderRadius:12,padding:"7px 12px",fontSize:12,fontWeight:900,color:phaseCol,whiteSpace:"nowrap"}}>{stepIdx+1} / {totalSteps}</div>
      </div>

      <div style={{width:"100%",maxWidth:440,height:8,background:"#1a1a1a",borderRadius:6,marginBottom:8,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${((stepIdx+1)/totalSteps)*100}%`,background:`linear-gradient(90deg,${phaseCol},${phaseCol}88)`,borderRadius:6,transition:"width 0.4s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 0 8px ${phaseCol}88`}}/>
      </div>

      <div style={{background:"#fff0d",border:`1.5px solid ${phaseCol}44`,borderRadius:16,padding:"9px 18px",marginBottom:8,fontSize:14,fontWeight:800,color:"#ddd",textAlign:"center",maxWidth:380,borderLeft:`4px solid ${phaseCol}`}}>
        {isFill?"🖌️":"✏️"} {step.hint}
        <span style={{marginLeft:8,fontSize:11,color:phaseCol,fontWeight:900}}>{isFill?"· colour it in!":"· trace the line!"}</span>
      </div>

      <div style={{position:"relative",width:"100%",maxWidth:400,aspectRatio:"400/440",borderRadius:22,overflow:"hidden",boxShadow:`0 14px 52px #000a,0 0 0 1.5px ${phaseCol}33`,animation:"fadeUp 0.3s ease both"}}>
        <div style={{position:"absolute",inset:0,background:BG,zIndex:0}}/>
        <svg viewBox="0 0 400 440" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1}}>
          {step.completedSVG(lesson.color)}
        </svg>
        <canvas ref={canvasRef} width={400} height={440} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",cursor:"crosshair",touchAction:"none",zIndex:2}}/>
        <svg viewBox="0 0 400 440" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:ghostOp,pointerEvents:"none",zIndex:3}}>
          {step.ghost(lesson.color)}
        </svg>
        <div style={{position:"absolute",top:8,left:8,zIndex:4,background:isFill?"#FF980088":"#2196F388",borderRadius:10,padding:"4px 10px",fontSize:12,fontWeight:900,color:"white"}}>{isFill?"🖌️ COLOUR":"✏️ TRACE"}</div>
        <button onClick={cycleGhost} style={{position:"absolute",top:8,right:8,zIndex:4,background:"#000a",border:"none",borderRadius:8,padding:"4px 8px",fontSize:12,fontWeight:900,color:"#888",cursor:"pointer",fontFamily:"inherit"}}>
          👻 {ghostOp<0.55?"dim":ghostOp<0.75?"mid":"bright"}
        </button>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginTop:8,width:"100%",maxWidth:400,background:"#fff08",border:"1.5px solid #fff1",borderRadius:18,padding:"10px 12px",boxSizing:"border-box"}}>
        {[8,16,26].map(sz=>(
          <button key={sz} className="cb" onClick={()=>setBrushSz(sz)} style={{width:38,height:38,borderRadius:"50%",border:"none",background:brushSz===sz?"#fff2":"#fff1",outline:brushSz===sz?`2.5px solid ${phaseCol}`:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:sz*0.7,height:sz*0.7,borderRadius:"50%",background:brushCol}}/>
          </button>
        ))}
        <div style={{width:1,height:28,background:"#fff2"}}/>
        <div style={{display:"flex",gap:4,flex:1,flexWrap:"wrap"}}>
          {PALETTE.map(c=>(
            <button key={c} className="cb" onClick={()=>setBrushCol(c)} style={{width:24,height:24,borderRadius:"50%",background:c,border:c==="#ffffff"?"1.5px solid #555":"none",boxShadow:brushCol===c?`0 0 0 2px #111,0 0 0 4px ${c}`:"none",cursor:"pointer"}}/>
          ))}
        </div>
      </div>

      <div style={{marginTop:8,width:"100%",maxWidth:400}}>
        <button className="nb" onClick={nextStep} style={{width:"100%",background:`linear-gradient(135deg,${phaseCol},${phaseCol}aa)`,border:"none",borderRadius:18,padding:"15px",fontSize:16,fontWeight:900,cursor:"pointer",color:"white",boxShadow:`0 6px 24px ${phaseCol}55`,fontFamily:"inherit"}}>
          {isLast?"🌟 I'm finished!":"✅ Done → Next step"}
        </button>
      </div>
      <p style={{margin:"8px 0 0",fontSize:11,color:"#333",fontWeight:700,textAlign:"center"}}>
        {stepIdx>0?"All your marks stay on the drawing ✨":"Follow the white dashed guide"}
      </p>
    </div>
  );
}
