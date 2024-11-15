// pages/my/my.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
const dayjs = require('dayjs');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        name: '微信游客',
        avatarUrl: null,
        senior: false, // 是否永久会员
        userType: '普通用户',
        expire: '普通用户',
        ggb: 0,
        jtb: 0,
        loading: '',
        dataInfo: '',
        statusBarHeight: '', // 状态栏高度
    },
    gotoRecharge() {
        wx.navigateTo({
            url: '../recharge/recharge'
        })
    },

    // 判断用户类型
    getUserType() {
        if (this.data.senior) {
            var status = '永久会员'
        } else {
            let expire = this.data.expire;
            if (expire == '普通用户') {
                var status = expire
            } else {
                let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
                var status = expire > nowtime ? 'VIP用户' : '普通用户';
            }
        }
        this.setData({
            userType: status
        })
    },

    copy() {
        wx.setClipboardData({
            data: this.data.objectId,
            success(res) {
                console.log("成功")
            }
        })
    },
    toMakeTemplate() {
        wx.navigateTo({
            url: '../makeTemplate/makeTemplate'
        })
    },
    toAbout() {
        wx.navigateTo({
            url: '../about/about'
        })
    },
    toMyBuy() {
        wx.navigateTo({
            url: '../myBuy/myBuy'
        })
    },
    gzhshow() {
        wx.showModal({
            title: '关注B站',
            content: 'B站搜索《写锤子检讨书APP》进行关注，获取我们的最新动态',
            success(res) {
                if (res.confirm) {
                    wx.setClipboardData({
                        data: "写锤子检讨书APP",
                        success(res) {
                            console.log("成功")
                        }
                    })
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })
    },
    downapp() {
        wx.navigateTo({
            url: '../web/web?url=https://mp.weixin.qq.com/s/qn9VgpKT1NHwgvxEyxC6Sg'
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px'
        });
        // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            wx.navigateTo({
                url: '../login/login'
            })
        }

        // 获取云端用户信息
        // let user = wx.getStorageSync('bmob');
        // let userObj = JSON.parse(user)
        // console.log(userObj)
        // const query = Bmob.Query('_User');
        // query.get(userObj.objectId).then(res => {
        //     let jtb = res.jtb || 0;
        //     let ggb = res.videoAd || 0;
        //     let senior = res.senior || false;
        //     let objectId = res.objectId
        //     let expire = res.hasOwnProperty('expire') ? res.expire.iso : '普通用户';
        //     // 用户财富
        //     let userProperty = {
        //             jtb,
        //             senior,
        //             expire,
        //             ggb
        //         }
        //         // 更新数据
        //     this.setData({...userProperty, objectId })
        //         // 更新用户身份
        //     this.getUserType()
        //         // 保存到本地
        //     wx.setStorageSync('userProperty', userProperty)
        // }).catch(err => {
        //     console.log(err)
        // })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        // 设置tabbar激活项
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().setData({
                //唯一标识（其它设置不同的整数）  
                active: 3
            })
        }

        // 判断是否授权过获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (localUser) {
            this.setData({
                name: localUser.name,
                avatarUrl: localUser.avatarUrl
            })
        }



        // 获取云端用户信息
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
            // Bmob.User.updateStorage(userObj.objectId);
        console.log(userObj)
        const query = Bmob.Query('_User');
        query.get(userObj.objectId).then(res => {
            let jtb = res.jtb || 0;
            let ggb = res.videoAd || 0;
            let senior = res.senior || false;
            let objectId = res.objectId
            let expire = res.hasOwnProperty('expire') ? res.expire.iso : '普通用户';
            // 用户财富
            let userProperty = {
                    jtb,
                    senior,
                    expire,
                    ggb
                }
                // 更新数据
            this.setData({...userProperty, objectId })
                // 更新用户身份
            this.getUserType()
                // 保存到本地
            wx.setStorageSync('userProperty', userProperty)
        }).catch(err => {
            console.log(err)
        })

        // 获取最新的用户财富
        let userProperty = wx.getStorageSync('userProperty');
        // 更新数据
        // this.setData(userProperty);
        // 更新用户身份
        // this.getUserType()



    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})