// pages/tools/tools.js
const dayjs = require('dayjs')
let rewardedVideoAd = null;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        toolsList: [],
        toolParams: {}
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
        let that = this;
        wx.request({
            url: 'https://api.egg404.cn/utils-api/api.php?type=get_utils',
            success(res) {
                // console.log(res.data)
                that.setData({
                    toolsList: res.data
                })
            }
        })

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-e0279b5646da2956' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                console.log('onClose event emit', res)
                if (res && res.isEnded) {
                    wx.navigateTo({
                        url: './toolDetail/toolDetail?params=' + encodeURIComponent(JSON.stringify(this.data.toolParams)),
                    })
                    wx.showToast({ title: '广告观看有效！', icon: 'success' })
                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }
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
        // 设置tabbar激活项
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().setData({
                //唯一标识（其它设置不同的整数）  
                active: 2
            })
        }
    },
    toolDetail(e) {
        this.setData({
            toolParams: e.currentTarget.dataset.params,
        });
        console.log(e)
            // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            wx.navigateTo({
                url: '../login/login'
            })
        } else {
            if (e.target.dataset.params.vip) {
                if (!this.isVip()) {
                    return wx.showModal({
                        title: '温馨提示',
                        content: '此功能需要VIP或观看广告后才能使用，确定继续吗？',
                        confirmText: '观看广告',
                        cancelText: '充值会员',
                        success(res) {
                            if (res.confirm) {
                                rewardedVideoAd.show()
                                    .then(() => console.log('激励视频 广告显示'));
                            } else if (res.cancel) {
                                wx.navigateTo({ url: '../recharge/recharge' })
                            }
                        }
                    })
                }
            }
            wx.navigateTo({
                url: './toolDetail/toolDetail?params=' + encodeURIComponent(JSON.stringify(e.currentTarget.dataset.params)),
            })


        }


    },
    // 判断用户类型
    isVip() {
        let status = false;
        let userProperty = wx.getStorageSync('userProperty')
        let senior = userProperty.senior;
        let expire = userProperty.expire;
        if (senior) {
            status = true
        } else {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            status = expire > nowtime ? true : false;
        }
        return status;
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