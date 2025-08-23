import express from "express"
import userRoutes from "./routes/userRoutes.js"

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use('/user', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`)
})