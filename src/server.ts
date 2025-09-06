import express from "express";
import memberRoutes from "./routes/memberRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
const app = express();
app.use("/api/tasks", taskRoutes);
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", memberRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
