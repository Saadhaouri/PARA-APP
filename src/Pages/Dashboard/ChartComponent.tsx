import { useEffect, useMemo, useState } from "react";
import { Column } from "@ant-design/charts";
import axios from "axios";
import { FaChartBar } from "react-icons/fa";

interface BenefitData {
  month: string;
  benefit: number;
}

const ChartComponent = () => {
  const [data, setData] = useState<BenefitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalBenefits = useMemo(() => {
    return data.reduce((acc, item) => acc + item.benefit, 0);
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<BenefitData[]>(
          "http://localhost:5133/Sales/monthly-benefits"
        );

        if (isMounted) {
          setData(response.data ?? []);
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
        if (isMounted) {
          setError("Impossible de charger les bénéfices mensuels.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const config = {
    data,
    xField: "month",
    yField: "benefit",
    height: 320,
    columnWidthRatio: 0.55,
    xAxis: {
      label: {
        autoHide: false,
        autoRotate: false,
        style: {
          fill: "#6B7280",
          fontSize: 12,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12,
        },
      },
      grid: {
        line: {
          style: {
            stroke: "#E5E7EB",
            lineDash: [4, 4],
          },
        },
      },
    },
    meta: {
      benefit: {
        alias: "Bénéfice",
        formatter: (value: number) => `${value.toFixed(2)} DH`,
      },
      month: {
        alias: "Mois",
      },
    },
    tooltip: {
      formatter: (datum: BenefitData) => {
        return {
          name: "Bénéfice",
          value: `${datum.benefit.toFixed(2)} DH`,
        };
      },
    },
    label: {
      position: "top",
      style: {
        fill: "#374151",
        opacity: 0.8,
        fontSize: 11,
      },
      formatter: (datum: BenefitData) => `${datum.benefit.toFixed(0)} DH`,
    },
    state: {
      active: {
        style: {
          shadowBlur: 6,
          stroke: "#10B981",
          lineWidth: 1,
        },
      },
    },
    animation: {
      appear: {
        animation: "wave-in",
        duration: 600,
      },
    },
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-7 w-44 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-emerald-100" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-gray-100 p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-emerald-100" />
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-emerald-100" />
          </div>
        </div>

        <div className="h-[320px] animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-red-600">Erreur</h3>
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Aperçu des performances
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-800">
            Bénéfices mensuels
          </h2>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3">
          <FaChartBar className="text-2xl text-emerald-600" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Nombre de mois</p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-800">
            {data.length}
          </h3>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-600">Total des bénéfices</p>
          <h3 className="mt-2 text-3xl font-extrabold text-emerald-700">
            {totalBenefits.toFixed(2)} DH
          </h3>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-2">
        <Column {...config} />
      </div>
    </div>
  );
};

export default ChartComponent;