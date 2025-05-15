Page({
  data: {
    currentTab: 'vocal', // 'vocal' 或 'instrument'
    vocalRanking: [],
    instrumentRanking: []
  },

  onLoad: function (options) {
    this.calculateRanking()
  },

  // 切换标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab
    })
  },

  // 计算排行榜
  calculateRanking: function() {
    const records = wx.getStorageSync('practice_records') || []
    
    // 获取最近一周的记录
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp)
      return recordDate >= weekAgo
    })

    // 按专业分组并计算总时长
    const professionStats = {}
    weekRecords.forEach(record => {
      const key = record.specificProfession
      if (!professionStats[key]) {
        professionStats[key] = {
          name: key,
          totalTime: 0,
          type: record.musicType,
          count: 0
        }
      }
      professionStats[key].totalTime += record.time
      professionStats[key].count += 1
    })

    // 转换为数组并排序
    const rankingList = Object.values(professionStats)
    rankingList.sort((a, b) => b.totalTime - a.totalTime)

    // 分离声乐和器乐排行
    const vocalRanking = rankingList
      .filter(item => item.type === 'vocal')
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))

    const instrumentRanking = rankingList
      .filter(item => item.type === 'instrument')
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))

    this.setData({
      vocalRanking,
      instrumentRanking
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.calculateRanking()
    wx.stopPullDownRefresh()
  }
}) 