import { NutrientUnit } from "../../../prisma/generated/prisma/client";

export type NutrientDetailDTO = {
  nutrientId: number;
  name: string;
  isMacro: boolean;
  unit: NutrientUnit;
  isSystemMacro: boolean;
};

export type NutrientListResponseDTO = {
  items: NutrientDetailDTO[];
};
