export type DemoDishSeedItem = {
  dish_name: string;
  category?: string;
  nutrients: Record<string, number>;
};

export type DemoDishesSeedFile = DemoDishSeedItem[];
