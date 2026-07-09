import Chart from 'chart.js/auto';

const ctx = (
  document.getElementById('headless-chart') as HTMLCanvasElement
).getContext('2d') as CanvasRenderingContext2D;

const headlessChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [] as number[],
    datasets: [
      {
        label: 'Mean Squared Displacement',
        data: [] as number[],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Spatial Entropy',
        data: [] as number[],
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.5)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Normalized Average Distance',
        data: [] as number[],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
    ],
  },
  options: {
    responsive: true,
    aspectRatio: 1,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Headless Mode Statistics',
        font: {
          size: 16,
        },
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Time (s)',
        },
        grid: {
          display: true,
        },
        ticks: {
          maxTicksLimit: 10,
          callback: (value: any) => Number(value).toFixed(2),
        },
        min: 0,
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          display: true,
        },
        ticks: {
          maxTicksLimit: 10,
          callback: (value: any) => Number(value).toFixed(2),
        },
        min: 0,
        max: 1,
      },
    },
  },
});

export { headlessChart };
