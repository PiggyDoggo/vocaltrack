Page({
  data: {
    filter: 'all',
    records: [],
    filteredRecords: [],
    showEvaluation: false,
    currentRecord: null,
    comment: '',
    innerAudioContext: null,
    isPlaying: false,
    currentAudioPath: '',
    currentAudioIndex: -1,
    duration: 0,
    progress: 0,
    currentTime: '00:00',
    durationText: '00:00',
    showMemoModal: false,
    currentMemo: '',
    currentMemoIndex: -1,
    showPlayerPanel: false
  },

  onLoad: function (options) {
    this.initAudioContext();
  },

  onShow: function() {
    this.loadRecords();
  },

  onUnload: function() {
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.destroy();
    }
  },

  // 初始化音频播放器
  initAudioContext: function() {
    const innerAudioContext = wx.createInnerAudioContext();
    
    innerAudioContext.onError((res) => {
      console.error('音频播放错误', res);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });

    innerAudioContext.onTimeUpdate(() => {
      const currentTime = innerAudioContext.currentTime;
      const duration = innerAudioContext.duration;
      this.setData({
        progress: currentTime,
        currentTime: this.formatTime(currentTime),
        duration: duration,
        durationText: this.formatTime(duration)
      });
    });

    innerAudioContext.onEnded(() => {
      this.setData({
        isPlaying: false,
        progress: 0,
        currentTime: '00:00'
      });
    });

    this.setData({ innerAudioContext });
  },

  // 格式化时间
  formatTime: function(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  },

  // 加载记录
  loadRecords: function() {
    let records = wx.getStorageSync('allRecords') || [];
    // 按日期和时间倒序排序
    records.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateB - dateA;
    });
    this.setData({ records }, () => {
      this.filterRecords();
    });
  },

  // 筛选记录
  filterRecords: function() {
    let filteredRecords = this.data.records;
    if (this.data.filter !== 'all') {
      const filterType = this.data.filter === 'vocal' ? '声乐' : '器乐';
      filteredRecords = this.data.records.filter(r => r.musicType.startsWith(filterType));
    }
    this.setData({ filteredRecords });
  },

  // 切换筛选条件
  onFilterChange: function(e) {
    this.setData({
      filter: e.detail.value
    }, () => {
      this.filterRecords();
    });
  },

  // 播放历史录音
  playHistoryRecord: function(e) {
    const audioPath = e.currentTarget.dataset.path;
    const index = e.currentTarget.dataset.index;

    if (!audioPath) {
      wx.showToast({
        title: '录音文件不存在',
        icon: 'none'
      });
      return;
    }

    const innerAudioContext = this.data.innerAudioContext;
    
    // 如果是播放新的音频
    if (this.data.currentAudioPath !== audioPath) {
      innerAudioContext.stop();
      innerAudioContext.src = audioPath;
      this.setData({
        currentAudioPath: audioPath,
        currentAudioIndex: index,
        isPlaying: true,
        showPlayerPanel: true,
        progress: 0,
        currentTime: '00:00'
      });
      innerAudioContext.play();
    } else {
      this.togglePlay();
    }
  },

  // 切换播放/暂停
  togglePlay: function() {
    const innerAudioContext = this.data.innerAudioContext;
    if (this.data.isPlaying) {
      innerAudioContext.pause();
    } else {
      innerAudioContext.play();
    }
    this.setData({
      isPlaying: !this.data.isPlaying
    });
  },

  // 进度条改变
  onSliderChange: function(e) {
    const position = e.detail.value;
    this.data.innerAudioContext.seek(position);
  },

  // 进度条拖动中
  onSliderChanging: function(e) {
    const position = e.detail.value;
    this.setData({
      currentTime: this.formatTime(position)
    });
  },

  // 后退10秒
  rewind10: function() {
    const currentTime = this.data.innerAudioContext.currentTime;
    const newTime = Math.max(0, currentTime - 10);
    this.data.innerAudioContext.seek(newTime);
  },

  // 前进10秒
  forward10: function() {
    const currentTime = this.data.innerAudioContext.currentTime;
    const duration = this.data.duration;
    const newTime = Math.min(duration, currentTime + 10);
    this.data.innerAudioContext.seek(newTime);
  },

  // 点击记录项
  onTapRecord: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.filteredRecords[index];
    
    this.setData({
      currentAudioIndex: index,
      currentAudioPath: record.path,
      showPlayerPanel: true,
      isPlaying: false
    });

    // 准备音频
    const innerAudioContext = this.data.innerAudioContext;
    innerAudioContext.stop();
    innerAudioContext.src = record.path;
  },

  // 保存评价
  saveEvaluation: function() {
    if (!this.data.comment.trim()) {
      wx.showToast({
        title: '请填写练习评价',
        icon: 'none'
      });
      return;
    }

    let records = wx.getStorageSync('practice_records') || [];
    const index = records.findIndex(r => r.id === this.data.currentRecord.id);
    
    if (index !== -1) {
      records[index].comment = this.data.comment;
      wx.setStorageSync('practice_records', records);
      
      this.setData({
        showEvaluation: false,
        currentRecord: null,
        comment: ''
      });

      this.loadRecords();

      wx.showToast({
        title: '评价已保存',
        icon: 'success'
      });
    }
  },

  // 取消评价
  cancelEvaluation: function() {
    this.setData({
      showEvaluation: false,
      currentRecord: null,
      comment: ''
    });
  },

  // 显示备忘录弹窗
  showMemoModal: function() {
    const index = this.data.currentAudioIndex;
    const record = this.data.filteredRecords[index];
    this.setData({
      showMemoModal: true,
      currentMemo: record.memo || '',
      currentMemoIndex: index
    });
  },

  // 备忘录输入
  bindMemoInput: function(e) {
    this.setData({
      currentMemo: e.detail.value
    });
  },

  // 保存备忘录
  saveMemo: function() {
    const index = this.data.currentAudioIndex;
    const memo = this.data.currentMemo.trim();
    
    let records = wx.getStorageSync('allRecords') || [];
    const record = this.data.filteredRecords[index];
    const recordIndex = records.findIndex(r => 
      r.date === record.date && 
      r.time === record.time
    );

    if (recordIndex !== -1) {
      records[recordIndex].memo = memo;
      wx.setStorageSync('allRecords', records);
      
      this.setData({
        showMemoModal: false,
        currentMemo: '',
        currentMemoIndex: -1
      });

      this.loadRecords();

      wx.showToast({
        title: '备忘已保存',
        icon: 'success'
      });
    }
  },

  // 取消备忘录
  cancelMemo: function() {
    this.setData({
      showMemoModal: false,
      currentMemo: '',
      currentMemoIndex: -1
    });
  },

  // 删除记录
  deleteRecord: function() {
    const index = this.data.currentAudioIndex;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('allRecords') || [];
          // 删除录音文件
          const record = records[index];
          if (record && record.path) {
            wx.removeSavedFile({
              filePath: record.path,
              complete: (res) => {
                console.log('删除录音文件结果：', res);
              }
            });
          }
          
          records.splice(index, 1);
          wx.setStorageSync('allRecords', records);
          
          // 停止播放并隐藏面板
          this.data.innerAudioContext.stop();
          this.setData({
            currentAudioPath: '',
            currentAudioIndex: -1,
            isPlaying: false,
            showPlayerPanel: false
          });
          
          this.loadRecords();
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 评价输入事件
  bindCommentInput: function(e) {
    this.setData({
      comment: e.detail.value
    });
  }
}); 