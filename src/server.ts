import express from "express";
import memberRoutes from "./routes/memberRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use('/api', memberRoutes);

app.use("/teams", teamRoutes);

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});