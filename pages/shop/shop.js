// pages/shop/shop.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
const dayjs = require('dayjs');
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        bannerList: [],
        page: 1, // 默认第一页
        limit: 16, // 每页条数
        templateList: [],
        isFree: true,
        isactive: true,
        statusBarHeight: '', // 状态栏高度
    },

    // 搜索跳转
    search() {
        wx.navigateTo({
            url: '../search/search'
        })
    },

    // 加载轮播图
    getBanner() {
        const query = Bmob.Query("Banner");
        query.find().then(res => {
            console.log(res)
            this.setData({
                bannerList: res
            })
        });
    },

    // 点击轮播图
    tapBanner(e) {

        let link = e.currentTarget.dataset.link;
        console.log(link)
        let dia = e.currentTarget.dataset.dia;
        wx.showModal({
            title: '提示',
            content: dia,
            success(res) {
                if (res.confirm) {
                    console.log('用户点击确定')
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })
    },

    // 获取免费按钮
    getFree(e) {
        console.log(e)
        this.data.templateList = [];
        this.data.page = 1;
        this.data.isFree = true;
        this.setData({
                isactive: true
            })
            // 加载数据
        this.getTemplate(this.data.isFree)
    },

    // 获取付费
    getNotFree() {
        this.data.templateList = [];
        this.data.page = 1;
        this.data.isFree = false;
        this.setData({
                isactive: false
            })
            // 加载数据
        this.getTemplate(this.data.isFree)
    },

    // 加载数据函数
    getTemplate(isFree) {
        wx.showLoading({ title: '数据加载中...', })
        let skip = (this.data.page - 1) * this.data.limit;
        const query = Bmob.Query("Template");
        if (isFree) {
            query.equalTo("jtb", "==", 0);
        } else {
            query.equalTo("jtb", "!=", 0);
        }
        query.order("-createdAt");
        query.limit(this.data.limit);
        query.skip(skip);
        query.find().then(res => {
            console.log(res)
            wx.hideLoading()
            if (res.length <= 0) {
                wx.showToast({
                    title: '没有更多啦！',
                    icon: 'error'
                })
                return 0;
            }
            this.data.page++
                let newArr = [...this.data.templateList, ...res]
            this.setData({
                templateList: newArr
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
        console.log(item);

        // 是否已经导入检测
        if (this.isAlreadyImport(item)) {
            return wx.showToast({ title: '此模板已导入过', icon: 'error' });
        }

        // 判断是否已经购买
        if (await this.isBUy(item)) {
            return wx.showModal({
                title: '模板导入提示',
                content: '检测到您已经购买了此模板，是否直接导入？',
                confirmText: "是",
                cancelText: '否',
                success(res) {
                    if (res.confirm) {
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
                    }
                }
            })
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
    // 判断是否已经购买
    async isBUy(item) {
        let user = wx.getStorageSync('bmob');
        let userid = JSON.parse(user).objectId;
        const query = Bmob.Query("OrderForm");
        query.equalTo("template", "==", item.objectId);
        query.equalTo("userid", "==", userid);
        let count = await query.count();
        if (count >= 1) return true;
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
        // 加载轮播图
        this.getBanner()
            // 加载数据
        this.getTemplate(this.data.isFree)

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
        // 设置tabbar激活项
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().setData({
                //唯一标识（其它设置不同的整数）  
                active: 1
            })

        }
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
        // 加载数据
        this.getTemplate(this.data.isFree)
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})