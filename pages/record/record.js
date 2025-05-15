// pages/record/record.js
Page({
  data: {
    date: '2023-05-01',
    time: 30,
    comment: '',
    musicProfession: '',
    showAd: false
  },
  onLoad: function (options) {
    // 页面加载时，检查是否需要显示广告
    this.checkAdDisplay();
  },
  // 日期选择器改变事件
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    })
  },
  // 时间滑动输入改变事件
  bindTimeChange: function(e) {
    this.setData({
      time: e.detail.value
    })
  },
  // 训练评价或注释输入事件
  bindCommentInput: function(e) {
    this.setData({
      comment: e.detail.value
    })
  },
  // 音乐专业手动填写栏输入事件
  bindMusicProfessionInput: function(e) {
    this.setData({
      musicProfession: e.detail.value
    })
  },
  // 提交按钮点击事件
  submitRecord: function() {
    // 这里应该添加数据验证逻辑
    // 然后将数据保存到本地存储或发送到后端
    wx.showToast({
      title: '记录已保存',
      icon: 'success',
      duration: 2000
    })
    // 显示简单统计
    this.showSimpleStatistics();
  },
  // 检查是否显示广告
  checkAdDisplay: function() {
    // 这里可以根据用户的打卡情况决定是否显示广告
    // 例如，每周打卡次数少于3次时显示广告
    this.setData({
      showAd: true
    })
  },
  // 显示简单统计
  showSimpleStatistics: function() {
    // 这里应该计算本周训练时长和累计训练次数
    // 然后显示给用户
    wx.showModal({
      title: '本周统计',
      content: '本周训练时长：30小时\n累计训练次数：5次',
      showCancel: false
    })
  }
})
