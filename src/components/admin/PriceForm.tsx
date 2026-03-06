import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

interface PriceFormProps {
  token: string;
  components: any[];
  price?: any;
  onClose: () => void;
}

const VENDORS = ['Amazon', 'Flipkart', 'Vedant', 'MD Computers', 'Prime ABGB'];

export function PriceForm({ token, components, price, onClose }: PriceFormProps) {
  const [formData, setFormData] = useState({
    componentId: '',
    vendor: 'Amazon',
    price: '',
    productUrl: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (price) {
      setFormData({
        componentId: price.componentId,
        vendor: price.vendor,
        price: price.price.toString(),
        productUrl: price.productUrl,
      });
    }
  }, [price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };

      await axios.post('http://localhost:5000/api/prices', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onClose();
    } catch (error) {
      console.error('Failed to save price:', error);
      alert('Failed to save price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg">
        <div className="border-b border-neutral-800 p-6 flex items-center justify-between">
          <h3 className="text-xl font-light text-neutral-100">
            {price ? 'Edit Price' : 'Add Price'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-neutral-400 text-sm mb-2">Component *</label>
            <select
              value={formData.componentId}
              onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              required
              disabled={!!price}
            >
              <option value="">Select a component</option>
              {components.map((comp) => (
                <option key={comp._id} value={comp._id}>
                  {comp.name} ({comp.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Vendor *</label>
            <select
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              required
            >
              {VENDORS.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Product URL *</label>
            <input
              type="url"
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {loading ? 'Saving...' : price ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}