import express from "express";
import cors from "cors"
import { config } from "dotenv";
import { router as userRouter } from "./modules/user/user.route";
import { router as authRouter } from "./modules/auth/auth.route";
import { router as dailyPlanRouter } from "./modules/daily-plan/daily-plan.route";
import { router as dishRouter } from "./modules/dish/dish.route";
import { router as nutrientRouter } from "./modules/nutrient/nutrient.route";
import { router as suggestPlanRouter } from "./modules/suggest-plan/suggest-plan.route";
import { router as adminDashboardRouter } from "./modules/admin-dashboard/admin-dashboard.route";


config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/daily-plans", dailyPlanRouter);
app.use("/dishes", dishRouter);
app.use("/nutrients", nutrientRouter);
app.use("/suggest-plans", suggestPlanRouter);
app.use("/admin/dashboard", adminDashboardRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});