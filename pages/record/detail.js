Page({
  data: {
    date: '',
    totalDuration: 0,
    comment: '',
    musicType: '',
    specificProfession: '',
    showEvaluation: false,
    recording: null,
    isRecording: false,
    recordingDuration: 0,
    recorderManager: null,
    innerAudioContext: null,
    mode: 'add', // 'add' 或 'view'
    recordId: null
  },

  onLoad: function (options) {
    this.setTodayDate();
    this.initRecorder();
    this.initAudioContext();

    // 设置专业信息
    if (options.musicType && options.specificProfession) {
      this.setData({
        musicType: options.musicType,
        specificProfession: options.specificProfession
      });
    }

    // 如果是查看模式
    if (options.mode === 'view' && options.recordId) {
      this.setData({
        mode: 'view',
        recordId: options.recordId
      });
      this.loadRecord(options.recordId);
    } else {
      // 初始化空录音
      this.setData({
        recording: { path: '', duration: 0 }
      });
    }
  },

  onUnload: function() {
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.destroy();
    }
  },

  // 加载已有记录
  loadRecord: function(recordId) {
    const records = wx.getStorageSync('practice_records') || [];
    const record = records.find(r => r.id === recordId);
    if (record) {
      this.setData({
        musicType: record.musicType,
        specificProfession: record.specificProfession,
        recording: record.recording,
        totalDuration: record.time,
        comment: record.comment || ''
      });
    }
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

  // 初始化录音管理器
  initRecorder: function() {
    const recorderManager = wx.getRecorderManager();
    
    recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({
        isRecording: true
      });
    });

    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      
      this.setData({
        isRecording: false,
        recording: {
          path: res.tempFilePath,
          duration: this.data.recordingDuration
        },
        recordingDuration: 0
      });
      
      // 更新总时长
      this.calculateTotalDuration();
    });

    recorderManager.onError((res) => {
      console.error('录音错误', res);
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
      this.setData({
        isRecording: false
      });
      this.stopTimer();
    });

    this.setData({ recorderManager });
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

    innerAudioContext.onEnded(() => {
      console.log('音频播放结束');
    });

    this.setData({ innerAudioContext });
  },

  // 切换录音状态
  toggleRecording: function() {
    if (this.data.isRecording) {
      this.stopRecord();
    } else {
      this.startRecord();
    }
  },

  // 开始录音
  startRecord: function() {
    const that = this;
    
    // 检查录音权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              that.startRecordAfterPermission();
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要录音权限才能录制练习音频，是否前往设置开启权限？',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (res) => {
                        if (res.authSetting['scope.record']) {
                          that.startRecordAfterPermission();
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          that.startRecordAfterPermission();
        }
      }
    });
  },

  // 获得权限后开始录音
  startRecordAfterPermission: function() {
    this.data.recorderManager.start({
      duration: 10800000, // 最长录音时间，3小时
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3'
    });
    
    // 开始计时
    this.startTimer();
  },

  // 停止录音
  stopRecord: function() {
    this.data.recorderManager.stop();
    this.stopTimer();
  },

  // 开始计时器
  startTimer: function() {
    this.setData({ recordingDuration: 0 });
    this.timer = setInterval(() => {
      this.setData({
        recordingDuration: this.data.recordingDuration + 1
      });
    }, 1000);
  },

  // 停止计时器
  stopTimer: function() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // 播放录音
  playRecord: function() {
    const recording = this.data.recording;
    
    if (!recording || !recording.path) {
      wx.showToast({
        title: '没有录音文件',
        icon: 'none'
      });
      return;
    }

    const innerAudioContext = this.data.innerAudioContext;
    innerAudioContext.stop();
    innerAudioContext.src = recording.path;
    innerAudioContext.play();
  },

  // 删除录音
  deleteRecording: function() {
    this.setData({
      recording: { path: '', duration: 0 },
      totalDuration: 0
    });
  },

  // 计算总时长
  calculateTotalDuration: function() {
    const recording = this.data.recording;
    const totalSeconds = recording ? (recording.duration || 0) : 0;
    const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;
    
    this.setData({
      totalDuration: totalMinutes
    });
  },

  // 评价输入事件
  bindCommentInput: function(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  // 提交记录
  submitRecord: function() {
    if (!this.data.recording || !this.data.recording.path) {
      wx.showToast({
        title: '请先录制音频',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showEvaluation: true
    });
  },

  // 保存评价和记录
  saveEvaluation: function() {
    const recordData = {
      id: Date.now(),
      date: this.data.date,
      time: this.data.totalDuration,
      comment: this.data.comment,
      musicType: this.data.musicType,
      specificProfession: this.data.specificProfession,
      timestamp: Date.now(),
      recording: this.data.recording,
      createTime: new Date().toLocaleTimeString()
    };

    try {
      // 获取现有记录
      let records = wx.getStorageSync('practice_records') || [];
      records.unshift(recordData);
      wx.setStorageSync('practice_records', records);

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    } catch (e) {
      console.error('保存记录失败', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }

    this.setData({
      showEvaluation: false,
      comment: ''
    });
  },

  // 取消评价
  cancelEvaluation: function() {
    this.setData({
      showEvaluation: false,
      comment: ''
    });
  }
}); 