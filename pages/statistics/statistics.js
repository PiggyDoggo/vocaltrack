// pages/statistics/statistics.js
Page({
  data: {
    weeklyTotal: 0,
    consecutiveDays: 0,
    currentTab: 'daily',
    currentPeriod: '本期',
    periodSessions: 0,
    periodDuration: 0,
    chartData: []
  },

  onLoad: function() {
    this.loadStatistics();
  },

  onReady: function() {
    // 在页面就绪后初始化canvas
    this.initCanvas();
  },

  async initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#statisticsChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 根据屏幕像素比调整canvas大小
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.canvasWidth = res[0].width;
        this.canvasHeight = res[0].height;

        // 初始绘制
        this.updateChart();
      });
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.updateChart();
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

    // 计算最近七天的统计
    this.calculateRecentStats(records);
    
    // 计算连续打卡天数
    const consecutiveDays = this.calculateConsecutiveDays(records);
    this.setData({ consecutiveDays });
  },

  calculateRecentStats: function(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const weeklyRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= sevenDaysAgo && recordDate <= today;
    });

    const weeklyTotal = weeklyRecords.reduce((total, record) => {
      return total + Math.round(record.duration / 3600);
    }, 0);

    this.setData({ weeklyTotal });
  },

  updateChart: function() {
    if (!this.ctx) return;

    const records = wx.getStorageSync('allRecords') || [];
    let data = [];
    let labels = [];

    switch (this.data.currentTab) {
      case 'daily':
        ({ data, labels } = this.getDailyData(records));
        break;
      case 'weekly':
        ({ data, labels } = this.getWeeklyData(records));
        break;
      case 'monthly':
        ({ data, labels } = this.getMonthlyData(records));
        break;
    }

    this.drawChart(data, labels);
  },

  getDailyData: function(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const data = [];
    const labels = [];
    let totalDuration = 0;
    let totalSessions = 0;

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDate(d);
      labels.push(dateStr);
      
      const dayRecords = records.filter(r => r.date === dateStr);
      const duration = dayRecords.reduce((sum, r) => sum + Math.round(r.duration / 3600), 0);
      data.push(duration);
      
      totalDuration += duration;
      totalSessions += dayRecords.length;
    }

    this.setData({
      currentPeriod: '近30天',
      periodSessions: totalSessions,
      periodDuration: totalDuration
    });

    return { data, labels };
  },

  getWeeklyData: function(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay() || 7;
    today.setDate(today.getDate() - (currentDay - 1));

    const data = [];
    const labels = [];
    let totalDuration = 0;
    let totalSessions = 0;

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      const duration = weekRecords.reduce((sum, r) => sum + Math.round(r.duration / 3600), 0);
      labels.push(this.formatDate(weekStart));
      data.push(duration);

      totalDuration += duration;
      totalSessions += weekRecords.length;
    }

    this.setData({
      currentPeriod: '近12周',
      periodSessions: totalSessions,
      periodDuration: totalDuration
    });

    return { data, labels };
  },

  getMonthlyData: function(records) {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const data = [];
    const labels = [];
    let totalDuration = 0;
    let totalSessions = 0;

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentMonth);
      monthStart.setMonth(monthStart.getMonth() - i);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const duration = monthRecords.reduce((sum, r) => sum + Math.round(r.duration / 3600), 0);
      labels.push(this.formatMonth(monthStart));
      data.push(duration);

      totalDuration += duration;
      totalSessions += monthRecords.length;
    }

    this.setData({
      currentPeriod: '近12月',
      periodSessions: totalSessions,
      periodDuration: totalDuration
    });

    return { data, labels };
  },

  drawChart: function(data, labels) {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const padding = 40;
    const bottomPadding = 60;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 根据不同的时间维度设置刻度间隔
    let scaleInterval;
    switch(this.data.currentTab) {
      case 'daily':
        scaleInterval = 1; // 按日显示时以1小时为间隔
        break;
      case 'weekly':
        scaleInterval = 5; // 按周显示时以5小时为间隔
        break;
      case 'monthly':
        scaleInterval = 10; // 按月显示时以10小时为间隔
        break;
      default:
        scaleInterval = 1;
    }

    // 找出最大值来确定y轴刻度
    const maxValue = Math.max(...data, 1);
    const yAxisSteps = 5;
    // 计算合适的最大刻度值，确保是间隔的整数倍
    const yAxisMax = Math.ceil(maxValue / (scaleInterval * yAxisSteps)) * (scaleInterval * yAxisSteps);

    // 计算柱状图的尺寸
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding - bottomPadding;
    const barWidth = Math.min(30, (chartWidth / data.length) * 0.8);
    const barGap = (chartWidth - barWidth * data.length) / (data.length + 1);

    // 绘制"小时"单位标签
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('单位：小时', width - padding, padding - 10);
    ctx.restore();

    // 绘制y轴
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= yAxisSteps; i++) {
      const y = padding + (chartHeight * i / yAxisSteps);
      const value = (yAxisMax / yAxisSteps) * (yAxisSteps - i) / scaleInterval * scaleInterval;
      
      // 绘制横向网格线
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      
      // 绘制y轴刻度值
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(Math.round(value), padding - 5, y + 4);
      ctx.restore();
    }
    ctx.stroke();

    // 绘制柱状图和x轴标签
    data.forEach((value, index) => {
      const x = padding + barGap + (barWidth + barGap) * index;
      const barHeight = (value / yAxisMax) * chartHeight;
      const y = height - bottomPadding - barHeight;

      // 绘制柱子
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x, y, barWidth, barHeight);

      // 绘制x轴标签
      ctx.save();
      ctx.translate(x + barWidth/2, height - bottomPadding + 10);
      ctx.rotate(Math.PI/4);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(labels[index], 0, 0);
      ctx.restore();
    });
  },

  calculateConsecutiveDays: function(records) {
    if (records.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
  },

  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatMonth: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
});
