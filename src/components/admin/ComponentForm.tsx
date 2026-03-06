import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

interface ComponentFormProps {
  token: string;
  component?: any;
  onClose: () => void;
}

const CATEGORIES = ['CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'GPU', 'CPU_Cooler', 'Case_Fan'];

const SPEC_TEMPLATES: Record<string, string[]> = {
  CPU: ['socket', 'cores', 'threads', 'tdp', 'integratedGraphics'],
  Motherboard: ['socket', 'formFactor', 'chipset'],
  RAM: ['sizeGB', 'speedMHz', 'type'],
  Storage: ['type', 'capacityGB', 'interface'],
  PSU: ['wattage', 'rating'],
  Case: ['formFactorsSupported', 'maxGPULengthMM', 'cpuCoolerMaxHeight'],
  GPU: ['tdp', 'lengthMM'],
  CPU_Cooler: ['type', 'tdpRating', 'heightMM'],
  Case_Fan: ['sizeMM', 'airflowCFM'],
};

export function ComponentForm({ token, component, onClose }: ComponentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'CPU',
    brand: '',
    benchmarkScore: '',
    specs: {} as Record<string, any>,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name,
        category: component.category,
        brand: component.brand || '',
        benchmarkScore: component.benchmarkScore?.toString() || '',
        specs: component.specs || {},
      });
    }
  }, [component]);

  const handleSpecChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        benchmarkScore: parseInt(formData.benchmarkScore) || 0,
      };

      if (component) {
        await axios.put(`http://localhost:5000/api/components/${component._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('http://localhost:5000/api/components', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save component:', error);
      alert('Failed to save component');
    } finally {
      setLoading(false);
    }
  };

  const specFields = SPEC_TEMPLATES[formData.category] || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
          <h3 className="text-xl font-light text-neutral-100">
            {component ? 'Edit Component' : 'Add Component'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-neutral-400 text-sm mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 text-sm mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, specs: {} })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 text-sm mb-2">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-neutral-400 text-sm mb-2">Benchmark Score</label>
              <input
                type="number"
                value={formData.benchmarkScore}
                onChange={(e) => setFormData({ ...formData, benchmarkScore: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-6">
            <h4 className="text-neutral-300 text-sm mb-4">Specifications</h4>
            <div className="grid grid-cols-2 gap-4">
              {specFields.map((field) => (
                <div key={field}>
                  <label className="block text-neutral-400 text-xs mb-2">{field}</label>
                  <input
                    type="text"
                    value={formData.specs[field] || ''}
                    onChange={(e) => handleSpecChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-neutral-400 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : component ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}