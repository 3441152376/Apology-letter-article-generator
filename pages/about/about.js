// pages/about/about.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: '', // 状态栏高度
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },

    copy() {
        wx.setClipboardData({
            data: '686166711',
            success(res) {
                console.log("成功")
            }
        })
    },
    kf() {
        wx.openCustomerServiceChat({
            extInfo: { url: 'https://work.weixin.qq.com/kfid/kfc0e735f52c80dd146' },
            corpId: 'wwa0b60477f0b44c66',
            success(res) {}
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