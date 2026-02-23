export const projectTypes = {
  Audit: { baseHours: 6 },
  Tweaks: { baseHours: 2 },
  NewBuild: { baseHours: 16 },
  Migration: { baseHours: 24 },
  CustomApp: { baseHours: 10 },
};

export const modules = {
  Design: {
    CustomDesignMultiplier: 1.3,
  },
  Data: {
    CSV: 3,
    ComplexMigration: 12,
    Metafields: 4,
  },
  Dev: {
    SimpleSection: 2,
    ComplexSection: 6,
  },
  Apps: {
    Standard: 1,
    Complex: 6,
    B2B_Plus: 12,
    TrackingBasic: 1,
    TrackingAdvanced: 7,
  },
  Commerce: {
    Markets: 6,
  },
  Content: {
    ClientProvides: 4,
    FullServiceFlatFee: 1500,
  },
};
