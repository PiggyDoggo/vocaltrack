// pages/statistics/statistics.js
Page({
  data: {
    weeklyTotal: 0,
    consecutiveDays: 0
  },

  onLoad: function() {
    this.loadStatistics();
  },

  loadStatistics: function() {
    const records = wx.getStorageSync('allRecords') || [];
    if (records.length === 0) {
      this.setData({
        weeklyTotal: 0,
        consecutiveDays: 0
      });
      return;
    }

    // 计算最近七天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 获取7天前的日期（包含今天）

    // 过滤并计算最近七天的训练记录
    const weeklyRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= sevenDaysAgo && recordDate <= today;
    });

    // 计算总时长（转换为分钟）
    const weeklyTotal = weeklyRecords.reduce((total, record) => {
      return total + Math.round(record.duration / 60); // duration 是以秒为单位存储的
    }, 0);

    // 计算连续打卡天数
    const consecutiveDays = this.calculateConsecutiveDays(records);

    this.setData({
      weeklyTotal,
      consecutiveDays
    });
  },

  calculateConsecutiveDays: function(records) {
    if (records.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取不重复的日期列表
    const dates = [...new Set(records.map(record => record.date))];
    dates.sort((a, b) => new Date(b) - new Date(a));

    let consecutiveDays = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      
      const diffDays = Math.round((currentDate - nextDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }
});
