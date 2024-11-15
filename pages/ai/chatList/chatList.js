const Bmob = require('../../../utils/Bmob-2.3.1.min');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: '', // 状态栏高度
        chatList: [],
        PopupShow: false
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },
    Popup() {
        this.setData({
            PopupShow: !this.data.PopupShow
        })
    },
    noShowGptNotice() {
        wx.setStorageSync('noShowGptNotice', true);
        wx.showToast({
            title: '将不再提示',
            icon: 'success'
        })
        this.setData({ PopupShow: false })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px'
        });

        let gptNotice = wx.getStorageSync('noShowGptNotice');
        if (!gptNotice) {
            this.setData({ PopupShow: true })
        }

        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId

        // 获取对话列表
        const query = Bmob.Query("mini_chatList");
        query.equalTo("userid", "==", userid);
        query.order("-createdAt");
        query.find().then(res => {
            if (res.length === 0) {
                wx.redirectTo({
                    url: '../AiMake/AiMake',
                })
            }
            this.setData({
                chatList: res
            })
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})