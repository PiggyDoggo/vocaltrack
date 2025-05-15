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
    console.log('页面加载');
    this.loadStatistics();
  },

  onReady: function() {
    console.log('页面就绪，初始化canvas');
    this.initCanvas();
  },

  async initCanvas() {
    console.log('开始初始化canvas');
    try {
      const sysInfo = wx.getSystemInfoSync();
      const screenWidth = sysInfo.windowWidth;
      const dpr = sysInfo.pixelRatio;
      console.log('设备信息:', { screenWidth, dpr });

      const query = wx.createSelectorQuery();
      query.select('#statisticsChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('canvas查询结果:', res);
          if (!res[0]) {
            console.error('未找到canvas节点');
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置canvas的物理像素大小
          canvas.width = screenWidth * dpr;
          canvas.height = 300 * dpr;
          
          // 设置canvas的实际显示大小
          canvas._width = screenWidth;
          canvas._height = 300;
          
          // 缩放以适应设备像素比
          ctx.scale(dpr, dpr);

          this.canvas = canvas;
          this.ctx = ctx;
          this.canvasWidth = screenWidth;
          this.canvasHeight = 300;

          console.log('canvas初始化完成，尺寸:', {
            width: screenWidth,
            height: 300,
            dpr: dpr
          });
          
          // 初始绘制
          this.updateChart();
        });
    } catch (error) {
      console.error('canvas初始化失败:', error);
    }
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab }, () => {
      this.updateChart();
    });
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
      return total + (record.duration / 3600);  // 直接除以3600转换为小时
    }, 0).toFixed(2);  // 保留两位小数

    this.setData({ weeklyTotal });
  },

  updateChart: function() {
    console.log('开始更新图表');
    const records = wx.getStorageSync('allRecords') || [];
    console.log('获取到的记录数:', records.length);

    let { data, labels } = this.processData(records);
    console.log('处理后的数据:', { data, labels });

    this.drawChart(data, labels);
  },

  processData: function(records) {
    switch(this.data.currentTab) {
      case 'daily':
        return this.getDailyData(records);
      case 'weekly':
        return this.getWeeklyData(records);
      case 'monthly':
        return this.getMonthlyData(records);
      default:
        return this.getDailyData(records);
    }
  },

  getDailyData: function(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twentyDaysAgo = new Date(today);
    twentyDaysAgo.setDate(today.getDate() - 19);

    const data = [];
    const labels = [];
    let totalDuration = 0;
    let totalSessions = 0;

    for (let d = new Date(twentyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const fullDateStr = `${year}-${month}-${day}`;

      // 生成显示用的标签
      if (month === '01' && day === '01') {
        labels.push(`${year}年\n1月\n1日`);
      } else if (day === '01') {
        labels.push(`${month}月\n1日`);
      } else {
        labels.push(day + '日');
      }
      
      const dayRecords = records.filter(r => r.date === fullDateStr);
      const duration = dayRecords.reduce((sum, r) => sum + (r.duration / 3600), 0).toFixed(2);
      data.push(parseFloat(duration));
      
      totalDuration += parseFloat(duration);
      totalSessions += dayRecords.length;
    }

    this.setData({
      currentPeriod: '近20天',
      periodSessions: totalSessions,
      periodDuration: totalDuration.toFixed(2)
    });

    return { data, labels };
  },

  getWeeklyData: function(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay() || 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (currentDay - 1));

    const data = [];
    const labels = [];
    let totalDuration = 0;
    let totalSessions = 0;

    for (let i = 19; i >= 0; i--) {
      const currentWeekStart = new Date(weekStart);
      currentWeekStart.setDate(weekStart.getDate() - (i * 7));
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

      // 获取周一的日期信息
      const year = currentWeekStart.getFullYear();
      const month = String(currentWeekStart.getMonth() + 1).padStart(2, '0');
      const day = String(currentWeekStart.getDate()).padStart(2, '0');

      // 生成显示用的标签
      if (month === '01' && day === '01') {
        labels.push(`${year}年\n1月\n1日`);
      } else if (day === '01') {
        labels.push(`${month}月\n1日`);
      } else {
        labels.push(day + '日');
      }

      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate >= currentWeekStart && recordDate <= currentWeekEnd;
      });

      const duration = weekRecords.reduce((sum, r) => sum + (r.duration / 3600), 0).toFixed(2);
      data.push(parseFloat(duration));

      totalDuration += parseFloat(duration);
      totalSessions += weekRecords.length;
    }

    this.setData({
      currentPeriod: '近20周',
      periodSessions: totalSessions,
      periodDuration: totalDuration.toFixed(2)
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

    for (let i = 19; i >= 0; i--) {
      const monthStart = new Date(currentMonth);
      monthStart.setMonth(monthStart.getMonth() - i);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      // 获取月份信息
      const year = monthStart.getFullYear();
      const month = String(monthStart.getMonth() + 1).padStart(2, '0');

      // 生成显示用的标签
      if (month === '01') {
        labels.push(`${year}年\n1月`);
      } else {
        labels.push(month + '月');
      }

      const monthRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const duration = monthRecords.reduce((sum, r) => sum + (r.duration / 3600), 0).toFixed(2);
      data.push(parseFloat(duration));

      totalDuration += parseFloat(duration);
      totalSessions += monthRecords.length;
    }

    this.setData({
      currentPeriod: '近20月',
      periodSessions: totalSessions,
      periodDuration: totalDuration.toFixed(2)
    });

    return { data, labels };
  },

  drawChart: function(data, labels) {
    console.log('开始绘制图表');
    if (!this.ctx || !this.canvas) {
      console.error('canvas未初始化');
      return;
    }
    
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const padding = 40;
    const bottomPadding = 60;
    const topPadding = 40;

    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 如果没有数据，显示提示文本
    if (!data || data.length === 0 || data.every(value => value === 0)) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#999999';
      ctx.font = '14px Arial';
      ctx.fillText('暂无练习记录', width / 2, height / 2);
      ctx.restore();
      return;
    }

    // 计算柱状图的尺寸
    const chartWidth = width - padding * 2;
    const chartHeight = height - topPadding - bottomPadding;
    
    // 根据屏幕宽度和数据点数量计算柱子宽度和间距
    const totalBars = data.length;
    const minBarWidth = 30;  // 最小柱子宽度
    const minGap = 10;       // 最小间距
    
    // 计算单个数据点占用的总宽度
    const pointWidth = (chartWidth - minGap) / totalBars;
    const barWidth = Math.max(minBarWidth, pointWidth * 0.6);  // 柱子占60%
    const barGap = Math.max(minGap, pointWidth * 0.4);        // 间距占40%

    // 绘制"小时"单位标签
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText('单位：小时', width - padding, topPadding - 5);
    ctx.restore();

    // 找出最大值来确定图表高度
    const maxValue = Math.max(...data, 1);
    
    // 绘制水平网格线和刻度
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const gridLines = 3;
    for (let i = 0; i <= gridLines; i++) {
      const y = topPadding + (chartHeight * (i / gridLines));
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      
      // 绘制刻度值
      const value = Math.round((maxValue * (gridLines - i) / gridLines) * 100) / 100;  // 保留两位小数
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#999999';
      ctx.font = '12px Arial';
      ctx.fillText(value.toFixed(2), padding - 5, y + 4);  // 显示两位小数
      ctx.restore();
    }
    ctx.stroke();

    // 绘制柱状图、数值和x轴标签
    data.forEach((value, index) => {
      const x = padding + (barWidth + barGap) * index;
      const barHeight = value === 0 ? 0 : (value / maxValue) * (chartHeight - 20);
      const y = height - bottomPadding - barHeight;

      // 绘制柱子
      if (value > 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(x, y, barWidth, barHeight);

        // 绘制数值
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText(value.toFixed(2), x + barWidth/2, y - 5);  // 显示两位小数
        ctx.restore();
      }

      // 绘制x轴标签
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      
      const labelX = x + barWidth / 2;
      const labelY = height - bottomPadding + 15;
      
      // 处理多行标签
      const labelParts = labels[index].split('\n');
      const lineHeight = 15;
      
      labelParts.forEach((part, i) => {
        ctx.fillText(part, labelX, labelY + (i * lineHeight));
      });
      
      ctx.restore();
    });
  },

  scrollToLatest: function() {
    // 等待绘制完成后再滚动
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('.chart-container').boundingClientRect();
      query.select('.chart-scroll-container').boundingClientRect();
      query.exec((res) => {
        if (res[0] && res[1]) {
          const chartWidth = res[0].width;
          const containerWidth = res[1].width;
          const scrollLeft = chartWidth - containerWidth;
          
          // 如果有可滚动空间，则滚动到最右端
          if (scrollLeft > 0) {
            wx.createSelectorQuery()
              .select('.chart-scroll-container')
              .node()
              .exec((res) => {
                const scrollView = res[0].node;
                scrollView.scrollLeft = scrollLeft;
              });
          }
        }
      });
    }, 100);
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
    return `${year}-${month}-${day}`;  // 返回完整日期格式 YYYY-MM-DD
  },

  formatMonth: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
});
