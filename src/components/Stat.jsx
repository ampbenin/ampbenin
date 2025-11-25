import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { CountUp } from "countup.js";

const stats = [
  { title: "Projets lancés", value: 42, icon: "🏗️", color: "from-blue-500 to-blue-700" },
  { title: "Volontaires", value: 128, icon: "🙋‍♂️", color: "from-green-500 to-green-700" },
  { title: "Partenaires", value: 15, icon: "🤝", color: "from-yellow-500 to-yellow-600" },
  { title: "Bénéficiaires", value: 5400, icon: "🌍", color: "from-red-500 to-red-700" }
];

export default function Stat() {
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);

  useEffect(() => {
    // CountUp Animation
    stats.forEach((stat, index) => {
      const el = document.getElementById(`count-${index}`);
      if (el) {
        new CountUp(el, stat.value, {
          duration: 2,
          separator: ","
        }).start();
      }
    });

    // BAR CHART
    if (barChartRef.current) {
      new Chart(barChartRef.current, {
        type: "bar",
        data: {
          labels: ["2022", "2023", "2024", "2025"],
          datasets: [
            {
              label: "Projets par année",
              data: [10, 18, 25, 42],
              backgroundColor: ["#3B82F6", "#10B981", "#FBBF24", "#EF4444"],
              borderRadius: 8,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // DOUGHNUT CHART
    if (doughnutChartRef.current) {
      new Chart(doughnutChartRef.current, {
        type: "doughnut",
        data: {
          labels: stats.map(s => s.title),
          datasets: [{
            data: stats.map(s => s.value),
            backgroundColor: ["#3B82F6", "#10B981", "#FBBF24", "#EF4444"],
            hoverOffset: 14
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* TITLE */}
        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12 animate-fadeIn">
          📊 Statistiques de l'organisation
        </h2>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl shadow-lg text-white bg-gradient-to-br ${stat.color}
              transform hover:scale-105 hover:shadow-2xl transition-all duration-500 animate-fadeIn opacity-0`}
              style={{ animationDelay: `${index * 0.2}s`, animationFillMode: "forwards" }}
            >
              <div className="text-5xl mb-3 animate-bounce">{stat.icon}</div>
              <div id={`count-${index}`} className="text-4xl font-semibold">0</div>
              <p className="text-sm mt-2 opacity-90">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* GRAPHS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="bg-white p-6 rounded-2xl shadow-lg h-80 animate-fadeIn delay-200">
            <h3 className="text-lg font-semibold mb-3">Évolution des projets</h3>
            <div className="h-64">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg h-80 animate-fadeIn delay-400">
            <h3 className="text-lg font-semibold mb-3">Répartition des ressources</h3>
            <div className="h-64">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 1s ease forwards; }

        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </section>
  );
}
