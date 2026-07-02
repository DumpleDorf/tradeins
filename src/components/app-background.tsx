export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="app-bg-base absolute inset-0" />
      <div className="app-bg-topo-layer absolute -inset-[8%] h-[116%] w-[116%]">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="rgba(255,255,255,0.055)">
              <path d="M-40 520 C120 470, 220 560, 380 510 S620 450, 780 500 S1020 540, 1240 490" />
              <path d="M-60 420 C140 360, 260 440, 420 390 S660 330, 860 380 S1080 420, 1260 360" />
              <path d="M-20 620 C160 580, 300 650, 460 600 S700 540, 900 590 S1100 640, 1240 580" />
              <path d="M40 320 C200 280, 340 350, 500 300 S740 250, 940 300 S1120 340, 1220 290" />
              <path d="M80 220 C240 180, 380 250, 540 200 S780 150, 980 200 S1160 240, 1240 190" />
              <path d="M-80 720 C100 680, 240 750, 400 700 S640 640, 840 690 S1060 740, 1260 680" />
            </g>
            <g stroke="rgba(227,25,55,0.045)">
              <path d="M-20 480 C180 430, 320 500, 480 450 S720 390, 920 440 S1120 480, 1260 420" />
              <path d="M20 380 C200 330, 360 400, 520 350 S760 290, 960 340 S1140 380, 1240 330" />
              <path d="M60 580 C220 540, 380 610, 540 560 S780 500, 980 550 S1160 590, 1240 540" />
            </g>
            <g stroke="rgba(255,255,255,0.035)">
              <ellipse cx="280" cy="360" rx="210" ry="130" />
              <ellipse cx="720" cy="440" rx="250" ry="150" />
              <ellipse cx="520" cy="560" rx="180" ry="110" />
              <ellipse cx="920" cy="300" rx="160" ry="95" />
              <ellipse cx="140" cy="500" rx="140" ry="85" />
            </g>
          </g>
        </svg>
      </div>
      <div className="app-bg-topo-fade absolute inset-0" />
    </div>
  );
}
