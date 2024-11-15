const md5 = require('md5');
const Bmob = require('../../../utils/Bmob-2.3.1.min');
const dayjs = require('dayjs');
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: '', // 状态栏高度
        content: '',
        examplePopupShow: false,
        total_free_usage: 0,
        userRecordObjectId: '',
    },
    // 判断用户类型
    isVip() {
        let user = wx.getStorageSync('userProperty');
        if (user.senior) {
            return true;
        }
        if (user.expire) {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            return user.expire > nowtime ? true : false
        }
        return false;
    },
    async sendContent() {
        if (this.data.content === '') {
            return wx.showToast({ title: '你还没需求内容呀~' })
        }

        // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            return wx.navigateTo({
                url: '../../login/login'
            })
        }

        // 获取用户相关信息
        let updateTime, total_free_usage;
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        let ToadyBeginTime = dayjs().format('YYYY-MM-DD ') + '00:00:00'
        const query = Bmob.Query("z_iOSGPT");
        query.equalTo("uid", "==", userid);
        let res = await query.find();
        if (res.length) {
            console.log(res.length)
            updateTime = res[0].updatedAt; // 上次更新时间
            total_free_usage = res[0].total_free_usage;
            this.data.userRecordObjectId = res[0].objectId;
            // console.log(res)
            console.log(total_free_usage)
            if (updateTime < ToadyBeginTime) {
                updateTime = ToadyBeginTime;
                total_free_usage = 0;
            }
        } else {
            // 数据库无记录
            updateTime = ToadyBeginTime;
            total_free_usage = 0;
            this.data.isCreate = false;
        }

        if (!this.isVip()) {
            // 非会员
            switch (total_free_usage) {
                case 0:
                    // 节流锁
                    this.data.localSend = false;
                    // 提示用户观看广告
                    return wx.showModal({
                        title: '提示',
                        content: '普通用户每天需要观看一个广告免费获得五次对话机会，开通会员可享无广告和更多对话次数。',
                        confirmText: '充值会员',
                        cancelText: '观看广告',
                        success(res) {
                            if (res.confirm) {
                                wx.navigateTo({ url: '../../recharge/recharge' })
                            } else if (res.cancel) {
                                rewardedVideoAd.show()
                                    .then(() => console.log('激励视频 广告显示'));
                            }
                        }
                    });
                    break;
            }
            if (total_free_usage >= 6) {
                // 节流锁
                this.data.localSend = false;
                return wx.showModal({
                    title: '提示',
                    content: '普通用户每天最多有免费五次对话机会，开通会员可享无广告和更多对话次数。',
                    confirmText: '充值会员',
                    cancelText: '取消',
                    success(res) {
                        if (res.confirm) {
                            wx.navigateTo({ url: '../../recharge/recharge' })
                        }
                    }
                });
            }


        } else if (this.isVip()) {
            // 会员
            if (total_free_usage >= 11) {
                let myJtb = await this.getJtb();
                if (myJtb <= 0) {
                    this.data.localSend = false;
                    wx.showToast({ title: '检讨币不足请充值', icon: 'none' })
                        // wx.navigateTo({ url: '../../recharge/recharge' })
                    return 0
                }
            }
        }

        this.data.total_free_usage = total_free_usage;

        // 发起会话
        this.createNewChat()

    },

    // 创建新会话
    createNewChat() {
        wx.showLoading({
            title: 'AI正在绞尽脑汁中...',
            mask: true
        })
        let _that = this;
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId
        let timestamp = Date.now();
        let signKey = wx.getStorageSync('_signKey');
        let sign = md5(signKey + userid + 'mini' + this.data.content + timestamp);
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/ai/send', //https://wxxcxpay.egg404.cn/ai/send
            method: 'POST',
            timeout: 60000,
            data: {
                content: this.data.content,
                userid,
                timestamp,
                chat_id: '',
                sign,
                type: 'mini'
            },
            async success(res) {
                if (res.data.code === 400) {
                    return wx.showToast({
                        title: res.data.msg,
                        icon: 'error'
                    })
                }
                if (res.data.code === 401) {
                    return wx.showToast({
                        title: '提问中存在敏感词汇',
                        icon: 'none'
                    })
                }
                if (res.data.code === 200) {
                    if (_that.isVip()) {
                        if (_that.data.total_free_usage > 11) {
                            // 扣除检讨币
                            let buyResult = await _that.deductJtb(1);
                            if (!buyResult) {
                                return wx.showToast({ title: '扣除检讨币失败！', icon: 'error' })
                            }
                        }
                    }

                    // 消费次数
                    const query2 = Bmob.Query('z_iOSGPT');
                    query2.get(_that.data.userRecordObjectId).then(res2 => {
                        res2.set("total_free_usage", _that.data.total_free_usage + 1)
                        res2.save().then(res2 => {
                            console.log('次数扣除成功！' + (_that.data.total_free_usage + 1));
                        });
                    });
                    // 本地存储
                    let chatList = [{
                        type: 'user',
                        content: _that.data.content
                    }, {
                        type: 'gpt',
                        content: _that.trim(res.data.data.content),
                    }]
                    wx.setStorageSync('chat' + res.data.data.chat_id, chatList)

                    // 云端数据库存储
                    const query = Bmob.Query('mini_chatList');
                    query.set("chat_id", res.data.data.chat_id)
                    query.set("userid", userid)
                    query.set("content", _that.data.content)

                    query.save().then(res2 => {
                        wx.hideLoading()
                        wx.redirectTo({
                            url: '../AiChat/AiChat?chat_id=' + res.data.data.chat_id
                        })
                    }).catch(err => {
                        console.log(err)
                    })
                }
                console.log(res)
            },
            fail() {
                _that.data.localSend = false;
                wx.showToast({
                    title: '当前使用人数过多或者网络不稳定，可能会导致生成时间过长或者失败',
                    icon: 'none'
                })
            }
        })
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
    trim(str) {
        while (str.charAt(0) === "\n") {
            str = str.substring(1);
        }
        return str;
    },
    setExamplePopup() {
        this.setData({
            examplePopupShow: !this.data.examplePopupShow
        })
    },
    closeNoticPopup() {
        this.setData({
            examplePopupShow: false
        })
    },
    useExample() {
        this.setData({
            examplePopupShow: false,
            content: '写一份关于上课睡觉的学生检讨书，要求500字左右，认错态度好，并有相应的改正措施。'
        })
        wx.showToast({
            title: '已自动填入',
            icon: 'success'
        })
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

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-c2bdea68f1a8535a' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((resu) => {
                console.log('onClose event emit', resu)
                if (resu && resu.isEnded) {

                    const query = Bmob.Query('z_iOSGPT');
                    if (_that.data.isCreate) {
                        console.log('is ok')
                        query.equalTo("uid", "==", userid);
                        query.get(_that.data.userRecordObjectId).then(res2 => {
                            res2.set("total_free_usage", 1);
                            res2.save();
                            wx.showToast({ title: '奖励已到账！', icon: 'success' })
                        });
                    } else {
                        query.set("uid", userid)
                        query.set("total_free_usage", 1)
                        query.save().then(res2 => {
                            wx.showToast({ title: '奖励已到账！', icon: 'success' })
                        })
                    }

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