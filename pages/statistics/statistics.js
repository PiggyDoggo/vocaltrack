// pages/statistics/statistics.js
Page({
  data: {
    weeklyData: [],
    monthlyData: [],
    yearlyData: [],
    weeklyAverage: 0,
    consecutiveDays: 0,
    motivationalText: '继续保持，你是最棒的！',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName')
  },
  onLoad: function() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    // 模拟获取数据
    this.getMockData();
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  generateCard: function() {
    // 这里应该生成打卡卡片的逻辑
    wx.showToast({
      title: '打卡卡片已生成',
      icon: 'success',
      duration: 2000
    })
  },
  saveCardToAlbum: function() {
    // 这里应该保存卡片到相册的逻辑
    wx.showToast({
      title: '卡片已保存到相册',
      icon: 'success',
      duration: 2000
    })
  },
  shareCard: function() {
    // 这里应该分享卡片的逻辑
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },
  getMockData: function() {
    // 模拟获取数据
    this.setData({
      weeklyData: [120, 150, 130, 170, 140, 160, 150],
      monthlyData: [100, 120, 140, 130, 150, 160, 170, 180, 190, 200, 180, 170, 160, 150, 140, 130, 120, 110, 100, 120, 130, 140, 150, 160, 170, 180, 190, 200, 180, 170],
      yearlyData: [100, 120, 140, 130, 150, 160, 170, 180, 190, 200, 180, 170],
      weeklyAverage: 145,
      consecutiveDays: 7
    })
  }
})
