import React from "react";
import Link from "next/link";

export default function ProductCard({ product }: { product: any }) {
  return (
    <div className="border rounded p-3 bg-white">
      <div className="font-semibold">{product.title}</div>
      <div className="text-sm text-gray-600">Por @{product.seller?.username}</div>
      <div className="mt-2 text-lg font-bold">{product.price} Kz</div>
      <div className="mt-3 flex space-x-2">
        <Link href={`/store/${product.id}`}><a className="px-3 py-1 bg-green-600 text-white rounded">Comprar</a></Link>
      </div>
    </div>
  );
}