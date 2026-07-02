export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="app-bg-base absolute inset-0" />
      <div className="app-bg-topo-layer app-bg-topo-layer-a absolute -inset-[10%] h-[120%] w-[120%]">
        <TopoSvg variant="primary" />
      </div>
      <div className="app-bg-topo-layer app-bg-topo-layer-b absolute -inset-[12%] h-[124%] w-[124%]">
        <TopoSvg variant="secondary" />
      </div>
      <div className="app-bg-topo-fade absolute inset-0" />
    </div>
  );
}

function TopoSvg({ variant }: { variant: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="rgba(255,255,255,0.05)">
            <path d="M-80 160 C100 120, 240 190, 400 140 S640 90, 840 140 S1060 180, 1260 130" />
            <path d="M-40 260 C120 220, 280 290, 440 240 S680 190, 880 240 S1100 280, 1240 230" />
            <path d="M-60 660 C120 620, 280 690, 440 640 S680 580, 880 630 S1100 680, 1260 620" />
            <path d="M20 760 C180 720, 340 790, 500 740 S740 680, 940 730 S1160 770, 1240 720" />
            <path d="M100 120 C260 80, 420 150, 580 100 S820 50, 1020 100 S1180 140, 1240 90" />
          </g>
          <g stroke="rgba(227,25,55,0.04)">
            <path d="M-40 360 C160 310, 300 380, 460 330 S700 270, 900 320 S1120 360, 1260 300" />
            <path d="M0 560 C180 510, 340 580, 500 530 S740 470, 940 520 S1160 560, 1240 500" />
          </g>
          <g stroke="rgba(255,255,255,0.035)">
            <ellipse cx="400" cy="280" rx="120" ry="75" />
            <ellipse cx="860" cy="520" rx="140" ry="85" />
            <ellipse cx="180" cy="640" rx="100" ry="60" />
          </g>
        </g>
      </svg>
    );
  }

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="rgba(255,255,255,0.09)">
          <path d="M-40 520 C120 470, 220 560, 380 510 S620 450, 780 500 S1020 540, 1240 490" />
          <path d="M-60 420 C140 360, 260 440, 420 390 S660 330, 860 380 S1080 420, 1260 360" />
          <path d="M-20 620 C160 580, 300 650, 460 600 S700 540, 900 590 S1100 640, 1240 580" />
          <path d="M40 320 C200 280, 340 350, 500 300 S740 250, 940 300 S1120 340, 1220 290" />
          <path d="M80 220 C240 180, 380 250, 540 200 S780 150, 980 200 S1160 240, 1240 190" />
          <path d="M-80 720 C100 680, 240 750, 400 700 S640 640, 840 690 S1060 740, 1260 680" />
          <path d="M-100 120 C80 80, 220 150, 380 100 S620 50, 820 100 S1040 140, 1260 90" />
          <path d="M-20 280 C160 240, 300 310, 460 260 S700 200, 900 250 S1120 290, 1240 240" />
          <path d="M60 680 C220 640, 380 710, 540 660 S780 600, 980 650 S1160 690, 1240 640" />
          <path d="M120 780 C280 740, 440 810, 600 760 S840 700, 1040 750 S1180 790, 1240 740" />
        </g>
        <g stroke="rgba(227,25,55,0.075)">
          <path d="M-20 480 C180 430, 320 500, 480 450 S720 390, 920 440 S1120 480, 1260 420" />
          <path d="M20 380 C200 330, 360 400, 520 350 S760 290, 960 340 S1140 380, 1240 330" />
          <path d="M60 580 C220 540, 380 610, 540 560 S780 500, 980 550 S1160 590, 1240 540" />
          <path d="M-60 180 C120 130, 280 200, 440 150 S680 90, 880 140 S1100 180, 1260 120" />
          <path d="M100 460 C260 410, 420 480, 580 430 S820 370, 1020 420 S1200 460, 1240 410" />
        </g>
        <g stroke="rgba(255,255,255,0.055)">
          <ellipse cx="280" cy="360" rx="210" ry="130" />
          <ellipse cx="720" cy="440" rx="250" ry="150" />
          <ellipse cx="520" cy="560" rx="180" ry="110" />
          <ellipse cx="920" cy="300" rx="160" ry="95" />
          <ellipse cx="140" cy="500" rx="140" ry="85" />
          <ellipse cx="1040" cy="580" rx="130" ry="80" />
          <ellipse cx="360" cy="200" rx="150" ry="90" />
          <ellipse cx="600" cy="680" rx="170" ry="100" />
        </g>
      </g>
    </svg>
  );
}
