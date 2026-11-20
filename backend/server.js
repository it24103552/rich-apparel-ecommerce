const app = require("./src/app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
});
