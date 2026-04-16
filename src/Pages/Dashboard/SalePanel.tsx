import { message } from "antd";
import { useEffect, useState } from "react";
import {
  getDailySales,
  getMonthlySales,
  getTotalDailyProfit,
  getTotalMonthlyProfit,
  getTotalWeeklyProfit,
  getWeeklySales,
} from "../../Services/salesService";
import { FcSalesPerformance } from "react-icons/fc";
import { Sale } from "../../Types/SaleTypes";
import { FaMoneyBillWave, FaShoppingCart } from "react-icons/fa";

type SalesSummary = {
  title: string;
  salesCount: number;
  profit: number;
  subtitle: string;
  borderColor: string;
  badgeColor: string;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

type StatCardProps = SalesSummary;

const StatCard = ({
  title,
  salesCount,
  profit,
  subtitle,
  borderColor,
  badgeColor,
}: StatCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`absolute left-0 top-0 h-2 w-full ${borderColor}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{subtitle}</p>
          <h3 className="mt-1 text-xl font-bold text-gray-800">{title}</h3>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3 shadow-sm">
          <FcSalesPerformance className="text-4xl" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <FaShoppingCart className="text-sm" />
            <span className="text-sm font-medium">Nombre de ventes</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800">
            {salesCount}
          </h2>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-600">
            <FaMoneyBillWave className="text-sm" />
            <span className="text-sm font-medium">Bénéfice</span>
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-700">
            {formatCurrency(profit)} DH
          </h2>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">Performance actuelle</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeColor}`}
        >
          Active
        </span>
      </div>
    </div>
  );
};

const SalePanel = () => {
  const [dailyProfit, setDailyProfit] = useState(0);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);

  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [weeklySales, setWeeklySales] = useState<Sale[]>([]);
  const [monthlySales, setMonthlySales] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanelData = async () => {
      try {
        setLoading(true);

        const [
          dailyProfitData,
          weeklyProfitData,
          monthlyProfitData,
          dailySalesData,
          weeklySalesData,
          monthlySalesData,
        ] = await Promise.all([
          getTotalDailyProfit(),
          getTotalWeeklyProfit(),
          getTotalMonthlyProfit(),
          getDailySales(),
          getWeeklySales(),
          getMonthlySales(),
        ]);

        setDailyProfit(dailyProfitData ?? 0);
        setWeeklyProfit(weeklyProfitData ?? 0);
        setMonthlyProfit(monthlyProfitData ?? 0);

        setDailySales(dailySalesData ?? []);
        setWeeklySales(weeklySalesData ?? []);
        setMonthlySales(monthlySalesData ?? []);
      } catch (error) {
        console.error("Failed to fetch sales panel data", error);
        message.error("Échec du chargement des statistiques de vente");
      } finally {
        setLoading(false);
      }
    };

    fetchPanelData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 h-2 w-full animate-pulse rounded bg-gray-200" />
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-emerald-100" />
            </div>

            <div className="mt-5 h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  const cards: SalesSummary[] = [
    {
      title: "Ventes quotidiennes",
      subtitle: "Résumé des ventes du jour",
      salesCount: dailySales.length,
      profit: dailyProfit,
      borderColor: "bg-emerald-500",
      badgeColor: "bg-emerald-500",
    },
    {
      title: "Ventes hebdomadaires",
      subtitle: "Résumé des ventes de la semaine",
      salesCount: weeklySales.length,
      profit: weeklyProfit,
      borderColor: "bg-blue-500",
      badgeColor: "bg-blue-500",
    },
    {
      title: "Ventes mensuelles",
      subtitle: "Résumé des ventes du mois",
      salesCount: monthlySales.length,
      profit: monthlyProfit,
      borderColor: "bg-purple-500",
      badgeColor: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          subtitle={card.subtitle}
          salesCount={card.salesCount}
          profit={card.profit}
          borderColor={card.borderColor}
          badgeColor={card.badgeColor}
        />
      ))}
    </div>
  );
};

export default SalePanel;