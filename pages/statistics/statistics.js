// pages/statistics/statistics.js
Page({
  data: {
    weeklyData: [],
    monthlyData: [],
    yearlyData: [],
    weeklyAverage: 0,
    consecutiveDays: 0
  },

  onLoad: function() {
    // 获取数据
    this.getMockData();
  },

  getMockData: function() {
    // 模拟获取数据
    this.setData({
      weeklyData: [120, 150, 130, 170, 140, 160, 150],
      monthlyData: [100, 120, 140, 130, 150, 160, 170, 180, 190, 200, 180, 170, 160, 150, 140, 130, 120, 110, 100, 120, 130, 140, 150, 160, 170, 180, 190, 200, 180, 170],
      yearlyData: [100, 120, 140, 130, 150, 160, 170, 180, 190, 200, 180, 170],
      weeklyAverage: 145,
      consecutiveDays: 7
    });
  }
});
