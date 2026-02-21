'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface SalsifyAdminUIProps {
  lastImport: any;
  brandCounts: Record<string, number>;
}

export function SalsifyAdminUI({ lastImport, brandCounts }: SalsifyAdminUIProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [relations, setRelations] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    let url = `/api/products?page=${page}&limit=20`;
    if (search) url += `&q=${encodeURIComponent(search)}`;
    if (brandFilter) url += `&brand=${encodeURIComponent(brandFilter)}`;

    const res = await fetch(url);
    const data = await res.json();
    
    setProducts(data.products || []);
    setTotalPages(data.pages || 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, brandFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openProduct = async (product: any) => {
    setSelectedProduct(product);
    setRelations(null);
    
    // Fetch full details
    const res = await fetch(`/api/products/${product.id}`);
    const fullData = await res.json();
    setSelectedProduct(fullData);

    // Fetch relations
    const relRes = await fetch(`/api/products/${product.id}/relations`);
    const relData = await relRes.json();
    setRelations(relData);
  };

  return (
    <div className="space-y-6 text-white p-6">
      <h1 className="text-2xl font-bold">Salsify Product Management</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-md">
          <h3 className="text-sm font-medium text-white/60">Last Import</h3>
          <p className="text-xl">
            {lastImport ? new Date(lastImport.created_at).toLocaleString() : 'Never'}
          </p>
          {lastImport && (
            <p className="text-xs text-white/40 mt-1">
              {lastImport.products_count} products, {lastImport.relations_count} relations
            </p>
          )}
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-md md:col-span-2 overflow-x-auto">
          <h3 className="text-sm font-medium text-white/60 mb-2">Inventory by Brand</h3>
          <div className="flex gap-4">
            {Object.entries(brandCounts).map(([brand, count]) => (
              <div key={brand} className="flex-shrink-0">
                <span className="text-xs text-white/40 block">{brand}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browser Section */}
      <div className="bg-white/5 border border-white/10 rounded-md p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-grow flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              className="bg-black border border-white/10 rounded-md px-3 py-2 flex-grow focus:outline-none focus:border-white/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-white/90">
              Search
            </button>
          </form>
          <select
            className="bg-black border border-white/10 rounded-md px-3 py-2 focus:outline-none"
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Brands</option>
            {Object.keys(brandCounts).sort().map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-white/40">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/10 rounded-md p-3 cursor-pointer hover:border-white/30 transition-colors"
                onClick={() => openProduct(p)}
              >
                <div className="aspect-square bg-black rounded-md mb-3 flex items-center justify-center overflow-hidden border border-white/5">
                  {p.hero_image_url ? (
                    <img src={p.hero_image_url} alt={p.product_model} className="object-contain w-full h-full" />
                  ) : (
                    <div className="text-white/20 text-xs">No Image</div>
                  )}
                </div>
                <div className="text-xs text-white/40 mb-1">{p.sku}</div>
                <div className="font-bold text-sm truncate">{p.product_model}</div>
                <div className="text-xs text-white/60">{p.brand} • {p.category}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-white/10 rounded-md disabled:opacity-30"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white/60">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-white/10 rounded-md disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Slide-out / Panel for Selected Product */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedProduct(null)} />
          <div className="relative w-full max-w-2xl bg-black border-l border-white/10 h-full overflow-y-auto p-8 shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              ✕ Close
            </button>

            <div className="space-y-8">
              <div>
                <div className="text-sm text-white/40 mb-1">{selectedProduct.brand} • {selectedProduct.sku}</div>
                <h2 className="text-3xl font-bold">{selectedProduct.product_model_long || selectedProduct.product_model}</h2>
                <p className="text-white/60 mt-4 leading-relaxed">{selectedProduct.description_long}</p>
              </div>

              {selectedProduct.hero_image_url && (
                <div className="bg-white/5 rounded-md p-4 flex justify-center">
                  <img src={selectedProduct.hero_image_url} alt="Hero" className="max-h-64 object-contain" />
                </div>
              )}

              {/* Specifications */}
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold border-b border-white/10 pb-2 mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {Object.entries(selectedProduct.specifications).map(([k, v]: [string, any]) => (
                      <div key={k} className="text-sm">
                        <span className="text-white/40 block">{k}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {(selectedProduct.data_sheets?.length > 0 || selectedProduct.manuals?.length > 0 || selectedProduct.spec_sheet_url) && (
                <div>
                  <h3 className="text-lg font-bold border-b border-white/10 pb-2 mb-4">Documents</h3>
                  <div className="space-y-2">
                    {selectedProduct.spec_sheet_url && (
                      <a href={selectedProduct.spec_sheet_url} target="_blank" className="block text-sm text-blue-400 hover:underline">
                        📄 Spec Sheet
                      </a>
                    )}
                    {selectedProduct.data_sheets?.map((d: any, i: number) => (
                      <a key={i} href={d.url} target="_blank" className="block text-sm text-blue-400 hover:underline">
                        📄 Data Sheet: {d.filename}
                      </a>
                    ))}
                    {selectedProduct.manuals?.map((d: any, i: number) => (
                      <a key={i} href={d.url} target="_blank" className="block text-sm text-blue-400 hover:underline">
                        📄 Manual: {d.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Relations */}
              {relations && (
                <div className="space-y-6">
                  {relations.accessories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold border-b border-white/10 pb-2 mb-4">Accessories</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {relations.accessories.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-3 bg-white/5 p-2 rounded text-xs">
                             <img src={p.hero_image_small_url || p.hero_image_url} className="w-10 h-10 object-contain" />
                             <div>
                               <div className="font-bold">{p.product_model}</div>
                               <div className="text-white/40">{p.sku}</div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Repeat for components/parts if needed, keeping it concise */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
