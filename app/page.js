"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <p className="text-xl font-medium">Memuat Graf...</p>,
});

export default function Home() {
  const [targetName, setTargetName] = useState(""); 
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchData = async () => {
    if (!targetName.trim()) {
      alert("Masukkan target terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    setGraphData(null); 
    
    try {
      const queryParams = new URLSearchParams({
        target: targetName.trim()
      });

      const response = await fetch(`/api/fraud/circular?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        if (result.data.nodes.length === 0) {
          alert("Data tidak ditemukan untuk target tersebut.");
          setGraphData(null); 
        } else {
          setGraphData(result.data);
        }
      } else {
        alert("Terjadi kesalahan: " + result.error);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server:", error);
      alert("Terjadi masalah jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const drawNode = useCallback((node, ctx, globalScale) => {
    const label = node.name || node.ip || node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const isUser = node.label === "User";
    ctx.fillStyle = isUser ? "#9CCC65" : "#90CAF9"; 

    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillStyle = "#333"; 
    ctx.fillText(label, node.x, node.y + 12);
  }, []);

  return (
    <div className="flex flex-col min-h-screen md:flex-row bg-white font-sans text-black">
      
      <aside className="w-full md:w-[400px] p-10 flex flex-col gap-10 border-r border-zinc-200 shadow-sm z-10 bg-white">
        <h1 className="text-5xl font-normal tracking-tight">FraudLens</h1>

        <div className="flex flex-col gap-8 mt-4">
          
          <div className="flex flex-col gap-2">
            <label className="text-lg font-medium pl-2">Enter Target</label>
            <input 
              type="text" 
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="bg-[#d9d9d9] h-12 rounded-full px-6 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={handleFetchData}
              disabled={isLoading}
              className="bg-[#FFD166] hover:bg-[#ffc233] transition-colors text-black font-medium text-xl px-10 py-2 rounded-full disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Enter"}
            </button>
          </div>

        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 bg-[#f7f7f7]">
        <div className="w-full h-full min-h-[500px] bg-[#cbcbcb] rounded-3xl overflow-hidden relative flex items-center justify-center">
          
          {!graphData && !isLoading ? (
            <h2 className="text-5xl font-normal text-[#999999] italic text-center z-10 pointer-events-none">
            </h2>
          ) : graphData ? (
            <div className="absolute inset-0 w-full h-full">
              <ForceGraph2D
                graphData={graphData}
                nodeCanvasObject={drawNode}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkLabel="type" 
                linkColor={() => "#666"} 
                backgroundColor="#cbcbcb"
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}