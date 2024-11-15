// pages/recharge/recharge.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
const md5 = require('md5');
const dayjs = require('dayjs')
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        vipMoney: 0,
        vipType: '',
        jtbList: [],
        vipList: [],
        reChargeCode: '', // 兑换码
        avatarUrl: null,
        name: '',
        userType: '',
        userId: '',
        ggb: 0,
        jtb: 0,
        statusBarHeight: '', // 状态栏高度
        rechargeVipJtbShow: true,
        getVipList: [
            { title: '一小时会员', ggb: 5, type: 'hour', status: false },
            { title: '半天天会员', ggb: 10, type: 'day', status: false }
        ]
    },
    // 兑换会员
    tapGetVipItem(e) {
        let that = this;
        let type = e.currentTarget.dataset.type;
        let userId = JSON.parse(wx.getStorageSync('bmob')).objectId;
        // let currentChoose = this.data.getVipList.find(item => item.type === type);
        // console.log(e)
        // currentChoose.status = !currentChoose.status;
        // this.setData({
        //     getVipList: this.data.getVipList
        // })
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/exchangeVip',
            data: { type, userId },
            method: 'post',
            success(res) {
                console.log(res)
                let status = res.data.code;
                if (status == 0) {
                    return wx.showToast({
                        title: res.data.msg,
                        icon: 'none'
                    })
                } else if (status == 1) {
                    let userProperty = wx.getStorageSync('userProperty');
                    userProperty.ggb = res.data.msg;
                    wx.setStorageSync('userProperty', userProperty);
                    that.setData({
                        ggb: res.data.msg,
                        expire: res.data.expire,
                        userType: 'VIP用户'
                    })
                    Bmob.User.updateStorage(userId);
                    wx.showToast({
                        title: '兑换成功！',
                        icon: 'success',

                    })
                }
            }
        })
    },
    // 观看激励广告
    watchAd() {
        let day = dayjs().format('DD');
        // 默认数据
        let defaultVideoAdData = { day, time: 0 };
        let videoAdData = wx.getStorageSync('videoAdData') || defaultVideoAdData;
        // 判断是否同一日
        videoAdData = videoAdData.day != day ? defaultVideoAdData : videoAdData;
        // 判断次数
        if (videoAdData.time >= 5) {
            return wx.showToast({ title: '休息一会，明天再来吧~', icon: 'none' })
        }
        // 显示广告
        rewardedVideoAd.show()
            .then(() => console.log('激励视频 广告显示'));
    },
    switchVipandjtb() {
        this.setData({
            rechargeVipJtbShow: true
        })
    },
    switchAdReward() {
        this.setData({
            rechargeVipJtbShow: false
        })
    },
    copy() {
        wx.setClipboardData({
            data: this.data.userId,
            success(res) {
                console.log("成功")
            }
        })
    },
    // 判断用户类型
    getUserType() {
        let userProperty = wx.getStorageSync('userProperty')
        let senior = userProperty.senior;
        let expire = userProperty.expire;
        if (senior) {
            var status = '永久会员'
        } else {
            if (expire == '普通用户') {
                var status = expire
            } else {
                let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
                var status = expire > nowtime ? 'VIP用户' : '普通用户';
            }
        }
        this.setData({
            userType: status,
            expire: expire
        })
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },

    // 选择vip
    chooseVip(e) {
        let money = e.currentTarget.dataset.money;
        this.data.vipType = e.currentTarget.dataset.type;
        this.setData({
            vipMoney: money
        })
    },

    // 选择检讨币
    chooseJtb(e) {
        // let money= e.currentTarget.dataset.money;
        let id = e.currentTarget.dataset.id;
        this.data.jtbList.forEach(item => {
            if (item.id == id) {
                item.chooseStatus = !item.chooseStatus;
            }
        })
        this.setData({
            jtbList: this.data.jtbList
        })
    },
    // 充值vip
    rechargeVip() {
        if (this.data.vipMoney == 0) {
            return wx.showToast({
                title: '未选择商品',
                icon: 'error'
            })
        }
        // 获取当前系统信息
        // const system = wx.getSystemInfoSync().platform;
        // console.log(system)
        // if (system === 'ios') {
        //     return wx.showModal({
        //         title: '提示',
        //         content: 'iOS苹果端用户不支持微信支付，如有其它问题或者疑问请联系客服进行处理.',
        //         comfirm: '联系客服',
        //         success(res) {
        //             if (res.confirm) {
        //                 console.log('用户点击确定')
        //             } else if (res.cancel) {
        //                 console.log('用户点击取消')
        //             }
        //         }
        //     })
        // }

        wx.showLoading({ title: '发起支付中...' })
        let openid = wx.getStorageSync('openid');
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        let desc = userid + '购买' + (this.data.vipType == 'vip' ? '季度' : '月费') + '会员';
        // 数据防篡改token生成
        let token = md5('Asnull' + openid + userid + this.data.vipMoney + this.data.vipType + desc)

        // 发起微信支付
        this.wxpay({
            openid,
            userid,
            money: this.data.vipMoney,
            type: this.data.vipType,
            desc,
            token
        })
    },
    // 充值jtb
    rechargeJtb() {
        let new_money = 0;
        let old_money = 0;
        this.data.jtbList.forEach(item => {
            if (item.chooseStatus) {
                new_money += parseFloat(item.new_money);
                old_money += item.old_money;
            }
        })
        if (!new_money) {
            return wx.showToast({
                title: '未选择商品',
                icon: 'error'
            })
        }

        // 获取当前系统信息
        // const system = wx.getSystemInfoSync().platform;
        // console.log(system)
        // if (system === 'ios') {
        //     return wx.showModal({
        //         title: '提示',
        //         content: 'iOS苹果端用户不支持微信支付，如有其它问题或者疑问请联系客服进行处理.',
        //         comfirm: '联系客服',
        //         success(res) {
        //             if (res.confirm) {
        //                 console.log('用户点击确定')
        //             } else if (res.cancel) {
        //                 console.log('用户点击取消')
        //             }
        //         }
        //     })
        // }

        wx.showLoading({ title: '发起支付中...' })

        let openid = wx.getStorageSync('openid');
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        let desc = userid + '充值检讨币';
        // 数据防篡改token生成
        let token = md5('Asnull' + openid + userid + new_money + old_money + desc)

        // 发起微信支付
        this.wxpay({
            openid,
            userid,
            new_money,
            old_money,
            type: 'jtb',
            desc,
            token
        })
    },
    // 兑换码充值
    dhm() {
        let that = this;
        if (this.data.reChargeCode == '') {
            return wx.showToast({ title: '请输入兑换码！', icon: 'error' })
        }
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/useCardKey',
            method: 'POST',
            data: {
                key: this.data.reChargeCode,
                userId: userObj.objectId,
            },
            success(res) {
                console.log(res)
                if (res.data) {
                    that.updateUserInfo()
                    wx.showToast({ title: '充值成功！', icon: 'success' })
                } else {
                    wx.showToast({ title: '兑换码无效！', icon: 'error' })
                }
            }
        })
    },

    // 更新用户信息
    updateUserInfo() {
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        Bmob.User.updateStorage(userObj.objectId);
        // 获取云端用户信息
        user = wx.getStorageSync('bmob');
        userObj = JSON.parse(user)
        const query = Bmob.Query('_User');
        query.get(userObj.objectId).then(res => {
            let jtb = res.jtb || 0;
            let senior = res.senior || false;
            let expire = res.hasOwnProperty('expire') ? res.expire.iso : '普通用户';
            // 用户财富
            let userProperty = {
                    jtb,
                    senior,
                    expire
                }
                // 保存到本地
            wx.setStorageSync('userProperty', userProperty)
        }).catch(err => {
            console.log(err)
        })
    },

    // 发起微信支付
    wxpay(data) {
        let that = this;
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/pay',
            data,
            success(res) {
                wx.hideLoading()
                console.log(res.data)
                wx.requestPayment({
                    timeStamp: res.data.timeStamp,
                    nonceStr: res.data.nonceStr,
                    package: res.data.package,
                    signType: res.data.signType,
                    paySign: res.data.paySign,
                    success(res) {

                        that.updateUserInfo()
                        wx.showModal({
                            title: '充值成功！',
                            content: `您的${data.type == 'jtb'?'检讨币':'VIP会员'}充值成功！共消费${data.money || data.new_money}元，非常感谢您的支持！若充值未到账，请联系客服处理。`,
                            success(res) {
                                if (res.confirm) {
                                    console.log('用户点击确定')
                                } else if (res.cancel) {
                                    console.log('用户点击取消')
                                }
                            }
                        })
                    },
                    fail(res) {
                        wx.hideLoading()
                        wx.showToast({ title: '充值失败！', icon: 'error' })
                        console.log(res)
                    }
                })
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let that = this;

        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px'
        });

        // 判断是否授权过获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        let userObjId = JSON.parse(wx.getStorageSync('bmob'));
        let ggb = wx.getStorageSync('userProperty').ggb;
        if (localUser) {
            this.setData({
                name: localUser.name,
                avatarUrl: localUser.avatarUrl,
                userId: userObjId.objectId,
                jtb: userObjId.jtb,
                ggb
            })
        }

        // 获取用户类型
        this.getUserType();

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-e938cdc8fa3b7c01' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                console.log('onClose event emit', res)
                if (res && res.isEnded) {
                    // 广告次数限制
                    let day = dayjs().format('DD');
                    let defaultVideoAdData = { day, time: 0 };
                    let videoAdData = wx.getStorageSync('videoAdData') || defaultVideoAdData;
                    // 判断是否同一日
                    videoAdData = videoAdData.day != day ? defaultVideoAdData : videoAdData;
                    videoAdData.time += 1;
                    wx.setStorageSync('videoAdData', videoAdData)
                        // 增加广告币
                    let nowggb = wx.getStorageSync('userProperty').ggb || 0;
                    let user = wx.getStorageSync('bmob');
                    let userObj = JSON.parse(user)
                    const query = Bmob.Query('_User');
                    query.set('id', userObj.objectId) //需要修改的objectId
                    query.set('videoAd', nowggb + 1)
                    query.save().then(res => {
                        console.log(res);
                        // 更新本地存储
                        let userProperty = wx.getStorageSync('userProperty');
                        userProperty.ggb = nowggb + 1
                        wx.setStorageSync('userProperty', userProperty);
                        // 更新渲染
                        that.setData({
                            ggb: nowggb + 1
                        })
                        wx.showToast({ title: '成功获得一枚广告币', icon: 'none' })
                    }).catch(err => {
                        wx.showToast({ title: '未知错误', icon: 'error' })
                    })

                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }

        // 加载价格列表
        wx.request({
            url: 'https://article.egg404.cn/config/app_config2.json',
            success(res) {
                console.log(res.data)
                res.data.vous.forEach((item, index) => {
                    if (item.type == 'jtb') {
                        that.data.jtbList.push({ id: index, ...item, chooseStatus: false })
                    } else {
                        that.data.vipList.push(item)
                    }
                })
                that.setData({
                    jtbList: that.data.jtbList,
                    vipList: that.data.vipList
                })
            }
        })
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