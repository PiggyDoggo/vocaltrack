// pages/record/record.js
const MAX_DAILY_RECORDS = 3;

// 定义音乐门类数据
const musicTypes = {
  unselected: {
    name: '未选择',
    subtypes: ['请选择音乐门类']
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
  },
  vocal: {
    name: '声乐',
    subtypes: ['美声', '民族', '流行', '戏曲']
  }
};

Page({
  data: {
    currentDate: '',
    musicTypeArray: [
      ['未选择', '器乐', '声乐'],
      ['请选择音乐门类']
    ],
    musicTypeIndex: [0, 0],
    todayRecordsCount: 0,
    audioFile: null, // 存储上传的音频文件信息
    audioDuration: 0, // 音频时长（秒）
    audioName: '', // 音频文件名
  },

  onLoad: function () {
    this.setCurrentDate();
    this.loadTodayRecords();
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
      let subTypes;
      switch(value) {
        case 0:
          subTypes = musicTypes.unselected.subtypes;
          break;
        case 1:
          subTypes = musicTypes.instrumental.subtypes;
          break;
        case 2:
          subTypes = musicTypes.vocal.subtypes;
          break;
      }

      // 更新数据
      this.setData({
        'musicTypeArray[1]': subTypes,
        'musicTypeIndex[0]': value,
        'musicTypeIndex[1]': 0
      });

      // 如果选择了"未选择"，显示提示
      if (value === 0) {
        wx.showToast({
          title: '请选择音乐门类',
          icon: 'none'
        });
      }
    } else {
      this.setData({
        'musicTypeIndex[1]': value
      });
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

  // 选择音频文件
  handleChooseAudio: function() {
    if (this.data.todayRecordsCount >= MAX_DAILY_RECORDS) {
      wx.showToast({
        title: '今日上传已达上限',
        icon: 'none'
      });
      return;
    }

    if (this.data.musicTypeIndex[0] === 0) {
      wx.showToast({
        title: '请先选择音乐门类',
        icon: 'none'
      });
      return;
    }

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'm4a'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        console.log('选择的文件：', tempFile);

        // 检查文件大小（限制为100MB）
        if (tempFile.size > 100 * 1024 * 1024) {
          wx.showToast({
            title: '文件大小不能超过100MB',
            icon: 'none'
          });
          return;
        }

        // 获取音频时长
        const audioContext = wx.createInnerAudioContext();
        audioContext.src = tempFile.path;
        
        audioContext.onCanplay(() => {
          // 更新文件信息
          this.setData({
            audioFile: tempFile,
            audioName: tempFile.name,
            audioDuration: Math.floor(audioContext.duration)
          });
          audioContext.destroy();
          
          // 自动保存
          this.saveAudioFile();
        });

        audioContext.onError((err) => {
          console.error('音频文件错误：', err);
          wx.showToast({
            title: '不支持的音频格式',
            icon: 'none'
          });
          audioContext.destroy();
        });
      },
      fail: (err) => {
        console.error('选择文件失败：', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 保存音频文件
  saveAudioFile: function() {
    if (!this.data.audioFile) {
      wx.showToast({
        title: '请先选择音频文件',
        icon: 'none'
      });
      return;
    }

    const recordData = {
      id: Date.now(),
      date: this.data.currentDate,
      musicType: `${this.data.musicTypeArray[0][this.data.musicTypeIndex[0]]} - ${this.data.musicTypeArray[1][this.data.musicTypeIndex[1]]}`,
      duration: this.data.audioDuration,
      path: this.data.audioFile.path,
      name: this.data.audioFile.name,
      createTime: new Date().toLocaleTimeString()
    };

    try {
      let records = wx.getStorageSync('allRecords') || [];
      records.unshift(recordData);
      wx.setStorageSync('allRecords', records);

      this.setData({
        audioFile: null,
        audioDuration: 0,
        audioName: '',
        todayRecordsCount: this.data.todayRecordsCount + 1
      });

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
      console.error('保存文件失败', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  loadTodayRecords: function () {
    const records = wx.getStorageSync('allRecords') || [];
    const today = this.data.currentDate;
    const todayRecords = records.filter(record => record.date === today);
    this.setData({
      todayRecordsCount: todayRecords.length
    });
  }
});
