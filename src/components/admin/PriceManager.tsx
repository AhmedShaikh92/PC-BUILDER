import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import axios from "axios";
import { PriceForm } from "./PriceForm";
import { toast } from "react-toastify";

interface Price {
  _id: string;
  componentId: string;
  vendor: string;
  price: number;
  productUrl: string;
  lastUpdated: string;
}

interface Component {
  _id: string;
  name: string;
  category: string;
}

interface PricesManagerProps {
  token: string;
}

export function PricesManager({ token }: PricesManagerProps) {
  const [prices, setPrices] = useState<any[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [componentsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/components"),
      ]);

      setComponents(componentsRes.data.components);

      // Fetch prices for all components
      const allPrices: any[] = [];
      for (const comp of componentsRes.data.components) {
        try {
          const pricesRes = await axios.get(
            `http://localhost:5000/api/prices/component/${comp._id}`,
          );
          if (pricesRes.data && Array.isArray(pricesRes.data)) {
            allPrices.push(
              ...pricesRes.data.map((p: any) => ({
                ...p,
                componentName: comp.name,
                componentCategory: comp.category,
              })),
            );
          }
        } catch (err) {
          // Component might not have prices yet
        }
      }

      setPrices(allPrices);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrices = prices.filter(
    (price) =>
      price.componentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.vendor?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price?")) return;

    try {
      await axios
        .delete(`http://localhost:5000/api/prices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          toast.success("Component Deleted Succesfully");
        });
      fetchData();
    } catch (error) {
      console.error("Failed to delete price:", error);
      alert("Failed to delete price");
    }
  };

  const handleEdit = (price: any) => {
    setEditingPrice(price);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPrice(null);
    toast.success("Updated Succesfull");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Loading prices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-light text-neutral-100 mb-1"
            style={{ fontFamily: "Special Elite" }}
          >
            Prices
          </h2>
          <p className="text-neutral-500 text-sm">
            {filteredPrices.length} price entries
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors"
        >
          <Plus size={16} />
          Add Price
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
          size={16}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search prices..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
        />
      </div>

      {/* Prices Table */}
      <div className="border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900 border-b border-neutral-800">
              <tr>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Component
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Vendor
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Updated
                </th>
                <th className="text-right px-4 py-3 text-neutral-400 text-xs font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredPrices.map((price) => (
                <tr
                  key={price._id}
                  className="hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-neutral-100 text-sm">
                      {price.componentName}
                    </p>
                    <p className="text-neutral-600 text-xs">
                      {price.componentCategory}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {price.vendor}
                  </td>
                  <td className="px-4 py-3 text-neutral-100 text-sm">
                    ₹{price.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {new Date(price.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="edit"
                        onClick={() => handleEdit(price)}
                        className="p-2 text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        title="delete"
                        onClick={() => handleDelete(price._id)}
                        className="p-2 text-neutral-500 hover:text-red-400 cursor-pointer transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPrices.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">
            No prices found
          </div>
        )}
      </div>

      {/* Price Form Modal */}
      {showForm && (
        <PriceForm
          token={token}
          components={components}
          price={editingPrice}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
