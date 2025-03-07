export interface BusinessCategoryData {
  name: string;
  description: string;
  keywords: string[];
  synonyms: string[];
  parentCategory?: string;
}

export interface CompetitorData {
  name: string;
  website: string;
  description: string;
  isCustomer: boolean;
  keywords?: string[];
  products?: string[];
  alternateNames?: string[];
}

export interface CategoryWithCompetitors {
  category: BusinessCategoryData;
  competitors: CompetitorData[];
}

export const businessCategories: CategoryWithCompetitors[] = [
  // Technology and Software
  {
    category: {
      name: 'Software and Cloud Services',
      description: 'Companies providing software solutions and cloud-based services',
      keywords: ['software', 'cloud', 'saas', 'platform', 'digital solutions'],
      synonyms: ['software services', 'cloud computing', 'software platforms'],
    },
    competitors: [
      {
        name: 'Contently',
        website: 'contently.com',
        description: 'Content marketing SaaS platform and services company providing tools for content creation, strategy, and analytics',
        isCustomer: true,
        keywords: ['content marketing', 'content strategy', 'content analytics'],
        products: ['Content Marketing Platform', 'Creative Marketplace', 'Analytics Suite']
      },
      {
        name: 'DivvyHQ',
        website: 'divvyhq.com',
        description: 'Content planning and workflow platform',
        isCustomer: false
      },
      {
        name: 'Skyword',
        website: 'skyword.com',
        description: 'Content marketing and creative services platform',
        isCustomer: false
      },
      {
        name: 'Percolate',
        website: 'percolate.com',
        description: 'Marketing orchestration and content management platform',
        isCustomer: false
      },
      {
        name: 'NewsCred',
        website: 'newscred.com',
        description: 'Integrated marketing orchestration platform',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Telecommunications Software',
      description: 'Software solutions for telecommunications industry',
      keywords: ['telecom software', 'network solutions', 'telco platforms'],
      synonyms: ['telco software', 'communications software'],
    },
    competitors: [
      {
        name: 'Totogi',
        website: 'totogi.com',
        description: 'Multi-tenant, SaaS monetization platform for the telecommunications industry',
        isCustomer: true,
        keywords: ['telecom', 'monetization', 'charging'],
        products: ['Charging System', 'Customer Engine']
      },
      {
        name: 'Cinarra Systems',
        website: 'cinarra.com',
        description: 'Telecom data analytics and monetization platform',
        isCustomer: false
      },
      {
        name: 'Skyrise Intelligence',
        website: 'skyriseintelligence.com',
        description: 'Location intelligence platform for telecoms',
        isCustomer: false
      }
    ]
  },
  // Education
  {
    category: {
      name: 'Education Technology',
      description: 'Technology solutions for education and learning',
      keywords: ['edtech', 'learning technology', 'educational software'],
      synonyms: ['educational technology', 'learning platforms'],
    },
    competitors: [
      {
        name: 'Alpha.school',
        website: 'alpha.school',
        description: 'AI-powered 2-hour learning model for children',
        isCustomer: true,
        keywords: ['AI education', 'personalized learning', 'hybrid learning'],
        products: ['Morning Core Academics', 'Afternoon Workshops']
      },
      {
        name: 'Texas Private Schools',
        website: '',
        description: 'Traditional private schools in Texas',
        isCustomer: false
      },
      {
        name: 'West Texas Schools',
        website: '',
        description: 'Public and private schools in West Texas region',
        isCustomer: false
      }
    ]
  },
  // Financial Services
  {
    category: {
      name: 'Digital Banking',
      description: 'Digital-first banking and financial services',
      keywords: ['digital banking', 'neobank', 'fintech'],
      synonyms: ['online banking', 'mobile banking', 'neobanking'],
    },
    competitors: [
      {
        name: 'Chime Financial',
        website: 'chime.com',
        description: 'Fee-free mobile banking services',
        isCustomer: true,
        keywords: ['mobile banking', 'digital banking', 'fintech'],
        products: ['Checking Account', 'Savings Account', 'Credit Builder']
      },
      {
        name: 'N26',
        website: 'n26.com',
        description: 'Digital banking platform',
        isCustomer: false
      },
      {
        name: 'Revolut',
        website: 'revolut.com',
        description: 'Digital banking and financial services platform',
        isCustomer: false
      },
      {
        name: 'Monzo',
        website: 'monzo.com',
        description: 'Digital bank based in the UK',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Computer Hardware and Technology Solutions',
      description: 'Companies manufacturing and selling computer hardware, peripherals, and related technology solutions',
      keywords: ['computer hardware', 'technology', 'computers', 'IT solutions'],
      synonyms: ['computer technology', 'hardware solutions', 'tech manufacturing'],
    },
    competitors: [
      {
        name: 'Dell',
        website: 'dell.com',
        description: 'Multinational technology company developing, selling, and supporting computers and related products',
        isCustomer: true,
        keywords: ['computers', 'servers', 'IT solutions'],
        products: ['Laptops', 'Desktops', 'Servers', 'Storage Solutions']
      },
      {
        name: 'HP',
        website: 'hp.com',
        description: 'Technology company providing hardware and software solutions',
        isCustomer: false
      },
      {
        name: 'Lenovo',
        website: 'lenovo.com',
        description: 'Multinational technology company',
        isCustomer: false
      },
      {
        name: 'Apple',
        website: 'apple.com',
        description: 'Consumer electronics and computer manufacturer',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Banking and Financial Services',
      description: 'Traditional banking institutions and financial service providers',
      keywords: ['banking', 'financial services', 'finance'],
      synonyms: ['financial institutions', 'banks', 'financial services providers'],
    },
    competitors: [
      {
        name: 'CIBC',
        website: 'cibc.com',
        description: 'Multinational banking and financial services corporation',
        isCustomer: true,
        keywords: ['banking', 'financial services', 'investments'],
        products: ['Personal Banking', 'Business Banking', 'Wealth Management']
      },
      {
        name: 'Royal Bank of Canada',
        website: 'rbc.com',
        description: 'Canadian multinational banking company',
        isCustomer: false
      },
      {
        name: 'Toronto-Dominion Bank',
        website: 'td.com',
        description: 'Canadian multinational banking and financial services corporation',
        isCustomer: false
      },
      {
        name: 'Bank of Montreal',
        website: 'bmo.com',
        description: 'Canadian multinational banking and financial services corporation',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Financial Software',
      description: 'Companies providing software solutions for financial management and tax preparation',
      keywords: ['financial software', 'tax software', 'accounting software'],
      synonyms: ['accounting solutions', 'tax preparation software', 'financial management software'],
    },
    competitors: [
      {
        name: 'Intuit',
        website: 'intuit.com',
        description: 'Financial software company producing tax preparation and accounting software',
        isCustomer: true,
        keywords: ['tax software', 'accounting software', 'financial management'],
        products: ['QuickBooks', 'TurboTax', 'Mint']
      },
      {
        name: 'H&R Block',
        website: 'hrblock.com',
        description: 'Tax preparation and financial services company',
        isCustomer: false
      },
      {
        name: 'TaxAct',
        website: 'taxact.com',
        description: 'Tax preparation software provider',
        isCustomer: false
      },
      {
        name: 'FreshBooks',
        website: 'freshbooks.com',
        description: 'Cloud-based accounting software provider',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Used Car Retail',
      description: 'Companies specializing in used car sales and automotive retail',
      keywords: ['used cars', 'auto retail', 'car sales'],
      synonyms: ['pre-owned vehicles', 'car dealerships', 'automotive retail'],
    },
    competitors: [
      {
        name: 'CarMax',
        website: 'carmax.com',
        description: 'Largest used-car retailer in the United States',
        isCustomer: true,
        keywords: ['used cars', 'car sales', 'auto retail'],
        products: ['Used Car Sales', 'Car Financing', 'Vehicle Service']
      },
      {
        name: 'Carvana',
        website: 'carvana.com',
        description: 'Online used car retailer and technology company',
        isCustomer: false
      },
      {
        name: 'Vroom',
        website: 'vroom.com',
        description: 'E-commerce platform for buying and selling used vehicles',
        isCustomer: false
      },
      {
        name: 'AutoNation',
        website: 'autonation.com',
        description: 'Largest automotive retailer in the United States',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Online Payment Systems',
      description: 'Companies providing digital payment processing and money transfer services',
      keywords: ['digital payments', 'payment processing', 'money transfer'],
      synonyms: ['payment services', 'digital wallets', 'payment platforms'],
    },
    competitors: [
      {
        name: 'PayPal',
        website: 'paypal.com',
        description: 'Digital payment company operating online payments system globally',
        isCustomer: true,
        keywords: ['online payments', 'digital payments', 'money transfer'],
        products: ['Payment Processing', 'Business Solutions', 'Consumer Services']
      },
      {
        name: 'Stripe',
        website: 'stripe.com',
        description: 'Online payment processing platform for businesses',
        isCustomer: false
      },
      {
        name: 'Square',
        website: 'squareup.com',
        description: 'Financial services and digital payments company',
        isCustomer: false
      },
      {
        name: 'Venmo',
        website: 'venmo.com',
        description: 'Mobile payment service owned by PayPal',
        isCustomer: false
      }
    ]
  },
  {
    category: {
      name: 'Architecture and Engineering Software',
      description: 'Software solutions for architecture, engineering, construction, and manufacturing industries',
      keywords: ['CAD software', 'engineering software', 'design software'],
      synonyms: ['design software', 'CAD/CAM software', 'engineering tools'],
    },
    competitors: [
      {
        name: 'Autodesk',
        website: 'autodesk.com',
        description: 'Software corporation for architecture, engineering, construction, and entertainment industries',
        isCustomer: true,
        keywords: ['CAD', 'engineering software', '3D design'],
        products: ['AutoCAD', 'Revit', 'Maya', '3ds Max']
      },
      {
        name: 'Dassault Systèmes',
        website: '3ds.com',
        description: 'Software company specializing in 3D design and engineering software',
        isCustomer: false
      },
      {
        name: 'PTC',
        website: 'ptc.com',
        description: 'Software company focusing on CAD and PLM software',
        isCustomer: false
      },
      {
        name: 'Trimble',
        website: 'trimble.com',
        description: 'Technology company providing software solutions for various industries',
        isCustomer: false
      }
    ]
  }
];

// Additional consolidated business categories for future use:
export const additionalCategories = [
  'Information Technology',
  'Healthcare and Pharmaceuticals',
  'Industrial Manufacturing',
  'Energy and Utilities',
  'Aerospace and Defense',
  'Chemical and Materials',
  'Food and Beverage',
  'Media and Entertainment',
  'Real Estate',
  'Transportation and Logistics',
  'Hospitality and Travel',
  'Biotechnology',
  'Insurance',
  'Investment Banking',
  'E-commerce',
  'Hardware and Electronics',
  'Oil and Gas',
  'Pharmaceuticals',
  'Managed Healthcare',
  'Consumer Products',
  'Restaurants and Fast Food',
  'Telecommunications Equipment',
  'Semiconductors'
];

// Add more categories as needed... 