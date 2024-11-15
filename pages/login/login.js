// pages/login/login.js
const Bmob = require('../../utils//Bmob-2.3.1.min.js');
Page({
    onLoad() {
        wx.showToast({
            title: '客官，请先登录喔~',
            icon: 'none'
        });
    },
    login() {
        wx.showLoading({
            title: '登录中...'
        });
        // 获取用户信息
        wx.getUserProfile({
            lang: 'zh_CN',
            desc: '授权写锤子检讨书完善用户信息。',
            success(res) {
                wx.hideLoading()
                let name = res.userInfo.nickName;
                let avatarUrl = res.userInfo.avatarUrl;
                let userInfo = {
                        name,
                        avatarUrl
                    }
                    // 储存到本地
                wx.setStorageSync('userInfo', userInfo);
                // wx.reLaunch({
                //     url: '../my/my'
                // })
                wx.navigateBack({
                    delta: 1,
                })
            },
            fail() {
                wx.hideLoading()
                wx.showToast({
                    title: '授权失败！',
                    icon: 'error'
                })
            }
        })
        console.log(0)

    }
})