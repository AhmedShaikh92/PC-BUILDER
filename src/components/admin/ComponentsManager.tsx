import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import axios from "axios";
import { ComponentForm } from "./ComponentForm";
import { toast } from "react-toastify";

interface Component {
  _id: string;
  name: string;
  category: string;
  brand: string;
  specs: Record<string, any>;
  benchmarkScore: number;
}

interface ComponentsManagerProps {
  token: string;
}

const CATEGORIES = [
  "CPU",
  "Motherboard",
  "RAM",
  "Storage",
  "PSU",
  "Case",
  "GPU",
  "CPU_Cooler",
  "Case_Fan",
];

export function ComponentsManager({ token }: ComponentsManagerProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(
    null,
  );

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/components");
      setComponents(response.data.components);
      setFilteredComponents(response.data.components);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  useEffect(() => {
    let filtered = components;

    if (searchTerm) {
      filtered = filtered.filter(
        (comp) =>
          comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((comp) => comp.category === selectedCategory);
    }

    setFilteredComponents(filtered);
  }, [searchTerm, selectedCategory, components]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return;

    try {
      await axios
        .delete(`http://localhost:5000/api/components/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          toast.success("Component Deleted Succesfully");
        });
      fetchComponents();
    } catch (error) {
      console.error("Failed to delete component:", error);
      toast.error("Failed to delete component");
    }
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingComponent(null);
    toast.success("Updated Succesfull");
    fetchComponents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Loading components...</p>
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
            Components
          </h2>
          <p className="text-neutral-500 text-sm">
            {filteredComponents.length} components
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors"
        >
          <Plus size={16} />
          Add Component
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
            size={16}
          />
          <select
            title="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full cursor-pointer pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700 appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Components Table */}
      <div className="border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900 border-b border-neutral-800">
              <tr>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Brand
                </th>
                <th className="text-left px-4 py-3 text-neutral-400 text-xs font-normal">
                  Score
                </th>
                <th className="text-right px-4 py-3 text-neutral-400 text-xs font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredComponents.map((component) => (
                <tr
                  key={component._id}
                  className="hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-neutral-100 text-sm">
                    {component.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {component.category}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {component.brand || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {component.benchmarkScore || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="edit"
                        onClick={() => handleEdit(component)}
                        className="p-2 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        title="delete"
                        onClick={() => handleDelete(component._id)}
                        className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
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

        {filteredComponents.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">
            No components found
          </div>
        )}
      </div>

      {/* Component Form Modal */}
      {showForm && (
        <ComponentForm
          token={token}
          component={editingComponent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
