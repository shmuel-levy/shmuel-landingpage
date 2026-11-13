/* Hand-drawn SVG characters for the finishing scenes (WAAPI-animated by scenes.ts). */

export const ACC = "var(--fx-accent, var(--accent-deep, #B83563))", ACC2 = "var(--fx-accent2, var(--accent, #E26D93))";
export const HEART = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/></svg>';
export const STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5c.9 6.1 3.4 9.1 10.5 10.5-7.1 1.4-9.6 4.4-10.5 10.5C11.1 16.4 8.6 13.4 1.5 12 8.6 10.6 11.1 7.6 12 1.5z"/></svg>';
export const ART = {
  cupid: `<svg viewBox="0 0 120 120" class="fx-svg">
    <g class="fx-wing fx-wing--b"><path d="M84 56c14-22 34-24 32-8-1 9-10 12-18 13 8 1 13 6 9 12-5 7-17 2-23-7z" fill="#fff" stroke="#E8C8D4" stroke-width="2"/><path d="M92 54c8-6 15-7 18-4M93 62c7-1 12 0 14 3" fill="none" stroke="#F0D6DF" stroke-width="1.6" stroke-linecap="round"/></g>
    <path d="M58 64c-8 0-16 1-22 1" fill="none" stroke="#F4BFA4" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="72" cy="72" rx="16" ry="18" fill="#FFD8C4"/>
    <path d="M58 70c6 4 20 6 30-2l-2 9c-8 6-20 5-27-1z" fill="${ACC}" opacity=".92"/>
    <circle cx="63" cy="93" r="7" fill="#FFD0BA"/><circle cx="80" cy="91" r="7" fill="#FFD0BA"/>
    <circle cx="70" cy="38" r="18" fill="#FFE2D2"/>
    <g fill="#F2B84B"><circle cx="58" cy="26" r="6"/><circle cx="66" cy="21" r="6.5"/><circle cx="75" cy="21" r="6.5"/><circle cx="83" cy="27" r="6"/><circle cx="86" cy="35" r="5"/><circle cx="64" cy="18" r="3"/></g>
    <circle cx="61" cy="43" r="3.4" fill="#F7A8B8" opacity=".75"/><circle cx="77" cy="43" r="3.4" fill="#F7A8B8" opacity=".75"/>
    <path d="M60 37q2.5-2.5 5 0M71 37q2.5-2.5 5 0" fill="none" stroke="#4A2A2A" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M65 46q3 3 6 0" fill="none" stroke="#C0566F" stroke-width="1.8" stroke-linecap="round"/>
    <g class="fx-wing"><path d="M80 62c10-18 26-20 25-8-1 7-8 10-14 10 6 1 10 5 7 10-4 5-13 1-18-6z" fill="#fff" stroke="#E8C8D4" stroke-width="2"/></g>
    <path d="M36 36Q10 65 36 94" fill="none" stroke="#B5832F" stroke-width="4" stroke-linecap="round"/>
    <path class="fx-string" d="M36 36L36 65L36 94" fill="none" stroke="#7A5A2A" stroke-width="1.2"/>
    <g class="fx-nock"><path d="M50 65H18" stroke="#8A6A3A" stroke-width="2.6" stroke-linecap="round"/><path d="M18 65c-2-3-7-3-7 1s5 6 7 8c2-2 7-4 7-8s-5-4-7-1z" transform="translate(-6 -4)" fill="${ACC}"/><path d="M50 65l5-5M50 65l5 5M46 65l5-5M46 65l5 5" stroke="${ACC2}" stroke-width="2" stroke-linecap="round"/></g>
  </svg>`,
  arrow: `<svg viewBox="0 0 60 20" class="fx-svg"><path d="M48 10H10" stroke="#8A6A3A" stroke-width="2.6" stroke-linecap="round"/><path d="M10 10c-2-3-7-3-7 1s5 6 7 8c2-2 7-4 7-8s-5-4-7-1z" transform="translate(-4 -5)" fill="${ACC}"/><path d="M48 10l6-6M48 10l6 6M43 10l6-6M43 10l6 6" stroke="${ACC2}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  chuppah: `<svg viewBox="0 0 200 130" class="fx-svg" preserveAspectRatio="none">
    <g class="fx-poles"><rect x="14" y="30" width="6" height="100" rx="3" fill="#C9A35A"/><rect x="180" y="30" width="6" height="100" rx="3" fill="#C9A35A"/>
      <path d="M17 40c-4 14 2 30-2 46s3 26 0 40M183 40c4 14-2 30 2 46s-3 26 0 40" fill="none" stroke="#7DB36B" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>
    <g class="fx-canopy">
      <path d="M6 22h188v14c-10 10-20 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0z" fill="#FFFDF8" stroke="#E6D7B8" stroke-width="1.5"/>
      <path d="M6 26h188M6 31h188" stroke="#7FA4D9" stroke-width="1.6" opacity=".7"/>
      <path d="M6 22c40-16 148-16 188 0" fill="#FFFDF8" stroke="#E6D7B8" stroke-width="1.5"/>
      <g fill="${ACC2}"><circle cx="10" cy="22" r="6"/><circle cx="190" cy="22" r="6"/><circle cx="100" cy="10" r="5"/></g>
      <g fill="#F7D36B"><circle cx="16" cy="18" r="3.5"/><circle cx="184" cy="18" r="3.5"/><circle cx="92" cy="12" r="3"/><circle cx="108" cy="12" r="3"/></g>
      <g fill="#7DB36B"><ellipse cx="4" cy="26" rx="5" ry="2.4" transform="rotate(-30 4 26)"/><ellipse cx="196" cy="26" rx="5" ry="2.4" transform="rotate(30 196 26)"/></g>
    </g>
  </svg>`,
  rabbi: `<svg viewBox="0 0 100 130" class="fx-svg">
    <path d="M28 128l6-58c4-8 28-8 32 0l6 58z" fill="#1E1E28"/>
    <path d="M43 66l7 14 7-14" fill="#fff"/><path d="M50 80v46" stroke="#33333F" stroke-width="1.4"/>
    <circle cx="44" cy="96" r="1.6" fill="#55556A"/><circle cx="44" cy="108" r="1.6" fill="#55556A"/>
    <g class="fx-arm-l"><path d="M34 74c-8 10-10 22-6 32" fill="none" stroke="#1E1E28" stroke-width="9" stroke-linecap="round"/><circle cx="28" cy="107" r="4.5" fill="#F3D2B9"/></g>
    <ellipse cx="50" cy="40" rx="15" ry="17" fill="#F3D2B9"/>
    <path d="M35 44c0 18 6 30 15 32 9-2 15-14 15-32-5 5-10 7-15 7s-10-2-15-7z" fill="#5A5148"/>
    <path d="M44 50q6 4 12 0" fill="none" stroke="#3A332C" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M43 39q2.5-2 5 0M52 39q2.5-2 5 0" fill="none" stroke="#2A2420" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="42" cy="45" r="2.6" fill="#F2A6A6" opacity=".55"/><circle cx="58" cy="45" r="2.6" fill="#F2A6A6" opacity=".55"/>
    <path d="M35 40c-2 6-1 12 1 16M65 40c2 6 1 12-1 16" fill="none" stroke="#5A5148" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="50" cy="26" rx="27" ry="5.5" fill="#15151C"/>
    <path d="M36 26c0-12 5-17 14-17s14 5 14 17z" fill="#15151C"/><path d="M36 22h28" stroke="#2C2C38" stroke-width="2.4"/>
    <g class="fx-arm-r"><path d="M66 74c10 4 16 0 20-8" fill="none" stroke="#1E1E28" stroke-width="9" stroke-linecap="round"/><circle cx="87" cy="64" r="4.5" fill="#F3D2B9"/>
      <g class="fx-held"><path d="M82 46h10l-1 9c-1 3-3 4-4 4s-3-1-4-4z" fill="rgba(210,235,255,.85)" stroke="#9FB9D6" stroke-width="1.2"/><path d="M87 59v5M84 64h6" stroke="#9FB9D6" stroke-width="1.4" stroke-linecap="round"/></g></g>
  </svg>`,
  glass: `<svg viewBox="0 0 24 30" class="fx-svg"><path d="M5 2h14l-1.5 11c-1 5-4 6-5.5 6s-4.5-1-5.5-6z" fill="rgba(210,235,255,.9)" stroke="#8FB0D2" stroke-width="1.4"/><path d="M7 5h10" stroke="#fff" stroke-width="1.4" opacity=".8"/><path d="M12 19v7M8 27h8" stroke="#8FB0D2" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  ringbox: `<svg viewBox="0 0 100 90" class="fx-svg">
    <path d="M14 46h72v32c0 4-3 7-7 7H21c-4 0-7-3-7-7z" fill="${ACC}"/><path d="M14 46h72v8H14z" fill="#000" opacity=".15"/>
    <path d="M30 46c0-8 9-12 20-12s20 4 20 12" fill="#3A1426" opacity=".85"/>
    <g class="fx-lid"><path d="M14 46c0-14 16-22 36-22s36 8 36 22z" fill="${ACC}"/><path d="M22 40c6-8 18-11 28-11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/></g>
  </svg>`,
  ring: `<svg viewBox="0 0 40 46" class="fx-svg"><circle cx="20" cy="30" r="12" fill="none" stroke="#E8B84A" stroke-width="4"/><circle cx="20" cy="30" r="12" fill="none" stroke="#FFE8A6" stroke-width="1.2" opacity=".8"/><path d="M13 12l7-9 7 9-7 7z" fill="#E9F6FF" stroke="#9CC9EC" stroke-width="1.4"/><path d="M13 12h14M20 3l-3 9 3 7 3-7z" fill="none" stroke="#B9DCF5" stroke-width="1"/></svg>`,
  balloon: `<svg viewBox="0 0 60 120" class="fx-svg"><g class="fx-balloon"><ellipse cx="30" cy="30" rx="24" ry="28" fill="${ACC2}"/><ellipse cx="30" cy="30" rx="24" ry="28" fill="url(#fxbg)"/>
    <defs><radialGradient id="fxbg" cx="35%" cy="28%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>
    <path d="M26 57l4 5 4-5z" fill="${ACC}"/></g><path class="fx-strand" d="M30 62c-6 10 6 18 0 28s6 18 0 28" fill="none" stroke="#8A8FA8" stroke-width="1.4"/></svg>`,
  stork: `<svg viewBox="0 0 140 110" class="fx-svg">
    <g class="fx-wing fx-wing--b"><path d="M70 40c10-26 40-34 52-26-8 4-14 10-18 18 8-2 16 0 20 4-12 4-30 8-54 4z" fill="#F2F4F8" stroke="#D6DAE4" stroke-width="1.4"/><path d="M110 18c4-2 9-3 12-4M114 30c3 0 6 1 8 2" stroke="#2A2E3A" stroke-width="3" stroke-linecap="round"/></g>
    <ellipse cx="72" cy="50" rx="26" ry="15" fill="#fff" stroke="#E2E6EE" stroke-width="1.4"/>
    <path d="M96 52c8 2 16 6 22 12" stroke="#E38B3A" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M92 58c6 6 10 14 12 22" stroke="#E38B3A" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M50 46c-8-8-14-18-14-26" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <circle cx="36" cy="18" r="9" fill="#fff" stroke="#E2E6EE" stroke-width="1.2"/><circle cx="33" cy="16" r="1.8" fill="#222"/>
    <path d="M28 18L4 24l25 2z" fill="#F0A04B"/>
    <g class="fx-wing"><path d="M64 46c6-20 30-28 44-22-8 4-12 10-14 16 6-1 12 1 16 4-12 4-26 6-46 2z" fill="#fff" stroke="#D6DAE4" stroke-width="1.4"/><path d="M100 26c4-1 7-1 10 0" stroke="#2A2E3A" stroke-width="3" stroke-linecap="round"/></g>
    <g class="fx-held"><path d="M10 24l-2 12" stroke="#C9A35A" stroke-width="1.6"/><path d="M8 36c-10 0-14 8-12 16 2 7 8 10 14 10s12-3 14-10c2-8-2-16-12-16-2 3-4 3-4 0z" fill="#FFE1EA" stroke="#F0B6C7" stroke-width="1.4"/><circle cx="8" cy="49" r="5.5" fill="#FFE2D2"/><path d="M6 49q2 2 4 0" stroke="#C0566F" stroke-width="1" fill="none"/></g>
  </svg>`,
  bundle: `<svg viewBox="0 0 40 34" class="fx-svg"><path d="M20 4c-12 0-18 9-16 18 2 8 9 11 16 11s14-3 16-11c2-9-4-18-16-18-2 3-4 3-4 0z" fill="#FFE1EA" stroke="#F0B6C7" stroke-width="1.4"/><circle cx="20" cy="19" r="6.5" fill="#FFE2D2"/><path d="M17.5 19q2.5 2.4 5 0" stroke="#C0566F" stroke-width="1.1" fill="none"/></svg>`,
  dove: `<svg viewBox="0 0 120 90" class="fx-svg">
    <g class="fx-wing fx-wing--b"><path d="M56 40c4-24 30-36 46-30-6 4-10 10-12 16 6-2 12-1 16 2-12 6-28 12-50 12z" fill="#EEF1F7" stroke="#D3D9E5" stroke-width="1.4"/></g>
    <path d="M30 46c0-12 12-20 26-18 18 2 30 14 40 20 6 4 14 4 18 2-4 8-12 12-22 12H52C38 62 30 56 30 46z" fill="#fff" stroke="#DCE1EA" stroke-width="1.4"/>
    <circle cx="30" cy="40" r="11" fill="#fff" stroke="#DCE1EA" stroke-width="1.4"/><circle cx="27" cy="38" r="1.8" fill="#2A2E3A"/>
    <path d="M20 40l-9 3 9 2z" fill="#E9A85A"/>
    <g class="fx-held"><path d="M13 44c-6 4-10 10-12 18" fill="none" stroke="#6B8F4E" stroke-width="1.8" stroke-linecap="round"/><g fill="#7DB36B"><ellipse cx="6" cy="50" rx="5" ry="2.4" transform="rotate(-50 6 50)"/><ellipse cx="11" cy="54" rx="5" ry="2.4" transform="rotate(20 11 54)"/><ellipse cx="2" cy="58" rx="5" ry="2.4" transform="rotate(-40 2 58)"/></g></g>
    <g class="fx-wing"><path d="M50 44c6-22 30-30 44-24-6 4-10 8-11 14 6-1 11 1 14 4-12 6-28 8-47 6z" fill="#fff" stroke="#D3D9E5" stroke-width="1.4"/></g>
  </svg>`,
  plane: `<svg viewBox="0 0 60 40" class="fx-svg"><path d="M2 20L58 2 40 38 28 26z" fill="#fff" stroke="#C9CFDD" stroke-width="1.4" stroke-linejoin="round"/><path d="M58 2L28 26l-4 12 4-12" fill="#E3E8F2" stroke="#C9CFDD" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 20l26 6" stroke="#C9CFDD" stroke-width="1.2"/></svg>`,
} as const;
