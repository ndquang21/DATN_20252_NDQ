/** Bữa ăn trong 1 ngày của thực đơn gợi ý (quantity = khẩu phần 100g) */
export type SuggestPlanMealSeed = {
  meal_type: "breakfast" | "lunch" | "dinner";
  dishes: { dish_name: string; quantity: number }[];
};

export type SuggestPlanDaySeed = {
  meals: SuggestPlanMealSeed[];
};

export type SuggestPlanSeed = {
  name: string;
  description: string;
  is_public: boolean;
  days: SuggestPlanDaySeed[];
};

export const SUGGEST_PLANS_SEED: SuggestPlanSeed[] = [
  {
    name: "Cơm nhà nhanh gọn",
    description:
      "4 ngày ăn đơn giản, dễ nấu: cơm trắng + một món mặn + rau luộc. Phù hợp ngày bận, ít thời gian vào bếp.",
    is_public: true,
    days: [
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Bánh phở", quantity: 1.0 },
              { dish_name: "Thịt bò lưng nạc chần", quantity: 0.45 },
              { dish_name: "Trứng gà ta", quantity: 0.5 },
              { dish_name: "Giá đậu xanh luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.3 },
              { dish_name: "Thịt gà ta tươi", quantity: 0.8 },
              { dish_name: "Rau muống luộc", quantity: 2.5 },
              { dish_name: "Cà rốt (củ đỏ vàng) luộc", quantity: 1.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 1.6 },
              { dish_name: "Cá nục luộc", quantity: 1.0 },
              { dish_name: "Đậu phụ luộc", quantity: 0.8 },
              { dish_name: "Mướp luộc", quantity: 2.0 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Xôi nếp cẩm", quantity: 1.0 },
              { dish_name: "Trứng gà ta", quantity: 0.8 },
              { dish_name: "Sữa chua", quantity: 0.5 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.3 },
              { dish_name: "Thịt lợn nửa nạc nửa mỡ luộc", quantity: 0.7 },
              { dish_name: "Cải bắp luộc", quantity: 2.0 },
              { dish_name: "Đậu cô ve luộc", quantity: 1.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 1.5 },
              { dish_name: "Tôm biển luộc", quantity: 1.3 },
              { dish_name: "Súp lơ xanh luộc", quantity: 2.0 },
              { dish_name: "Bí ngô luộc", quantity: 1.5 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Trứng gà ta", quantity: 1.0 },
              { dish_name: "Xôi nếp cẩm", quantity: 1.0 },
              { dish_name: "Sữa chua", quantity: 0.6 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.2 },
              { dish_name: "Cá chép tươi", quantity: 1.2 },
              { dish_name: "Rau muống luộc", quantity: 2.5 },
              { dish_name: "Su hào luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 1.6 },
              { dish_name: "Đậu phụ luộc", quantity: 1.0 },
              { dish_name: "Thịt trâu tươi", quantity: 0.9 },
              { dish_name: "Bí đao (bí xanh) luộc", quantity: 2.5 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Bánh phở", quantity: 1.1 },
              { dish_name: "Chả lợn", quantity: 0.25 },
              { dish_name: "Trứng gà ta", quantity: 0.5 },
              { dish_name: "Giá đậu xanh luộc", quantity: 1.2 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.2 },
              { dish_name: "Tôm biển nướng", quantity: 1.0 },
              { dish_name: "Cải ngồng luộc", quantity: 2.5 },
              { dish_name: "Đậu cô ve luộc", quantity: 1.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 1.5 },
              { dish_name: "Cá nục nướng", quantity: 1.0 },
              { dish_name: "Rau muống luộc", quantity: 2.0 },
              { dish_name: "Bí đao (bí xanh) luộc", quantity: 2.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Thực đơn đa dạng",
    description:
      "4 ngày xoay vòng thịt, cá, tôm, trứng — đủ bữa sáng/trưa/tối, không bị nhàm chán cùng một kiểu món.",
    is_public: true,
    days: [
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Xôi nếp cẩm", quantity: 1.0 },
              { dish_name: "Trứng gà ta", quantity: 1.0 },
              { dish_name: "Sữa chua", quantity: 0.7 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.0 },
              { dish_name: "Thịt gà ta tươi", quantity: 1.0 },
              { dish_name: "Rau muống luộc", quantity: 2.5 },
              { dish_name: "Cà rốt (củ đỏ vàng) luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.6 },
              { dish_name: "Thịt lợn nửa nạc nửa mỡ luộc", quantity: 0.95 },
              { dish_name: "Cải bắp luộc", quantity: 2.5 },
              { dish_name: "Mướp luộc", quantity: 2.0 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Bánh phở", quantity: 1.3 },
              { dish_name: "Thịt bò lưng nạc chần", quantity: 0.7 },
              { dish_name: "Trứng gà ta", quantity: 0.6 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.2 },
              { dish_name: "Cá ngừ tươi", quantity: 1.5 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Súp lơ xanh luộc", quantity: 2.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.7 },
              { dish_name: "Tôm biển nướng", quantity: 1.3 },
              { dish_name: "Đậu phụ luộc", quantity: 1.2 },
              { dish_name: "Bí ngô luộc", quantity: 2.0 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Trứng gà ta", quantity: 1.2 },
              { dish_name: "Bánh phở", quantity: 0.9 },
              { dish_name: "Sữa bò tươi", quantity: 1.0 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.1 },
              { dish_name: "Thịt bò vai hấp", quantity: 0.95 },
              { dish_name: "Cải ngồng luộc", quantity: 2.5 },
              { dish_name: "Đậu cô ve luộc", quantity: 1.2 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.5 },
              { dish_name: "Cá nục luộc", quantity: 1.2 },
              { dish_name: "Su hào luộc", quantity: 2.0 },
              { dish_name: "Bí đao (bí xanh) luộc", quantity: 2.0 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Xôi nếp cẩm", quantity: 1.1 },
              { dish_name: "Chả lợn", quantity: 0.3 },
              { dish_name: "Sữa chua", quantity: 0.8 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.2 },
              { dish_name: "Mực tươi hấp", quantity: 1.2 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Cà rốt (củ đỏ vàng) luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 2.7 },
              { dish_name: "Thịt dê nạc hấp", quantity: 0.85 },
              { dish_name: "Cải bắp luộc", quantity: 2.5 },
              { dish_name: "Mướp luộc", quantity: 2.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Không cá, không thịt gà",
    description:
      "5 ngày ưu tiên heo, bò, dê, vịt, tôm, mực, đậu phụ — tránh cá và thịt gà (trứng gà vẫn có).",
    is_public: true,
    days: [
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Xôi nếp cẩm", quantity: 1.3 },
              { dish_name: "Trứng gà ta", quantity: 1.2 },
              { dish_name: "Sữa bò tươi", quantity: 1.0 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.5 },
              { dish_name: "Thịt bò vai hấp", quantity: 1.2 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Cà rốt (củ đỏ vàng) luộc", quantity: 2.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.2 },
              { dish_name: "Thịt vịt luộc", quantity: 0.7 },
              { dish_name: "Cải bắp luộc", quantity: 3.0 },
              { dish_name: "Đậu phụ luộc", quantity: 1.5 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Bánh phở", quantity: 1.5 },
              { dish_name: "Thịt bò lưng nạc chần", quantity: 1.0 },
              { dish_name: "Trứng gà ta", quantity: 0.8 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.6 },
              { dish_name: "Thịt lợn nửa nạc nửa mỡ luộc", quantity: 1.1 },
              { dish_name: "Súp lơ xanh luộc", quantity: 2.5 },
              { dish_name: "Đậu cô ve luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.0 },
              { dish_name: "Sò dương luộc", quantity: 1.0 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Bí ngô luộc", quantity: 2.0 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Ngô tươi nếp nướng", quantity: 1.2 },
              { dish_name: "Trứng gà ta", quantity: 1.0 },
              { dish_name: "Sữa chua", quantity: 1.0 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.9 },
              { dish_name: "Thịt lợn nửa nạc nửa mỡ luộc", quantity: 1.2 },
              { dish_name: "Cải ngồng luộc", quantity: 3.0 },
              { dish_name: "Su hào luộc", quantity: 2.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.6 },
              { dish_name: "Mực tươi hấp", quantity: 1.4 },
              { dish_name: "Mướp luộc", quantity: 2.5 },
              { dish_name: "Bí đao (bí xanh) luộc", quantity: 2.5 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Xôi nếp cẩm", quantity: 1.4 },
              { dish_name: "Chả lợn", quantity: 0.35 },
              { dish_name: "Sữa bò tươi", quantity: 1.0 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.8 },
              { dish_name: "Tôm biển nướng", quantity: 1.5 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Cà rốt (củ đỏ vàng) luộc", quantity: 2.0 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.0 },
              { dish_name: "Thịt dê nạc hấp", quantity: 1.0 },
              { dish_name: "Cải bắp luộc", quantity: 3.0 },
              { dish_name: "Đậu phụ luộc", quantity: 1.5 },
            ],
          },
        ],
      },
      {
        meals: [
          {
            meal_type: "breakfast",
            dishes: [
              { dish_name: "Bánh phở", quantity: 1.4 },
              { dish_name: "Thịt trâu tươi", quantity: 1.2 },
              { dish_name: "Trứng gà ta", quantity: 0.8 },
            ],
          },
          {
            meal_type: "lunch",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 4.0 },
              { dish_name: "Mực tươi hấp", quantity: 1.5 },
              { dish_name: "Rau muống luộc", quantity: 3.0 },
              { dish_name: "Đậu cô ve luộc", quantity: 1.5 },
            ],
          },
          {
            meal_type: "dinner",
            dishes: [
              { dish_name: "Cơm trắng", quantity: 3.8 },
              { dish_name: "Thịt trâu tươi", quantity: 1.4 },
              { dish_name: "Súp lơ xanh luộc", quantity: 2.5 },
              { dish_name: "Bí ngô luộc", quantity: 2.0 },
            ],
          },
        ],
      },
    ],
  },
];
