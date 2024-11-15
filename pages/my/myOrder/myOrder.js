const Bmob = require('../../../utils/Bmob-2.3.1.min');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: '', // 状态栏高度
        oderList: []
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
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

        // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            return wx.navigateTo({
                url: '../../login/login'
            })
        }

        // 查询订单
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId
        const query = Bmob.Query("wxOrder");
        query.equalTo("userid", "==", userid);
        query.find().then(res => {
            if (res.length <= 0) {
                wx.showToast({
                    title: '暂无订单喔~',
                    icon: 'error'
                })
            }
            console.log(res)
            this.setData({
                orderList: res
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
        // 查询订单
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId
        const query = Bmob.Query("wxOrder");
        query.order("-createdAt");
        query.equalTo("userid", "==", userid);
        query.find().then(res => {
            console.log(res)
            if (res.length <= 0) {
                wx.showToast({
                    title: '暂无订单喔~',
                    icon: 'error'
                })
            }
            this.setData({
                orderList: res
            })
        });
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