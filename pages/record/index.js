Page({
  data: {
    date: '',
    todayRecordsCount: 0,
    todayRecords: [],
    selectedProfession: '',
    
    // 级联选择器数据
    multiArray: [
      ['器乐', '声乐'],
      ['钢琴', '小提琴', '中提琴', '大提琴', '低音提琴', '长笛', '单簧管', '双簧管', '萨克斯', '小号', '圆号', '长号', '打击乐', '古筝', '琵琶', '二胡', '笛子', '扬琴', '吉他', '贝斯', '尤克里里', '手风琴', '民乐综合', '西洋乐综合']
    ],
    multiIndex: [0, 0],
    subCategories: {
      '器乐': ['钢琴', '小提琴', '中提琴', '大提琴', '低音提琴', '长笛', '单簧管', '双簧管', '萨克斯', '小号', '圆号', '长号', '打击乐', '古筝', '琵琶', '二胡', '笛子', '扬琴', '吉他', '贝斯', '尤克里里', '手风琴', '民乐综合', '西洋乐综合'],
      '声乐': ['美声', '民族', '流行', '戏曲']
    }
  },

  onLoad: function() {
    this.setTodayDate();
  },

  onShow: function() {
    this.loadTodayRecords();
  },

  // 设置当天日期
  setTodayDate: function() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      date: `${year}-${month}-${day}`
    });
  },

  // 加载今日记录
  loadTodayRecords: function() {
    const records = wx.getStorageSync('practice_records') || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    this.setData({
      todayRecords: todayRecords,
      todayRecordsCount: todayRecords.length
    });
  },

  // 级联选择器列改变事件
  bindMultiPickerColumnChange: function(e) {
    const data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    
    // 如果改变第一列
    if (e.detail.column === 0) {
      // 根据第一列的值设置第二列的数据
      const firstCategory = data.multiArray[0][data.multiIndex[0]];
      data.multiArray[1] = this.data.subCategories[firstCategory];
      data.multiIndex[1] = 0;
    }
    
    this.setData(data);
  },

  // 级联选择器选择完成事件
  bindMultiPickerChange: function(e) {
    this.setData({
      multiIndex: e.detail.value
    });
    const category = this.data.multiArray[0][this.data.multiIndex[0]];
    const subCategory = this.data.multiArray[1][this.data.multiIndex[1]];
    
    this.setData({
      selectedProfession: subCategory
    });
  },

  // 添加新记录
  addNewRecord: function() {
    if (this.data.todayRecordsCount >= 3) {
      wx.showToast({
        title: '今日记录已达上限',
        icon: 'none'
      });
      return;
    }

    if (!this.data.selectedProfession) {
      wx.showToast({
        title: '请先选择专业',
        icon: 'none'
      });
      return;
    }

    const category = this.data.multiArray[0][this.data.multiIndex[0]];
    
    // 跳转到记录详情页
    wx.navigateTo({
      url: `/pages/record/detail?musicType=${category === '声乐' ? 'vocal' : 'instrument'}&specificProfession=${this.data.selectedProfession}`
    });
  },

  // 查看记录详情
  viewRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/record/detail?recordId=${recordId}&mode=view`
    });
  }
}); 