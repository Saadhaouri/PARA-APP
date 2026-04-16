import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Select, InputNumber, Spin, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import {
  FaChartLine,
  FaCoins,
  FaSyncAlt,
  FaWallet,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const { Option } = Select;

interface CapitalBenefit {
  year: number;
  month: number;
  totalCapital: number;
  totalBenefit: number;
}

const monthName = (month: number) => {
  if (!month || month < 1 || month > 12) return "-";
  return dayjs().month(month - 1).format("MMMM");
};

const formatCurrency = (value: number | null | undefined) =>
  `${Number(value ?? 0).toFixed(2)} DH`;

const normalizeItem = (item: any): CapitalBenefit => ({
  year: Number(item?.year ?? 0),
  month: Number(item?.month ?? 0),
  totalCapital: Number(item?.totalCapital ?? 0),
  totalBenefit: Number(item?.totalBenefit ?? 0),
});

const SummaryCard = ({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}) => {
  return (
    <div className={`rounded-3xl p-5 text-white shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h3 className="mt-2 text-2xl font-extrabold">{value}</h3>
        </div>
        <div className="rounded-2xl bg-white/20 p-3">{icon}</div>
      </div>
    </div>
  );
};

const CapitalBenefits: React.FC = () => {
  const [data, setData] = useState<CapitalBenefit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [year, setYear] = useState<number>(dayjs().year());
  const [month, setMonth] = useState<number | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);
 
  const fetchData = async (
    selectedYear: number,
    selectedMonth: number | null,
    silent = false
  ) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        "http://localhost:5133/Sales/capital-benefits",
        { params: { year: selectedYear, month: selectedMonth } }
      );

      setData((response.data ?? []).map(normalizeItem));
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      message.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

   console.log("Données chargées :", data);
  useEffect(() => {
    fetchData(year, month);
  }, [year, month]);

  const totalCapital = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.totalCapital ?? 0), 0),
    [data]
  );

  const totalBenefit = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.totalBenefit ?? 0), 0),
    [data]
  );

  const totalGeneral = useMemo(
    () => totalCapital + totalBenefit,
    [totalCapital, totalBenefit]
  );

  const handleExportPdf = async () => {
    if (!pdfRef.current) return;

    try {
      setExporting(true);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f9fafb",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const monthLabel = month ? monthName(month) : "all-months";
      pdf.save(`capital-benefits-${year}-${monthLabel}.pdf`);
      message.success("PDF exporté avec succès");
    } catch (error) {
      console.error("Erreur export PDF :", error);
      message.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Analyse financière</p>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-gray-800">
                <FaChartLine className="text-emerald-600" />
                Capital & Bénéfices
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Vue rapide par mois et année avec une interface plus légère.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchData(year, month, true)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>

              <button
                onClick={handleExportPdf}
                disabled={exporting || loading}
                className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaFilePdf />
                {exporting ? "Export..." : "Exporter PDF"}
              </button>
            </div>
          </div>
        </div>

        <div ref={pdfRef}>
          <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-800">Filtres</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-600">
                  Année
                </span>
                <InputNumber
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(value) => setYear(value || dayjs().year())}
                  placeholder="Année"
                  className="!w-full"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-600">
                  Mois
                </span>
                <Select
                  placeholder="Sélectionner un mois"
                  value={month}
                  onChange={(value) => setMonth(value)}
                  allowClear
                  className="w-full"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {dayjs().month(i).format("MMMM")}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              title="Capital total"
              value={formatCurrency(totalCapital)}
              icon={<FaWallet className="h-7 w-7" />}
              gradient="bg-gradient-to-r from-emerald-500 to-green-400"
            />

            <SummaryCard
              title="Bénéfice total"
              value={formatCurrency(totalBenefit)}
              icon={<FaCoins className="h-7 w-7" />}
              gradient="bg-gradient-to-r from-violet-500 to-purple-400"
            />

            <SummaryCard
              title="Total général"
              value={formatCurrency(totalGeneral)}
              icon={<FaChartLine className="h-7 w-7" />}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-400"
            />
          </div>

          <Card className="!rounded-3xl !border-0 !shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Résultats</h2>
                <p className="text-sm text-gray-500">{data.length} enregistrement(s)</p>
              </div>

              {refreshing && (
                <span className="text-sm font-medium text-emerald-600">
                  Actualisation...
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Spin size="large" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-gray-500">
                <FaChartLine className="mb-3 text-5xl text-emerald-500" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Aucune donnée trouvée
                </h3>
                <p className="mt-1 text-sm">
                  Essayez de modifier l’année ou le mois.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {data.map((item, index) => {
                  const total =
                    Number(item.totalCapital ?? 0) + Number(item.totalBenefit ?? 0);

                  return (
                    <div
                      key={`${item.year}-${item.month}-${index}`}
                      className="rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {monthName(item.month)} {item.year}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Résumé mensuel
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {item.month}/{item.year}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm text-gray-500">Capital</p>
                          <p className="mt-2 text-lg font-bold text-emerald-600">
                            {formatCurrency(item.totalCapital)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm text-gray-500">Bénéfice</p>
                          <p className="mt-2 text-lg font-bold text-purple-600">
                            {formatCurrency(item.totalBenefit)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm text-gray-500">Total général</p>
                          <p className="mt-2 text-lg font-bold text-blue-600">
                            {formatCurrency(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CapitalBenefits;