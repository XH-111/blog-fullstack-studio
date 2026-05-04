const { prisma } = require("../db");

function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function incrementDailyMetric(dateKey, data) {
  return prisma.dailyMetric.upsert({
    where: { dateKey },
    update: data,
    create: {
      dateKey,
      ...Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value.increment || 0])
      ),
    },
  });
}

module.exports = {
  getTodayDateKey,
  incrementDailyMetric,
};
