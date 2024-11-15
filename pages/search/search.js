// pages/search/search.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
const dayjs = require('dayjs');
let rewardedVideoAd = null;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        keyword: "",
        templateList: [],
        statusBarHeight: '', // 状态栏高度
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },


    // 搜索
    search() {

        let keyword = this.data.keyword;
        const query = Bmob.Query("Template");
        query.equalTo("name", "==", { "$regex": "" + keyword + ".*" });
        query.find().then(res => {
            console.log(res)
            if (res.length <= 0) {
                return wx.showToast({
                    title: '找不到呀，换个姿势试试~',
                    icon: 'none'
                })
            }
            this.setData({
                templateList: res
            })
        });
    },
    // 点击模板项
    async tapTemplate(e) {
        // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            wx.navigateTo({
                url: '../login/login'
            })
            return wx.showToast({ title: '请先进行用户授权！', icon: 'error' });
        }
        let item = e.currentTarget.dataset.template;
        console.log(item)
            // 是否已经导入检测
        if (this.isAlreadyImport(item)) {
            return wx.showToast({ title: '此模板已导入过', icon: 'error' });
        }
        // 弹窗提醒
        this.importShow(item)
    },

    // 导入弹窗提示
    importShow(item) {
        let that = this;
        let content = `您正在导入此模板：${item.name}\n发布人：${item.author}\n创建时间：${item.createdAt}\n\n花费检讨币：${item.jtb}\n\n是否继续导入？`
        wx.showModal({
            title: '模板导入提示',
            content,
            confirmText: "是",
            cancelText: '否',
            success(res) {
                if (res.confirm) {
                    // 调用导入函数
                    that.importTemplate(item)

                }
            }
        })
    },

    // 模板导入函数
    async importTemplate(item) {
        // 判断是否收费模板
        if (item.jtb) {
            // 收费
            let myJtb = await this.getJtb();
            console.log(myJtb)
            if (myJtb < item.jtb) {
                return wx.showToast({ title: '您的检讨币不足', icon: 'error' });
            }
            let buyResult = await this.deductJtb(item.jtb);
            if (buyResult) {
                // 写入订单信息
                this.recordBuy(item)
            }
        } else {
            // 观看激励广告
            var isWatchAd = wx.getStorageSync('isWatchAd') || false;
            if (!this.isVip()) {
                if (!isWatchAd) {
                    // 关闭提示
                    wx.hideLoading()
                    return wx.showModal({
                        title: '导入提醒',
                        content: '非会员用户需观看一次广告才能免费获得一次导入机会',
                        confirmText: "观看广告",
                        cancelText: '充值会员',
                        success(res) {
                            if (res.confirm) {
                                rewardedVideoAd.show()
                                    .then(() => console.log('激励视频 广告显示'));
                            } else if (res.cancel) {
                                wx.navigateTo({
                                    url: '../recharge/recharge'
                                })
                            }
                        }
                    })
                }
            }
        }
        wx.setStorageSync('isWatchAd', false);
        // 导入到首页模板
        let myTemplate = wx.getStorageSync('myTemplate');
        if (myTemplate) {
            myTemplate.unshift({ name: item.name, objectId: item.objectId })
            wx.setStorageSync('myTemplate', myTemplate)
            wx.showToast({ title: '模板导入成功！', icon: 'success' })
        } else {
            wx.setStorageSync('myTemplate', [{ name: item.name, objectId: item.objectId }])
            wx.showToast({ title: '模板导入成功！', icon: 'success' })
        }
    },
    // 判断是否已经导入
    isAlreadyImport(item) {
        let myTemplate = wx.getStorageSync('myTemplate');
        if (!myTemplate) {
            return false;
        }
        let isEexist = myTemplate.some(existItem => {
            return existItem.objectId == item.objectId;
        })
        if (isEexist) {
            return true
        }
        return false;
    },

    // 获取我的检讨币
    async getJtb() {
        // 获取云端用户信息
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        const query = Bmob.Query('_User');
        let res = await query.get(userObj.objectId);
        // console.log(res.jtb)
        return res.jtb || 0;
    },
    // 消费检讨币
    async deductJtb(jtb) {
        let nowJtb = await this.getJtb();
        // console.log(nowJtb)
        let newJtb = nowJtb - jtb
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        const query = Bmob.Query('_User');
        query.set('id', userObj.objectId)
        query.set('jtb', newJtb)
        let res = await query.save();
        // 修改本地记录
        let userProperty = wx.getStorageSync('userProperty');
        userProperty.jtb = newJtb;
        wx.setStorageSync('userProperty', userProperty)
        return res.updatedAt;
    },
    // 写入模板购买记录
    async recordBuy(item) {
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        const query = Bmob.Query('OrderForm');
        query.set("userid", userObj.objectId)
        query.set("name", item.name)
        query.set("template", item.objectId)
        let res = query.save()
        console.log(res)
        return res.updatedAt;
    },
    // 判断用户类型
    isVip() {
        let user = JSON.parse(wx.getStorageSync('bmob'));
        if (user.senior) {
            return true;
        }
        if (user.expire) {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            return user.expire.iso > nowtime ? true : false
        }
        return false;
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
        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-26b5f5b43c50986a' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                console.log('onClose event emit', res)
                if (res && res.isEnded) {
                    wx.setStorageSync('isWatchAd', true);
                    wx.showToast({ title: '获得一次导入机会', icon: 'none' })
                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

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