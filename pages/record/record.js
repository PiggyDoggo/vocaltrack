// pages/record/record.js
const MAX_RECORD_TIME = 10800; // 3小时 = 10800秒
const MAX_DAILY_RECORDS = 3;

// 定义音乐门类数据
const musicTypes = {
  vocal: {
    name: '声乐',
    subtypes: ['美声', '民族', '流行', '戏曲']
  },
  instrumental: {
    name: '器乐',
    subtypes: [
      '钢琴', '小提琴', '中提琴', '大提琴', '低音提琴',
      '长笛', '单簧管', '双簧管', '萨克斯', '小号',
      '圆号', '长号', '打击乐', '古筝', '琵琶',
      '二胡', '笛子', '扬琴', '吉他', '贝斯',
      '尤克里里', '手风琴', '民乐综合', '西洋乐综合'
    ]
  }
};

Page({
  data: {
    currentDate: '',
    musicTypeArray: [
      ['器乐', '声乐'],
      []
    ],
    musicTypeIndex: [0, 0],
    isRecording: false,
    isPaused: false,
    recordPath: '',
    recordDuration: 0,
    recordTimeText: '00:00:00',
    todayRecordsCount: 0,
    recorderManager: null,
    timer: null
  },

  onLoad: function () {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager();
    this.initRecorderListeners();
    this.setCurrentDate();
    this.loadTodayRecords();
    
    // 初始化音乐门类选择器的子分类
    this.setSubTypes(0);
  },

  // 设置子分类数据
  setSubTypes: function(typeIndex) {
    const subTypes = typeIndex === 0 ? musicTypes.instrumental.subtypes : musicTypes.vocal.subtypes;
    this.setData({
      'musicTypeArray[1]': subTypes
    });
  },

  // 处理音乐门类选择改变
  bindMusicTypeChange: function(e) {
    const values = e.detail.value;
    this.setData({
      musicTypeIndex: values
    });
  },

  // 处理音乐门类列改变
  bindMusicColumnChange: function(e) {
    const column = e.detail.column;
    const value = e.detail.value;
    
    if (column === 0) {
      // 当第一列改变时，更新第二列的数据
      this.setSubTypes(value);
      // 重置第二列的选择
      this.setData({
        musicTypeIndex: [value, 0]
      });
    }
  },

  onUnload: function () {
    // 页面卸载时清理
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    if (this.data.isRecording && !this.data.isPaused) {
      this.recorderManager.stop();
    }
  },

  setCurrentDate: function () {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.setData({
      currentDate: `${year}-${month}-${day}`
    });
  },

  initRecorderListeners: function () {
    // 录音开始事件
    this.recorderManager.onStart(() => {
      this.setData({
        isRecording: true,
        isPaused: false,
        recordDuration: this.data.recordDuration || 0
      });
      this.startTimer();
    });

    // 录音暂停事件
    this.recorderManager.onPause(() => {
      this.setData({
        isPaused: true
      });
      if (this.data.timer) {
        clearInterval(this.data.timer);
      }
    });

    // 录音继续事件
    this.recorderManager.onResume(() => {
      this.setData({
        isPaused: false
      });
      this.startTimer();
    });

    // 录音结束事件
    this.recorderManager.onStop((res) => {
      this.setData({
        isRecording: false,
        isPaused: false,
        recordPath: res.tempFilePath
      });
      if (this.data.timer) {
        clearInterval(this.data.timer);
      }
    });

    // 录音错误事件
    this.recorderManager.onError((res) => {
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
      this.setData({
        isRecording: false,
        isPaused: false
      });
      if (this.data.timer) {
        clearInterval(this.data.timer);
      }
    });
  },

  startTimer: function () {
    const timer = setInterval(() => {
      let duration = this.data.recordDuration + 1;
      if (duration >= MAX_RECORD_TIME) {
        this.handleStopTap();
        return;
      }
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      this.setData({
        recordDuration: duration,
        recordTimeText: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      });
    }, 1000);
    this.setData({ timer });
  },

  handleRecordTap: function () {
    // 检查是否达到每日记录上限
    if (this.data.todayRecordsCount >= MAX_DAILY_RECORDS) {
      wx.showToast({
        title: '今日录音已达上限',
        icon: 'none'
      });
      return;
    }
    
    this.recorderManager.start({
      duration: MAX_RECORD_TIME * 1000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3'
    });
  },

  handlePauseTap: function() {
    if (this.data.isPaused) {
      this.recorderManager.resume();
    } else {
      this.recorderManager.pause();
    }
  },

  handleStopTap: function() {
    this.recorderManager.stop();
  },

  loadTodayRecords: function () {
    const records = wx.getStorageSync('allRecords') || [];
    const today = this.data.currentDate;
    const todayRecords = records.filter(record => record.date === today);
    this.setData({
      todayRecordsCount: todayRecords.length
    });
  },

  submitRecord: function() {
    if (!this.data.recordPath) {
      wx.showToast({
        title: '请先录制音频',
        icon: 'none'
      });
      return;
    }

    if (this.data.todayRecordsCount >= MAX_DAILY_RECORDS) {
      wx.showToast({
        title: '今日录音已达上限',
        icon: 'none'
      });
      return;
    }

    const recordData = {
      id: Date.now(),
      date: this.data.currentDate,
      musicType: `${this.data.musicTypeArray[0][this.data.musicTypeIndex[0]]} - ${this.data.musicTypeArray[1][this.data.musicTypeIndex[1]]}`,
      duration: this.data.recordDuration,
      path: this.data.recordPath,
      createTime: new Date().toLocaleTimeString()
    };

    try {
      let records = wx.getStorageSync('allRecords') || [];
      records.unshift(recordData);
      wx.setStorageSync('allRecords', records);

      this.setData({
        recordPath: '',
        recordDuration: 0,
        recordTimeText: '00:00:00',
        todayRecordsCount: this.data.todayRecordsCount + 1
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (e) {
      console.error('保存录音失败', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
});
