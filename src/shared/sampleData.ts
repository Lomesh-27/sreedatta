import { AllWarehouseData } from './excelEngine';
import { Product, Customer, Supplier, Worker, StockIn, StockOut, Sale, SaleItem, Payment, Discount, Expense, WorkerAttendance, DailySummary } from './schema';

export function getSampleWarehouseData(): AllWarehouseData {
  const products: Product[] = [
    {
      id: 'PRD-1001',
      code: 'CHL-001',
      name: 'Aqua-Pure Calcium Hypochlorite 65%',
      category: 'Water Disinfectant',
      unit: 'Drum (45kg)',
      purchasePrice: 4200,
      sellingPrice: 5100,
      minimumStock: 10,
      isActive: true,
      createdAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'PRD-1002',
      code: 'PAC-002',
      name: 'Polyaluminium Chloride (PAC) 30%',
      category: 'Coagulant & Clarifier',
      unit: 'Bag (25kg)',
      purchasePrice: 1150,
      sellingPrice: 1450,
      minimumStock: 25,
      isActive: true,
      createdAt: '2026-11-01T08:30:00Z'
    },
    {
      id: 'PRD-1003',
      code: 'BIO-003',
      name: 'Datta-Bio Probiotic Pond Stabilizer',
      category: 'Aquaculture Probiotics',
      unit: 'Can (5L)',
      purchasePrice: 1850,
      sellingPrice: 2400,
      minimumStock: 15,
      isActive: true,
      createdAt: '2026-11-02T09:00:00Z'
    },
    {
      id: 'PRD-1004',
      code: 'OXY-004',
      name: 'Oxy-Boost Sodium Percarbonate Tablets',
      category: 'Dissolved Oxygen Enhancer',
      unit: 'Bucket (10kg)',
      purchasePrice: 1350,
      sellingPrice: 1750,
      minimumStock: 20,
      isActive: true,
      createdAt: '2026-11-02T09:15:00Z'
    },
    {
      id: 'PRD-1005',
      code: 'ZEU-005',
      name: 'Micronized Zeolite Granules',
      category: 'Ammonia Absorber & Filter Media',
      unit: 'Bag (50kg)',
      purchasePrice: 650,
      sellingPrice: 850,
      minimumStock: 40,
      isActive: true,
      createdAt: '2026-11-03T10:00:00Z'
    },
    {
      id: 'PRD-1006',
      code: 'PH-006',
      name: 'Aqua-Buffer pH Regulator Plus',
      category: 'Alkalinity & pH Buffer',
      unit: 'Bag (25kg)',
      purchasePrice: 750,
      sellingPrice: 980,
      minimumStock: 15,
      isActive: true,
      createdAt: '2026-11-04T11:00:00Z'
    }
  ];

  const customers: Customer[] = [
    {
      id: 'CUST-2001',
      name: 'K. Venkateswara Rao',
      phone: '+91 98480 12345',
      address: 'Pond Site 4, Bhimavaram, West Godavari, AP',
      businessName: 'Venkateswara Aqua Farms & Hatchery',
      notes: 'Shrimp farming unit, regular bulk buyer',
      createdAt: '2026-11-01T10:00:00Z'
    },
    {
      id: 'CUST-2002',
      name: 'M. Jagannadham',
      phone: '+91 94401 67890',
      address: 'Kaikalur Road, Eluru District, AP',
      businessName: 'Sri Sai Fish Hatcheries',
      notes: 'Pangasius and Carp grower',
      createdAt: '2026-11-02T11:00:00Z'
    },
    {
      id: 'CUST-2003',
      name: 'R. Subba Reddy',
      phone: '+91 97003 45678',
      address: 'Machilipatnam Coastal Belt, Krishna District, AP',
      businessName: 'Reddy Brackish Water Aqua Cluster',
      notes: 'Vannamei shrimp enterprise',
      createdAt: '2026-11-03T14:30:00Z'
    }
  ];

  const suppliers: Supplier[] = [
    {
      id: 'SUPP-3001',
      name: 'Aditya Chlor-Alkali Chemicals Ltd',
      phone: '+91 866 2456789',
      address: 'Industrial Development Area, Guntur, AP',
      createdAt: '2026-10-25T09:00:00Z'
    },
    {
      id: 'SUPP-3002',
      name: 'Bio-Matrix Aquatic Health Solutions',
      phone: '+91 44 28543210',
      address: 'Ambattur Industrial Estate, Chennai, TN',
      createdAt: '2026-10-26T10:00:00Z'
    },
    {
      id: 'SUPP-3003',
      name: 'Deccan Minerals & Zeolites Corp',
      phone: '+91 40 27891234',
      address: 'Nacharam Industrial Area, Hyderabad, TS',
      createdAt: '2026-10-27T11:30:00Z'
    }
  ];

  const workers: Worker[] = [
    {
      id: 'WRK-4001',
      name: 'P. Rambabu',
      contactInfo: '+91 91234 56780',
      designation: 'Warehouse Supervisor',
      joiningDate: '2026-01-10',
      isActive: true,
      createdAt: '2026-10-20T08:00:00Z'
    },
    {
      id: 'WRK-4002',
      name: 'S. Koteswara Rao',
      contactInfo: '+91 92345 67891',
      designation: 'Inventory & Dispatch Incharge',
      joiningDate: '2026-03-15',
      isActive: true,
      createdAt: '2026-10-20T08:30:00Z'
    },
    {
      id: 'WRK-4003',
      name: 'G. Suresh Kumar',
      contactInfo: '+91 93456 78912',
      designation: 'Stock Handler & Loader',
      joiningDate: '2026-06-01',
      isActive: true,
      createdAt: '2026-10-20T09:00:00Z'
    }
  ];

  const stockIn: StockIn[] = [
    {
      id: 'STK-IN-5001',
      date: '2026-11-05',
      time: '09:30:00',
      productId: 'PRD-1001',
      productName: 'Aqua-Pure Calcium Hypochlorite 65%',
      supplierId: 'SUPP-3001',
      supplierName: 'Aditya Chlor-Alkali Chemicals Ltd',
      quantity: 50,
      unit: 'Drum (45kg)',
      purchasePrice: 4200,
      totalPurchaseValue: 210000,
      invoiceReferenceNumber: 'AD-2026-9812',
      notes: 'Initial monsoon stock dispatch, batch verified',
      createdAt: '2026-11-05T09:30:00Z'
    },
    {
      id: 'STK-IN-5002',
      date: '2026-11-05',
      time: '11:00:00',
      productId: 'PRD-1002',
      productName: 'Polyaluminium Chloride (PAC) 30%',
      supplierId: 'SUPP-3001',
      supplierName: 'Aditya Chlor-Alkali Chemicals Ltd',
      quantity: 100,
      unit: 'Bag (25kg)',
      purchasePrice: 1150,
      totalPurchaseValue: 115000,
      invoiceReferenceNumber: 'AD-2026-9813',
      notes: 'Grade A PAC powder received in dry condition',
      createdAt: '2026-11-05T11:00:00Z'
    },
    {
      id: 'STK-IN-5003',
      date: '2026-11-06',
      time: '14:15:00',
      productId: 'PRD-1003',
      productName: 'Datta-Bio Probiotic Pond Stabilizer',
      supplierId: 'SUPP-3002',
      supplierName: 'Bio-Matrix Aquatic Health Solutions',
      quantity: 60,
      unit: 'Can (5L)',
      purchasePrice: 1850,
      totalPurchaseValue: 111000,
      invoiceReferenceNumber: 'BM-8762',
      notes: 'Live bacterial spore count tested',
      createdAt: '2026-11-06T14:15:00Z'
    },
    {
      id: 'STK-IN-5004',
      date: '2026-11-07',
      time: '10:00:00',
      productId: 'PRD-1004',
      productName: 'Oxy-Boost Sodium Percarbonate Tablets',
      supplierId: 'SUPP-3001',
      supplierName: 'Aditya Chlor-Alkali Chemicals Ltd',
      quantity: 80,
      unit: 'Bucket (10kg)',
      purchasePrice: 1350,
      totalPurchaseValue: 108000,
      invoiceReferenceNumber: 'AD-2026-9844',
      notes: 'Oxygen emergency tablets',
      createdAt: '2026-11-07T10:00:00Z'
    },
    {
      id: 'STK-IN-5005',
      date: '2026-11-08',
      time: '16:00:00',
      productId: 'PRD-1005',
      productName: 'Micronized Zeolite Granules',
      supplierId: 'SUPP-3003',
      supplierName: 'Deccan Minerals & Zeolites Corp',
      quantity: 150,
      unit: 'Bag (50kg)',
      purchasePrice: 650,
      totalPurchaseValue: 97500,
      invoiceReferenceNumber: 'DMZ-4412',
      notes: 'High CEC rating zeolite batch',
      createdAt: '2026-11-08T16:00:00Z'
    }
  ];

  const stockOut: StockOut[] = [
    {
      id: 'STK-OUT-6001',
      date: '2026-11-10',
      time: '10:30:00',
      productId: 'PRD-1001',
      productName: 'Aqua-Pure Calcium Hypochlorite 65%',
      quantity: 10,
      unit: 'Drum (45kg)',
      reason: 'SALE',
      recipient: 'Venkateswara Aqua Farms & Hatchery',
      responsibleWorkerId: 'WRK-4002',
      responsibleWorkerName: 'S. Koteswara Rao',
      notes: 'Dispatched via Tata Ace AP16-TU-4421',
      saleId: 'SAL-7001',
      createdAt: '2026-11-10T10:30:00Z'
    },
    {
      id: 'STK-OUT-6002',
      date: '2026-11-10',
      time: '10:30:00',
      productId: 'PRD-1003',
      productName: 'Datta-Bio Probiotic Pond Stabilizer',
      quantity: 5,
      unit: 'Can (5L)',
      reason: 'SALE',
      recipient: 'Venkateswara Aqua Farms & Hatchery',
      responsibleWorkerId: 'WRK-4002',
      responsibleWorkerName: 'S. Koteswara Rao',
      notes: 'Dispatched with Hypo batch',
      saleId: 'SAL-7001',
      createdAt: '2026-11-10T10:30:00Z'
    },
    {
      id: 'STK-OUT-6003',
      date: '2026-11-11',
      time: '14:00:00',
      productId: 'PRD-1002',
      productName: 'Polyaluminium Chloride (PAC) 30%',
      quantity: 20,
      unit: 'Bag (25kg)',
      reason: 'SALE',
      recipient: 'Sri Sai Fish Hatcheries',
      responsibleWorkerId: 'WRK-4001',
      responsibleWorkerName: 'P. Rambabu',
      notes: 'Customer pickup vehicle',
      saleId: 'SAL-7002',
      createdAt: '2026-11-11T14:00:00Z'
    },
    {
      id: 'STK-OUT-6004',
      date: '2026-11-12',
      time: '11:15:00',
      productId: 'PRD-1004',
      productName: 'Oxy-Boost Sodium Percarbonate Tablets',
      quantity: 1,
      unit: 'Bucket (10kg)',
      reason: 'SAMPLE',
      recipient: 'West Godavari Aqua Farmers Association Demo',
      responsibleWorkerId: 'WRK-4001',
      responsibleWorkerName: 'P. Rambabu',
      notes: 'Free field testing demonstration',
      createdAt: '2026-11-12T11:15:00Z'
    }
  ];

  const sales: Sale[] = [
    {
      id: 'SAL-7001',
      invoiceNumber: 'INV-2026-00101',
      date: '2026-11-10',
      time: '10:30:00',
      customerId: 'CUST-2001',
      customerName: 'K. Venkateswara Rao',
      grossAmount: 63000,
      discountAmount: 1500,
      netAmount: 61500,
      paymentMethod: 'UPI',
      workerId: 'WRK-4001',
      workerName: 'P. Rambabu',
      notes: 'Paid via PhonePe QR',
      createdAt: '2026-11-10T10:30:00Z'
    },
    {
      id: 'SAL-7002',
      invoiceNumber: 'INV-2026-00102',
      date: '2026-11-11',
      time: '14:00:00',
      customerId: 'CUST-2002',
      customerName: 'M. Jagannadham',
      grossAmount: 29000,
      discountAmount: 500,
      netAmount: 28500,
      paymentMethod: 'BANK_TRANSFER',
      workerId: 'WRK-4001',
      workerName: 'P. Rambabu',
      notes: 'NEFT Transfer ref: SBIN7829104',
      createdAt: '2026-11-11T14:00:00Z'
    }
  ];

  const saleItems: SaleItem[] = [
    {
      id: 'SLI-8001',
      saleId: 'SAL-7001',
      productId: 'PRD-1001',
      productName: 'Aqua-Pure Calcium Hypochlorite 65%',
      quantity: 10,
      unit: 'Drum (45kg)',
      unitPrice: 5100,
      totalAmount: 51000
    },
    {
      id: 'SLI-8002',
      saleId: 'SAL-7001',
      productId: 'PRD-1003',
      productName: 'Datta-Bio Probiotic Pond Stabilizer',
      quantity: 5,
      unit: 'Can (5L)',
      unitPrice: 2400,
      totalAmount: 12000
    },
    {
      id: 'SLI-8003',
      saleId: 'SAL-7002',
      productId: 'PRD-1002',
      productName: 'Polyaluminium Chloride (PAC) 30%',
      quantity: 20,
      unit: 'Bag (25kg)',
      unitPrice: 1450,
      totalAmount: 29000
    }
  ];

  const payments: Payment[] = [
    {
      id: 'PAY-9001',
      transactionId: 'TXN-UPI-00101',
      referenceType: 'SALE',
      referenceId: 'SAL-7001',
      amount: 61500,
      paymentMethod: 'UPI',
      paymentDate: '2026-11-10',
      notes: 'Full payment received via UPI',
      createdAt: '2026-11-10T10:35:00Z'
    },
    {
      id: 'PAY-9002',
      transactionId: 'TXN-NEFT-00102',
      referenceType: 'SALE',
      referenceId: 'SAL-7002',
      amount: 28500,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: '2026-11-11',
      notes: 'NEFT payment credited to Current A/c',
      createdAt: '2026-11-11T14:05:00Z'
    }
  ];

  const discounts: Discount[] = [
    {
      id: 'DSC-9101',
      saleId: 'SAL-7001',
      discountType: 'FLAT',
      discountValue: 1500,
      reason: 'Volume discount on combo purchase',
      createdAt: '2026-11-10T10:30:00Z'
    },
    {
      id: 'DSC-9102',
      saleId: 'SAL-7002',
      discountType: 'FLAT',
      discountValue: 500,
      reason: 'Prompt payment incentive',
      createdAt: '2026-11-11T14:00:00Z'
    }
  ];

  const expenses: Expense[] = [
    {
      id: 'EXP-9201',
      date: '2026-11-05',
      category: 'TRANSPORT',
      description: 'Lorry unloading freight charge for Hypochlorite shipment',
      amount: 3500,
      paymentMethod: 'CASH',
      createdAt: '2026-11-05T12:00:00Z'
    },
    {
      id: 'EXP-9202',
      date: '2026-11-07',
      category: 'LABOUR',
      description: 'Loading / unloading daily hamali wages (3 workers)',
      amount: 1800,
      paymentMethod: 'CASH',
      createdAt: '2026-11-07T18:00:00Z'
    },
    {
      id: 'EXP-9203',
      date: '2026-11-09',
      category: 'ELECTRICITY',
      description: 'Warehouse ventilation and aeration backup generator diesel',
      amount: 2400,
      paymentMethod: 'UPI',
      createdAt: '2026-11-09T15:30:00Z'
    }
  ];

  const attendance: WorkerAttendance[] = [
    {
      id: 'ATT-9301',
      date: '2026-11-10',
      workerId: 'WRK-4001',
      workerName: 'P. Rambabu',
      status: 'PRESENT',
      notes: 'Full shift 8am to 6pm',
      createdAt: '2026-11-10T08:05:00Z'
    },
    {
      id: 'ATT-9302',
      date: '2026-11-10',
      workerId: 'WRK-4002',
      workerName: 'S. Koteswara Rao',
      status: 'PRESENT',
      notes: 'Full shift',
      createdAt: '2026-11-10T08:10:00Z'
    },
    {
      id: 'ATT-9303',
      date: '2026-11-10',
      workerId: 'WRK-4003',
      workerName: 'G. Suresh Kumar',
      status: 'PRESENT',
      notes: 'Stock loading operations',
      createdAt: '2026-11-10T08:15:00Z'
    },
    {
      id: 'ATT-9304',
      date: '2026-11-11',
      workerId: 'WRK-4001',
      workerName: 'P. Rambabu',
      status: 'PRESENT',
      notes: 'Supervision & dispatch',
      createdAt: '2026-11-11T08:00:00Z'
    },
    {
      id: 'ATT-9305',
      date: '2026-11-11',
      workerId: 'WRK-4002',
      workerName: 'S. Koteswara Rao',
      status: 'HALF_DAY',
      notes: 'Half day afternoon leave',
      createdAt: '2026-11-11T08:05:00Z'
    },
    {
      id: 'ATT-9306',
      date: '2026-11-11',
      workerId: 'WRK-4003',
      workerName: 'G. Suresh Kumar',
      status: 'PRESENT',
      notes: 'Full shift',
      createdAt: '2026-11-11T08:10:00Z'
    }
  ];

  return {
    products,
    customers,
    suppliers,
    workers,
    stockIn,
    stockOut,
    sales,
    saleItems,
    payments,
    discounts,
    expenses,
    attendance
  };
}
