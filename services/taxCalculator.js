/**
 * Indonesian Tax & BPJS Calculator (2024 Regulations)
 */

export const TAX_STATUS = {
    TK0: 'TK/0',
    TK1: 'TK/1',
    TK2: 'TK/2',
    TK3: 'TK/3',
    K0: 'K/0',
    K1: 'K/1',
    K2: 'K/2',
    K3: 'K/3',
};

// TER Categories 2024
const CATEGORY_MAP = {
    TK0: 'A',
    TK1: 'A',
    K0: 'A',
    TK2: 'B',
    TK3: 'B',
    K1: 'B',
    K2: 'B',
    K3: 'C',
};

// Simplifed TER Tables (Selected thresholds for 2024)
const TER_TABLES = {
    A: [
        { limit: 5400000, rate: 0 },
        { limit: 5650000, rate: 0.25 },
        { limit: 5950000, rate: 0.5 },
        { limit: 6300000, rate: 0.75 },
        { limit: 6750000, rate: 1 },
        { limit: 7500000, rate: 1.25 },
        { limit: 8550000, rate: 1.5 },
        { limit: 9650000, rate: 1.75 },
        { limit: 10650000, rate: 2 },
        { limit: 14600000, rate: 5 },
        { limit: 17100000, rate: 7 },
        { limit: 19850000, rate: 9 },
        { limit: 23600000, rate: 10 },
        { limit: 1000000000, rate: 34 },
    ],
    B: [
        { limit: 6200000, rate: 0 },
        { limit: 6500000, rate: 0.25 },
        { limit: 6900000, rate: 0.5 },
        { limit: 7300000, rate: 0.75 },
        { limit: 7800000, rate: 1 },
        { limit: 8850000, rate: 1.25 },
        { limit: 9800000, rate: 1.5 },
        { limit: 10950000, rate: 1.75 },
        { limit: 12300000, rate: 2 },
        { limit: 15150000, rate: 5 },
        { limit: 18200000, rate: 7 },
        { limit: 21900000, rate: 9 },
        { limit: 27200000, rate: 10 },
        { limit: 1000000000, rate: 34 },
    ],
    C: [
        { limit: 6600000, rate: 0 },
        { limit: 6950000, rate: 0.25 },
        { limit: 7350000, rate: 0.5 },
        { limit: 7800000, rate: 0.75 },
        { limit: 8350000, rate: 1 },
        { limit: 9450000, rate: 1.25 },
        { limit: 10350000, rate: 1.5 },
        { limit: 11350000, rate: 1.75 },
        { limit: 12800000, rate: 2 },
        { limit: 15150000, rate: 5 },
        { limit: 1000000000, rate: 34 },
    ],
};

const BPJS_CONFIG = {
    KESEHATAN_RATE: 0.01, // 1%
    KESEHATAN_CAP: 12000000,
    KETENAGAKERJAAN_JHT_RATE: 0.02, // 2%
    KETENAGAKERJAAN_JP_RATE: 0.01, // 1%
    KETENAGAKERJAAN_JP_CAP: 10042300, // 2024 Cap
};

export const calculatePayrollAutomation = (grossSalary, ptkpStatus = 'TK0') => {
    const salary = parseFloat(grossSalary) || 0;
    
    // 1. BPJS Kesehatan
    const bpjsKesSalary = Math.min(salary, BPJS_CONFIG.KESEHATAN_CAP);
    const bpjsKesehatan = Math.floor(bpjsKesSalary * BPJS_CONFIG.KESEHATAN_RATE);

    // 2. BPJS Ketenagakerjaan
    const jht = Math.floor(salary * BPJS_CONFIG.KETENAGAKERJAAN_JHT_RATE);
    const jpSalary = Math.min(salary, BPJS_CONFIG.KETENAGAKERJAAN_JP_CAP);
    const jp = Math.floor(jpSalary * BPJS_CONFIG.KETENAGAKERJAAN_JP_RATE);
    const bpjsKetenagakerjaan = jht + jp;

    // 3. PPH21 TER
    const category = CATEGORY_MAP[ptkpStatus] || 'A';
    const table = TER_TABLES[category];
    let rate = 0;
    
    for (const entry of table) {
        if (salary <= entry.limit) {
            rate = entry.rate;
            break;
        }
    }
    
    const pph21 = Math.floor(salary * (rate / 100));

    return {
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        pph21,
        category,
        rate
    };
};
