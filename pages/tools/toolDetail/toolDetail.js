// pages/tools/toolDetail/toolDetail.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        params: {},
        inputText: '',
        isFocus: false,
        hint: '输入',
        content: ''
    },
    copy() {
        wx.setClipboardData({
            data: this.data.content,
            success(res) {
                console.log("成功")
            }
        })
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },
    // 输入框获得焦点时
    inputGetFocus(e) {
        // console.log(e)
        this.data.isFocus = 'getFocus';
        this.setData({
            isFocus: this.data.isFocus
        })
    },
    // 输入框失去焦点时
    inputLoseFocus(e) {
        this.data.isFocus = '';
        this.setData({
            isFocus: this.data.isFocus
        })
    },
    make() {
        let that = this;
        wx.request({
            url: this.data.params.api + `&${this.data.params.params[0].name}=${this.data.inputText || this.data.params.params[0].def}`,
            success(res) {
                console.log(res)
                that.setData({
                    content: res.data
                })
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log(options.params)
            // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px',
            toolName: options.name,
            params: JSON.parse(decodeURIComponent(options.params))
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