import React, { useState, useEffect } from "react";

const SpinnerBlob = ({ size = 200, speed = 50 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Your 15 SVG frames go here - replace these paths with your actual SVG path data
  const frames = [
    "M146.5 -155.9C195.8 -133.3 245.6 -92.7 262.4 -40C279.2 12.8 263 77.6 225.7 119.1C188.4 160.5 129.9 178.4 77.1 186.8C24.3 195.1 -22.9 193.9 -77.7 185.9C-132.5 177.9 -194.8 163.2 -213.9 125.7C-232.9 88.2 -208.5 27.9 -192.2 -28.6C-175.9 -85 -167.7 -137.5 -137 -163.3C-106.3 -189.2 -53.1 -188.3 -2.2 -185.7C48.6 -183 97.3 -178.4 146.5 -155.9",
    "M165.8 -186.3C215 -156.3 255.2 -104.2 260.3 -49.7C265.4 4.8 235.3 61.6 199.9 108.2C164.4 154.8 123.6 191.1 72.9 216.6C22.2 242.1 -38.3 256.8 -86.5 238.8C-134.6 220.7 -170.4 169.9 -184.7 119.2C-199 68.5 -191.8 18 -178.9 -27.4C-166 -72.8 -147.3 -113 -116.5 -146.2C-85.7 -179.5 -42.9 -205.7 7.7 -214.9C58.3 -224.1 116.6 -216.2 165.8 -186.3",
    "M141.8 -173.2C172.5 -143.1 178.6 -87.8 189.8 -32.3C201 23.3 217.4 79.1 201.3 124.8C185.2 170.5 136.5 206 82.1 225.9C27.7 245.9 -32.5 250.3 -82.8 230.6C-133.1 210.9 -173.5 167.2 -191.2 118.9C-208.9 70.6 -203.9 17.8 -200.4 -41.1C-196.9 -100 -194.9 -164.9 -161.7 -194.6C-128.6 -224.2 -64.3 -218.6 -4.4 -213.4C55.5 -208.1 111 -203.3 141.8 -173.2",
    "M128.3 -137.4C174.7 -113.9 226.7 -81.5 243.8 -35.5C260.9 10.6 243 70.3 213.7 125.5C184.3 180.6 143.5 231.3 89.1 255.8C34.8 280.3 -33.1 278.8 -92.3 256.1C-151.6 233.5 -202.2 189.7 -219.9 137.5C-237.5 85.2 -222.2 24.4 -200.1 -23.9C-178 -72.2 -149.3 -107.9 -114.8 -133.5C-80.4 -159.1 -40.2 -174.5 0.4 -175C40.9 -175.4 81.8 -160.9 128.3 -137.4",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [speed, frames.length]);

  return (
    <div style={{ display: "inline-block", width: size, height: size }}>
      <svg
        viewBox="0 0 900 600"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <rect x="0" y="0" width="900" height="600" fill="transparent" />
        <g transform="translate(425.89905914228854 297.2271706737573)">
          <path d={frames[currentFrame]} fill="#3e3e3e" />
        </g>
      </svg>
    </div>
  );
};

export default SpinnerBlob;

// Usage example:
// <Spinner size={200} speed={50} />
// size: width/height in pixels
// speed: milliseconds between frames (lower = faster)
