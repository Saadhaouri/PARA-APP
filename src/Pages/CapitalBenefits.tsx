import React, { useState, useEffect } from "react";
import { Table, Typography, Card, Select, InputNumber, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

interface CapitalBenefit {
  year: number;
  month: number;
  totalCapital: number;
  totalBenefit: number;
}

const CapitalBenefits: React.FC = () => {
  const [data, setData] = useState<CapitalBenefit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(dayjs().year());
  const [month, setMonth] = useState<number | null>(null);

  // Charger les données depuis l'API
  const fetchData = async (
    selectedYear: number,
    selectedMonth: number | null
  ) => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5133/Sales/capital-benefits",
        { params: { year: selectedYear, month: selectedMonth } }
      );
      setData(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    }
    setLoading(false);
  };

  // Charger les données au premier rendu et après modification du filtre
  useEffect(() => {
    fetchData(year, month);
  }, [year, month]);

  // Définition des colonnes de la table
  const columns: ColumnsType<CapitalBenefit> = [
    {
      title: "Année",
      dataIndex: "year",
      key: "year",
      width: 100,
      align: "center",
      render: (year) => <span className="font-semibold">{year}</span>,
    },
    {
      title: "Mois",
      dataIndex: "month",
      key: "month",
      width: 120,
      align: "center",
      render: (month) => (
        <span className="text-blue-600 font-semibold">
          {dayjs()
            .month(month - 1)
            .format("MMMM")}
        </span>
      ),
    },
    {
      title: "Capital Total",
      dataIndex: "totalCapital",
      key: "totalCapital",
      align: "right",
      render: (value) => (
        <span className="text-green-500 font-semibold">
          {value.toFixed(2)} DH
        </span>
      ),
    },
    {
      title: "Bénéfice Total",
      dataIndex: "totalBenefit",
      key: "totalBenefit",
      align: "right",
      render: (value) => (
        <span className="text-purple-500 font-semibold">
          {value.toFixed(2)} DH
        </span>
      ),
    },
    {
      title: "Total Général",
      key: "totalGeneral",
      align: "right",
      render: (_, record) => (
        <span className="text-red-500 font-semibold">
          {(record.totalCapital + record.totalBenefit).toFixed(2)} DH
        </span>
      ),
    },
  ];

  return (
    <Card className="m-2 p-6 shadow-lg bg-white rounded-2xl">
      <Title level={3} className="text-center text-gray-700 mb-6">
        📊 Capital & Bénéfices
      </Title>

      {/* Filtres */}
      <div className="mb-6 flex flex-col md:flex-row justify-center items-center gap-4">
        {/* Sélection de l'année */}
        <div className="flex flex-col items-center">
          <span className="text-gray-600 font-medium mb-1">Année :</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(value) => setYear(value || dayjs().year())}
            placeholder="Année"
            className="w-40 border-gray-300"
          />
        </div>

        {/* Sélection du mois */}
        <div className="flex flex-col items-center">
          <span className="text-gray-600 font-medium mb-1">Mois :</span>
          <Select
            placeholder="Sélectionner un mois"
            value={month}
            onChange={(value) => setMonth(value)}
            allowClear
            className="w-80"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                {dayjs().month(i).format("MMMM")}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Tableau des résultats */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => `${record.year}-${record.month}`}
          pagination={{ pageSize: 6 }}
          className="shadow-sm rounded-lg"
        />
      )}
    </Card>
  );
};

export default CapitalBenefits;
