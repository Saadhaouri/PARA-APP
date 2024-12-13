// ProductType.ts

export default interface Product {
  productID: string;
  qrCode: string;        // Required
  name: string;          // Required
  description: string;   // Required
  price: number;
  priceForSale: number;
  supplierId: string;    // UUID
  quantity: number;
  categoryID: string;    // UUID
  dateExp: string;       // Date-time
}

export default interface CreateProduct {
  qrCode: string;        // Required
  name: string;          // RequiredP
  description: string;   // Required
  price: number;
  priceForSale: number;
  supplierId: string;    // UUID
  quantity: number;
  categoryID: string;    // UUID
  dateExp: string;       // Date-time
}
